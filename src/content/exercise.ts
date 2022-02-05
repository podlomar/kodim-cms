import path from "path";
import { promises as fs, existsSync } from "fs";
import yaml from "yaml";
import lineReader from "line-reader";
import { ExerciseFrontMatter } from "../entries.js";
import { el, getChildren, getTag, isElement, Jsml, JsmlElement } from "../jsml.js";
import { createBaseEntry, createChildLocation, EntryLocation, LeafEntry } from "./entry.js";
import { BaseResourceProvider, NotFoundProvider, ProviderSettings } from "./provider.js";
import { Access } from "./access.js";
import { LessonSectionProvider } from "./lesson-section.js";
import { MarkdownProcessor } from "../markdown.js";
import { createBaseResource, Crumbs, Resource } from "./resource.js";

export type ExerciseEntry = LeafEntry<{
  demand: 1 | 2 | 3 | 4 | 5;
  num: number;
}>;

export type ExerciseResource = Resource<{
  demand: 1 | 2 | 3 | 4 | 5;
  num: number;
  assignJsml: Jsml,
  solutionJsml: Jsml,
}>;

export interface ExerciseAssign {
  demand: 1 | 2 | 3 | 4 | 5;
  num: number;
  jsml: Jsml,
};

const loadFrontMatter = async <T>(filePath: string): Promise<T> =>
  new Promise((resolve, reject) => {
    let inside = false;
    let lines = "";
    lineReader.eachLine(filePath, 
      (line) => {
        if (inside) {
          if (line.startsWith("---")) {
            resolve(yaml.parse(lines));
            return false;
          }
          lines += `${line}\n`;
          return true;
        }
        if (line.startsWith("---")) {
          inside = true;
        }
        return true;
      },
      reject,
    );
  });

const loadAssign = async(filePath: string): Promise<string> =>
  new Promise((resolve, reject) => {
    let opened = 0;
    let lines = "";
    lineReader.eachLine(filePath, 
      (line: string, last: boolean) => {
        lines += `${line}\n`;
        
        if (last) {
          resolve(lines);
        }

        const trimmed = line.trim();
        
        if (trimmed === ":::") {
          opened -= 1;
          if (opened === 0) {
            resolve(lines);
            return false;
          }

          return true;
        }

        if (trimmed.startsWith(":::")) {
          opened += 1;
        }
        return true;
      },
      reject,
    );
  });

const getExcFilePath = (fsPath: string): string | null => {
  const standalone = `${fsPath}.md`;
  if (existsSync(standalone)) {
    return standalone;
  }

  const inFolder = `${fsPath}/exercise.md`;
  if (existsSync(inFolder)) {
    return inFolder;
  }

  return null;
}

export const loadExercise = async (
  parentLocation: EntryLocation,
  link: string,
  pos: number,
): Promise<ExerciseEntry> => {
  const fsPath = path.join(parentLocation.fsPath, '..', link.replace('>', '/'));
  const assignPath = getExcFilePath(fsPath);
  const location = createChildLocation(parentLocation, link, fsPath);

  if (assignPath === null) {
    return {
      nodeType: 'broken',
      ...createBaseEntry(location, link, {})
    }
  }

  const frontMatter = await loadFrontMatter<ExerciseFrontMatter>(
    assignPath,
  );
  
  return {
    nodeType: 'leaf',
    ...createBaseEntry(
      location,
      link,
      {
        demand: frontMatter.demand,
        num: pos + 1,
      },
      frontMatter.title
    )
  };
}

export class ExerciseProvider extends BaseResourceProvider<
  LessonSectionProvider, ExerciseEntry, never
> {
  private markdownProcessor: MarkdownProcessor;

  constructor(
    parent: LessonSectionProvider, 
    entry: ExerciseEntry, 
    position: number, 
    crumbs: Crumbs,
    access: Access,
    settings: ProviderSettings,
  ) {
    super(parent, entry, position, crumbs, access, settings);
    this.markdownProcessor = new MarkdownProcessor(
      this.buildAssetPath,
    );
  }

  public find(link: string): NotFoundProvider {
    return new NotFoundProvider();
  }

  private buildAssetPath = (fileName: string): string => {
    const baseUrl = this.settings.baseUrl;
    return `${baseUrl}/assets${this.entry.location.path}/${fileName}`;
  }

  public async fetch(): Promise<ExerciseResource> {
    const baseResource = createBaseResource(this.entry,
      this.crumbs,
      this.settings.baseUrl
    );
    
    if (!this.access.accepts()) {
      return {
        ...baseResource,
        status: 'forbidden',
        content: {
          type: this.entry.nodeType === 'broken' ? 'broken' : 'public',
        }
      };
    }
    
    if (this.entry.nodeType === 'broken') {
      return {
        ...baseResource,
        status: 'ok',
        content: {
          type: 'broken',
        }
      };
    }
    
    const assignPath = getExcFilePath(this.entry.location.fsPath);
    if (assignPath === null) {
      throw new Error('no assign file found');
    }

    const jsml = await this.markdownProcessor.process(assignPath);
    const firstNode = jsml[0];
    const secondNode = jsml[1] ?? '';
    
    const assignJsml = isElement(firstNode) && getTag(firstNode) === 'assign'
      ? getChildren(firstNode)
      : jsml;

    const solutionJsml = isElement(secondNode) && getTag(secondNode) === 'solution'
      ? getChildren(secondNode)
      : [];

    return {
      ...baseResource,
      status: 'ok',
      content: {
        type: 'full',
        demand: this.entry.props.demand,
        num: this.entry.props.num,
        assignJsml,
        solutionJsml,
      },
    };
  }

  public async fetchAssign(): Promise<JsmlElement> {
    const excPath = getExcFilePath(this.entry.location.fsPath);
    if (excPath === null) {
      throw new Error('no assign file found');
    }    
    if (this.entry.nodeType === 'broken') {
      return ['error'];
    }

    const assignText = await loadAssign(excPath);
    const jsml = await this.markdownProcessor.processString(assignText);

    const attrs = {
      num: this.entry.props.num,
      title: this.entry.title,
      path: this.access.accepts() ? this.entry.location.path : 'forbidden',
      demand: this.entry.props.demand,
    };

    const firstNode = jsml[0];
    const content = isElement(firstNode) && getTag(firstNode) === 'assign'
      ? getChildren(firstNode)
      : jsml;

    return el(
      'exc', 
      attrs,
      ...content,
    )
  }

  public findRepo(repoUrl: string): null {
    return null;
  }
}

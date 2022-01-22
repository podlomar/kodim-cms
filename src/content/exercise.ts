import path from "path";
import { promises as fs, existsSync } from "fs";
import yaml from "yaml";
import lineReader from "line-reader";
import { ExerciseFrontMatter } from "../entries.js";
import { el, getChildren, getTag, isElement, Jsml, JsmlElement } from "../jsml.js";
import { createFailedEntry, createSuccessEntry, FailedEntry, SuccessEntry } from "./entry.js";
import { BaseResourceProvider, NotFoundProvider, ProviderSettings } from "./provider.js";
import { LessonSectionProvider } from "./lesson-section.js";
import { MarkdownProcessor } from "../markdown.js";
import { createNotFound, Crumbs, NotFound } from "./resource.js";

export interface SuccessExercise extends SuccessEntry {
  demand: 1 | 2 | 3 | 4 | 5;
  num: number;
};

export type Exercise = SuccessExercise | FailedEntry;

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
        console.log('line', line);
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

const getAssignFilePath = (fsPath: string): string | null => {
  const standalone = `${fsPath}.md`;
  if (existsSync(standalone)) {
    return standalone;
  }

  const inFolder = `${fsPath}/assign.md`;
  if (existsSync(inFolder)) {
    return inFolder;
  }

  return null;
}

export const loadExercise = async (
  parentEntry: SuccessEntry,
  entryPath: string,
  pos: number,
): Promise<Exercise> => {
  const fsPath = path.join(parentEntry.fsPath, '..', entryPath);
  const link = entryPath.replace('/', ':');

  const assignPath = getAssignFilePath(fsPath);
  
  if (assignPath === null) {
    return createFailedEntry(parentEntry, link, fsPath);
  }
  console.log('assingPath', assignPath);

  const frontMatter = await loadFrontMatter<ExerciseFrontMatter>(
    assignPath,
  );

  console.log('frontMatter', frontMatter);
  const baseEntry = createSuccessEntry(parentEntry, link, frontMatter.title, fsPath);

  return {
    ...baseEntry,
    demand: frontMatter.demand,
    num: pos + 1,
  }
}

export class ExerciseProvider extends BaseResourceProvider<
  LessonSectionProvider, Exercise, never
> {
  private markdownProcessor: MarkdownProcessor;

  constructor(
    parent: LessonSectionProvider, 
    entry: Exercise, 
    position: number, 
    crumbs: Crumbs,
    settings: ProviderSettings,
  ) {
    super(parent, entry, position, crumbs, settings);
    this.markdownProcessor = new MarkdownProcessor(
      this.buildAssetPath,
    );
  }

  public async fetch(): Promise<NotFound> {
    return createNotFound();
  }

  public find(link: string): NotFoundProvider {
    return new NotFoundProvider();
  }

  private buildAssetPath = (fileName: string): string => {
    const baseUrl = this.settings.baseUrl;
    return `${baseUrl}/assets${this.entry.path}/${fileName}`;
  }

  public async fetchEntry(): Promise<Exercise> {
    // const filePath = path.join(
    //   this.parent.location.fsPath,
    //   'assign.md',
    // );
    // const assignHtml = await readAssignFile(`${filePath}/assign.md`);

    // return {
    //   ...createBaseEntry(this.location),
    //   demand: this.frontMatter.demand,
    //   assignHtml,
    //   solutionHtml: "<p>solution</p>",
    // };

    // @ts-ignore
    return null;
  }

  public async fetchAssign(): Promise<JsmlElement> {
    const assignPath = getAssignFilePath(this.entry.fsPath);
    if (assignPath === null) {
      throw new Error('no assign file found');
    }    
    if (this.entry.type === 'failed') {
      return ['error'];
    }
    
    const assignText = await loadAssign(assignPath);
    const jsml = await this.markdownProcessor.processString(assignText);

    const attrs = {
      num: this.entry.num,
      title: this.entry.title,
      path: this.entry.path,
      demand: this.entry.demand
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

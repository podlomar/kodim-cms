import path from "path";
import { promises as fs, existsSync } from "fs";
import yaml from "yaml";
import lineReader from "line-reader";
import { ExerciseFrontMatter } from "../entries.js";
import { el, getChildren, getTag, isElement, Jsml, JsmlElement } from "../jsml.js";
import { BaseEntry, createBaseEntry, createBrokenEntry, LeafEntry } from "./entry.js";
import { BaseResourceProvider, NotFoundProvider, ProviderSettings } from "./provider.js";
import { AccessCheck } from "./access-check.js";
import { LessonSectionProvider } from "./lesson-section.js";
import { MarkdownProcessor } from "../markdown.js";
import { createBaseResource, Crumbs, Resource } from "./resource.js";

export type ExerciseEntry = LeafEntry<{
  demand: 1 | 2 | 3 | 4 | 5;
  num: number;
  draftSolution: boolean;
}>;

export type ExerciseResource = Resource<{
  demand: 1 | 2 | 3 | 4 | 5;
  num: number;
  draftSolution: boolean;
  assignJsml: Jsml,
  solutionJsml: Jsml,
}>;

export interface ExerciseAssign {
  demand: 1 | 2 | 3 | 4 | 5;
  num: number;
  draftSolution: boolean;
  jsml: Jsml,
};

const loadFrontMatter = async <T>(filePath: string): Promise<T> =>
  new Promise((resolve, reject) => {
    let inside = false;
    let lines = "";
    lineReader.eachLine(filePath,
      (line) => {
        if (inside) {
          if (line.trim().startsWith("---")) {
            resolve(yaml.parse(lines));
            return false;
          }
          lines += `${line}\n`;
          return true;
        }
        if (line.trim().startsWith("---")) {
          inside = true;
        }
        return true;
      },
      reject,
    );
  });

interface ExerciseParts {
  assign: string,
  solution?: string,
}

const loadExerciseParts = async (filePath: string): Promise<ExerciseParts> =>
  new Promise((resolve, reject) => {
    const parts: ExerciseParts = {
      assign: '',
    };

    lineReader.eachLine(filePath,
      (line: string, last: boolean) => {
        if (line.trim() === "---solution") {
          parts.solution = '';
          return true;
        }

        if (parts.solution === undefined) {
          parts.assign += `${line}\n`;
        } else {
          parts.solution += `${line}\n`;
        }

        if (last) {
          resolve(parts);
          return false;
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
  parentBase: BaseEntry,
  link: string,
  pos: number,
): Promise<ExerciseEntry> => {
  const fsPath = path.join(parentBase.fsPath, '..', link.replace('>', '/'));
  const assignPath = getExcFilePath(fsPath);

  if (assignPath === null) {
    return createBrokenEntry(parentBase, link);
  }

  const frontMatter = await loadFrontMatter<ExerciseFrontMatter>(
    assignPath,
  );

  return {
    nodeType: 'leaf',
    ...createBaseEntry(parentBase, frontMatter, link, fsPath),
    props: {
      demand: frontMatter.demand,
      num: pos + 1,
      draftSolution: frontMatter.draftSolution || false,
    },
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
    accessCheck: AccessCheck,
    settings: ProviderSettings,
  ) {
    super(parent, entry, position, crumbs, accessCheck, settings);
    this.markdownProcessor = new MarkdownProcessor(
      this.buildAssetPath,
    );
  }

  public find(link: string): NotFoundProvider {
    return new NotFoundProvider();
  }

  private buildAssetPath = (fileName: string): string => {
    const baseUrl = this.settings.baseUrl;
    return `${baseUrl}/assets${this.entry.path}/${fileName}`;
  }

  public async fetch(): Promise<ExerciseResource> {
    const baseResource = createBaseResource(this.entry,
      this.crumbs,
      this.settings.baseUrl
    );

    if (!this.accessCheck.accepts()) {
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

    const excPath = getExcFilePath(this.entry.fsPath);
    if (excPath === null) {
      return {
        ...baseResource,
        status: 'ok',
        content: {
          type: 'broken',
        }
      };
    }

    const parts = await loadExerciseParts(excPath);
    const assignJsml = await this.markdownProcessor.processString(parts.assign);
    const solutionJsml = parts.solution === undefined
      ? []
      : await this.markdownProcessor.processString(parts.solution);

    return {
      ...baseResource,
      status: 'ok',
      content: {
        type: 'full',
        demand: this.entry.props.demand,
        num: this.entry.props.num,
        draftSolution: this.entry.props.draftSolution,
        assignJsml,
        solutionJsml,
      },
    };
  }

  public async fetchAssign(): Promise<JsmlElement> {
    const excPath = getExcFilePath(this.entry.fsPath);
    if (excPath === null || this.entry.nodeType === 'broken') {
      return el(
        'excerr',
        { link: this.entry.link },
      )
    }

    const parts = await loadExerciseParts(excPath);
    const jsml = await this.markdownProcessor.processString(parts.assign);

    const attrs = {
      num: this.entry.props.num,
      title: this.entry.title,
      link: this.entry.link,
      path: this.accessCheck.accepts() ? this.entry.path : 'forbidden',
      demand: this.entry.props.demand,
      draftSolution: this.entry.props.draftSolution,
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

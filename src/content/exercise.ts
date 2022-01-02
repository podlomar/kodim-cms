import path from "path";
import { promises as fs, existsSync } from "fs";
import yaml from "yaml";
import lineReader from "line-reader";
import { ExerciseFrontMatter } from "../entries.js";
import { el, Jsml, JsmlElement } from "../jsml.js";
import { createFailedEntry, createSuccessEntry, FailedEntry, SuccessEntry } from "./entry.js";
import { BaseResourceProvider, NotFoundProvider, ProviderSettings } from "./provider.js";
import { LessonSectionProvider } from "./lesson-section.js";
import { MarkdownProcessor } from "../markdown.js";
import { createNotFoundResource, Crumbs, NotFoundResource } from "./resource.js";

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
  link: string,
  pos: number,
): Promise<Exercise> => {
  const fsPath = path.join(parentEntry.fsPath, "../excs", link);
  const assignPath = getAssignFilePath(fsPath);
  
  if (assignPath === null) {
    return createFailedEntry(parentEntry, link, fsPath);
  }

  const frontMatter = await loadFrontMatter<ExerciseFrontMatter>(
    assignPath,
  );

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

  public async fetch(): Promise<NotFoundResource> {
    return createNotFoundResource();
  }

  public find(link: string): NotFoundProvider {
    return new NotFoundProvider();
  }

  private buildAssetPath(fileName: string): string {
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
    
    const jsml = await this.markdownProcessor.process(assignPath);

    return el(
      'exc', 
      {
        num: this.entry.num,
        title: this.entry.title,
        demand: this.entry.demand
      }, 
      ...jsml,
    )
  }
}

import path from 'path';
import { promises as fs, existsSync } from "fs";
import yaml from "yaml";
import lineReader from "line-reader";
import { EntryBase, LeafEntry, RefableEntry } from '@filefish/core/dist/entry.js';
import { EntryLoader } from '@filefish/core/dist/loader.js';
import { BaseContent, ContentRef, createBaseContent, createCrumbs, Crumbs } from './content.js';
import { el, getChildren, getTag, isElement, Jsml, JsmlElement } from './jsml.js';
import { MarkdownProcessor } from './markdown.js';

export type Demand = 1 | 2 | 3 | 4 | 5;

export interface Exercise extends BaseContent {
  readonly crumbs: Crumbs;
  readonly demand: Demand;
  readonly num: number;
  readonly assignJsml: Jsml,
  readonly solutionJsml: Jsml,
};

interface ExerciseParts {
  assign: string,
  solution: string | null,
}

export interface ExerciseFrontMatter {
  readonly title: string;
  readonly demand: Demand;
  readonly draftSolution?: boolean;
}

export class ExerciseEntry extends LeafEntry<Exercise> { 
  private frontMatter: ExerciseFrontMatter
  private markdownProcessor: MarkdownProcessor;

  public constructor(
    base: EntryBase,
    frontMatter: ExerciseFrontMatter,
    mardownProcessor: MarkdownProcessor
  ) {
    super(base);
    this.frontMatter = frontMatter;
    this.markdownProcessor = mardownProcessor;
  }

  private async loadParts(): Promise<ExerciseParts> {
    const filePath = this.base.fsType === 'file'
      ? this.base.fsPath
      : path.join(this.base.fsPath, 'exercise.md');
    
    return new Promise((resolve, reject) => {
      const parts: ExerciseParts = {
        assign: '',
        solution: null,
      };

      lineReader.eachLine(filePath, (line: string, last: boolean) => {
        if (line.trim() === "---solution") {
          if (last) {
            resolve(parts);
          } else {
            parts.solution = '';
          }
          return true;
        }

        if (parts.solution === null) {
          parts.assign += `${line}\n`;
        } else {
          parts.solution += `${line}\n`;
        }

        if (last) {
          if (parts.solution?.trim() === '') {
            parts.solution = null;
          }
          resolve(parts);
          return true;
        }

        return true;
      }, reject);
    });
  }

  public async fetchAssign(): Promise<JsmlElement> {
    const parts = await this.loadParts();
    const jsml = await this.markdownProcessor.processString(parts.assign);

    const attrs = {
      num: this.index + 1,
      title: this.frontMatter.title,
      link: this.base.link,
      path: this.base.contentPath,
      //path: this.accessCheck.accepts() ? this.entry.path : 'forbidden',
      demand: this.frontMatter.demand,
      hasSolution: parts.solution !== null && !this.frontMatter.draftSolution,
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

  public async fetch(): Promise<Exercise> {
    const parts = await this.loadParts();
    const assignJsml = await this.markdownProcessor.processString(parts.assign);
    const solutionJsml = parts.solution === null
      ? []
      : await this.markdownProcessor.processString(parts.solution);

    return {
      ...createBaseContent(this.base),
      crumbs: createCrumbs(this)!,
      demand: this.frontMatter.demand,
      num: this.index + 1,
      title: this.frontMatter.title,
      assignJsml,
      solutionJsml,
    }
  }
}

export class ExerciseLoader extends EntryLoader<ExerciseEntry> {
  private markdownProcessor: MarkdownProcessor;

  public constructor() {
    super();
    this.markdownProcessor = new MarkdownProcessor(() => '');
  }
  
  private async loadFrontMatter(filePath: string): Promise<ExerciseFrontMatter> {
    return new Promise((resolve, reject) => {
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
  }


  protected async loadEntry(base: EntryBase): Promise<ExerciseEntry> {
    const filePath = base.fsType === 'file'
      ? base.fsPath
      : path.join(base.fsPath, 'exercise.md');
    
    const frontMatter = await this.loadFrontMatter(filePath);
    return new ExerciseEntry(base, frontMatter, this.markdownProcessor);
  }
}

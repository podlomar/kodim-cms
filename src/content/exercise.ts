import path from 'path';
import { existsSync } from "fs";
import yaml from "yaml";
import lineReader from "line-reader";
import { ExerciseFrontMatter } from '../entries.js';
import { EntryCommon, LeafEntry } from '../core/entry.js';
import { EntryLoader } from '../core/loader.js';
import { el, getChildren, getTag, isElement, Jsml, JsmlElement } from '../jsml.js';
import { MarkdownProcessor } from '../markdown.js';
import type { LessonSectionEntry } from './lesson-section.js';

export interface PublicExerciseAttrs {
  readonly demand: 1 | 2 | 3 | 4 | 5;
  readonly num: number;
  readonly showSolution: boolean;
}

export interface FullExerciseAttrs extends PublicExerciseAttrs {
  assignJsml: Jsml,
  solutionJsml: Jsml,
}

export interface ExerciseAssign extends PublicExerciseAttrs {
  readonly jsml: Jsml,
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

const loadAssign = async (filePath: string): Promise<string> =>
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

const markdownProcessor = new MarkdownProcessor(() => '');

export class ExerciseEntry extends LeafEntry<
  LessonSectionEntry, PublicExerciseAttrs, FullExerciseAttrs, ExerciseFrontMatter
> {
  public getPublicAttrs(frontMatter: ExerciseFrontMatter): PublicExerciseAttrs {
    return {
      demand: frontMatter.demand,
      num: this.common.position + 1,
      showSolution: frontMatter.showSolution ?? false,
    }
  }

  public async fetchFullAttrs(frontMatter: ExerciseFrontMatter): Promise<FullExerciseAttrs> {
    const assignPath = getExcFilePath(this.common.fsPath);
    if (assignPath === null) {
      throw new Error('no assign file found');
    }

    const jsml = await markdownProcessor.process(assignPath);
    const firstNode = jsml[0];
    const secondNode = jsml[1] ?? '';

    const assignJsml = isElement(firstNode) && getTag(firstNode) === 'assign'
      ? getChildren(firstNode)
      : jsml;

    const solutionJsml = isElement(secondNode) && getTag(secondNode) === 'solution'
      ? getChildren(secondNode)
      : [];

    return {
      ...this.getPublicAttrs(frontMatter),
      assignJsml,
      solutionJsml,
    };
  }

  public async fetchAssign(): Promise<JsmlElement> {
    const excPath = getExcFilePath(this.common.fsPath);
    if (excPath === null) {
      throw new Error('no assign file found');
    }

    const assignText = await loadAssign(excPath);
    const jsml = await markdownProcessor.processString(assignText);

    const attrs = {
      num: this.common.position + 1,
      title: this.index!.title ?? this.common.link,
      path: this.common.path,
      demand: this.index!.demand,
      showSolution: this.index?.showSolution ?? false,
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
}

export class ExerciseLoader extends EntryLoader<
  ExerciseFrontMatter,
  LessonSectionEntry,
  ExerciseEntry
> {
  protected buildFsPath(fileName: string): string {
    return path.join(this.parentEntry.getCommon().fsPath, '..', fileName.replace('>', '/'));
  }

  protected async loadIndex(fsPath: string): Promise<ExerciseFrontMatter | 'not-found'> {
    const assignPath = getExcFilePath(fsPath);
    if (assignPath === null) {
      return 'not-found';
    }

    return loadFrontMatter<ExerciseFrontMatter>(assignPath);
  }

  protected async loadEntry(
    common: EntryCommon, frontMatter: ExerciseFrontMatter, position: number
  ): Promise<ExerciseEntry> {
    return new ExerciseEntry(this.parentEntry, common, frontMatter, []);
  }
}

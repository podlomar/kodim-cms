import path from 'path';
// import { promises as fs } from 'fs';
// import { unified } from "unified";
// import markdown from "remark-parse";
// import directive from "remark-directive";
// import rehype from "remark-rehype";
// import stringify from "rehype-stringify";
import yaml from 'yaml';
import lineReader from "line-reader";
import { IndexEntry, LeafEntry } from 'filefish/dist/treeindex.js';
import { LoadingContext, RefableContentType } from 'filefish/dist/content-types.js';
import { FsNode } from 'fs-inquire';
import { OkCursor } from 'filefish/dist/cursor.js';
import { Root as HastRoot } from 'hast';
import { ExerciseProcessor } from '../render/markdown2.js';

const EXERCISE_ENTRY_CONTENT_ID = 'excercise';

export type Demand = 1 | 2 | 3 | 4 | 5;

export interface ExerciseEntry extends LeafEntry {
  title: string,
  lead: string,
  demand: Demand,
}

export interface ShallowExercise {
  path: string,
  name: string,
  lead: string,
  title: string,
  demand: Demand;
  num: number;
}

export interface Exercise extends ShallowExercise {
  assign: HastRoot,
  solution?: HastRoot,
}

export interface ExerciseFrontMatter {
  readonly title: string;
  readonly demand: Demand;
  readonly lead?: string;
  readonly draftSolution?: boolean;
}

const loadFrontMatter = async (filePath: string): Promise<ExerciseFrontMatter> => {
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

const exerciseProcessor = new ExerciseProcessor();

export const ExerciseContentType: RefableContentType<
  FsNode, ExerciseEntry, Exercise, ShallowExercise
> = {
  async index(node: FsNode): Promise<ExerciseEntry> {
    const frontMatter = node.type === 'file'
      ? await loadFrontMatter(node.path)
      : await loadFrontMatter(path.join(node.path, 'exercise.md'));    

    return {
      type: 'leaf',
      contentId: EXERCISE_ENTRY_CONTENT_ID,
      name: node.parsedPath.name,
      fsNode: node,
      title: frontMatter.title,
      demand: frontMatter.demand,
      lead: frontMatter.lead ?? 'no-lead',
    }
  },

  fits(entry: IndexEntry): entry is ExerciseEntry {
    return entry.contentId === EXERCISE_ENTRY_CONTENT_ID;
  },

  async loadContent(cursor: OkCursor, context: LoadingContext): Promise<Exercise> {
    const entry = cursor.entry() as ExerciseEntry;
    return exerciseProcessor.process(entry.fsNode, cursor);
  },

  async loadShallowContent(cursor: OkCursor): Promise<ShallowExercise> {
    const entry = cursor.entry() as ExerciseEntry;
    return {
      path: cursor.contentPath(),
      name: entry.name,
      title: entry.title,
      lead: entry.lead,
      demand: entry.demand,
      num: cursor.pos() + 1,
    };
  }
};

import path from 'path';
import { IndexEntry, LeafEntry } from 'filefish/dist/treeindex.js';
import { LoadingContext, RefableContentType } from 'filefish/dist/content-types.js';
import { FsNode } from 'fs-inquire';
import { OkCursor } from 'filefish/dist/cursor.js';
import { Root as HastRoot } from 'hast';
import { processExercise } from '../render/markdown.js';
import { MarkdownSource } from '../render/markdown-source.js';

const EXERCISE_ENTRY_CONTENT_ID = 'excercise';

export type Demand = 1 | 2 | 3 | 4 | 5;

export interface ExerciseEntry extends LeafEntry {
  title: string,
  lead: string,
  demand: Demand,
  offerSolution: boolean,
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

export interface ExerciseFile {
  readonly title: string;
  readonly demand: Demand;
  readonly lead?: string;
  readonly offerSolution?: boolean;
  readonly assets: string[];
}

const indexExercise = async (fsNode: FsNode): Promise<ExerciseFile> => {
  const filePath = fsNode.type === 'file'
    ? fsNode.path
    : path.join(fsNode.path, 'exercise.md');
  const source = await MarkdownSource.fromFile(filePath);
  const assets = source.collectAssets();
  const frontMatter = source.getFrontMatter();

  return {
    title: frontMatter.title,
    demand: frontMatter.demand,
    lead: frontMatter.lead,
    offerSolution: frontMatter.offerSolution,
    assets,
  };
}

export const ExerciseContentType: RefableContentType<
  FsNode, ExerciseEntry, Exercise, ShallowExercise
> = {
  async index(node: FsNode): Promise<ExerciseEntry> {
    const exerciseFile = await indexExercise(node);

    return {
      type: 'leaf',
      contentId: EXERCISE_ENTRY_CONTENT_ID,
      name: node.parsedPath.name,
      fsNode: node,
      title: exerciseFile.title,
      demand: exerciseFile.demand,
      lead: exerciseFile.lead ?? 'no-lead',
      offerSolution: exerciseFile.offerSolution ?? true,
      assets: exerciseFile.assets,
    }
  },

  fits(entry: IndexEntry): entry is ExerciseEntry {
    return entry.contentId === EXERCISE_ENTRY_CONTENT_ID;
  },

  async loadContent(cursor: OkCursor, context: LoadingContext): Promise<Exercise> {
    const entry = cursor.entry() as ExerciseEntry;
    return processExercise(entry.fsNode, cursor, context);
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

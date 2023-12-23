import path from 'path';
import { Indexer, LeafEntry } from 'filefish/indexer';
import { defineContentType } from 'filefish/content-type';
import { FsNode } from 'fs-inquire';
import { Cursor } from 'filefish/cursor';
import { Root as HastRoot } from 'hast';
import { processExercise } from '../render/markdown.js';
import { MarkdownSource } from '../render/markdown-source.js';
import { LoadError, Loader } from 'filefish/loader';
import { Result } from 'monadix/result';
import { BaseContent, BaseNavItem } from './base.js';

export type Demand = 1 | 2 | 3 | 4 | 5;

export type SolutionAccess = 'allow' | 'lock' | 'hide';

export interface ExerciseData {
  lead: string,
  demand: Demand,
}

export type ExerciseEntry = LeafEntry<ExerciseData & {
  solutionAccess: SolutionAccess,
}>;

export interface ExerciseNavItem extends BaseNavItem, ExerciseData {
  num: number;
}

export interface Exercise extends BaseContent, ExerciseNavItem {
  assign: HastRoot,
  solution: HastRoot | 'locked' | 'none',
}

export interface ExerciseFile {
  readonly title: string;
  readonly demand: Demand;
  readonly lead?: string;
  readonly solutionAccess?: SolutionAccess;
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
    solutionAccess: frontMatter.solutionAccess,
    assets,
  };
}

export const exerciseNavItem = (cursor: Cursor<ExerciseEntry>): ExerciseNavItem => {
  const entry = cursor.entry();
  return {
    path: cursor.contentPath(),
    name: entry.name,
    title: entry.title,
    lead: entry.data.lead,
    demand: entry.data.demand,
    num: cursor.pos() + 1,
  };
}

export const ExerciseContentType = defineContentType('kodim/exercise', {
  async indexNode(node: FsNode, indexer: Indexer): Promise<ExerciseEntry> {
    const exerciseFile = await indexExercise(node);

    const data = {
      lead: exerciseFile.lead ?? 'no-lead',
      demand: exerciseFile.demand,
      solutionAccess: exerciseFile.solutionAccess ?? 'allow',
    };

    return {
      ...indexer.buildLeafEntry(node, data),
      title: exerciseFile.title,
      assets: exerciseFile.assets,
    }
  },
  async loadContent(
    cursor: Cursor<ExerciseEntry>, loader: Loader,
  ): Promise<Result<Exercise, LoadError>> {
    const entry = cursor.entry();
    return Result.success(await processExercise(entry.fsNode, cursor, loader));
  },
});

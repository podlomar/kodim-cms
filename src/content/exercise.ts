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

export type ExerciseData = {
  readonly lead: string,
  readonly demand: Demand,
}

export type ExerciseEntry = LeafEntry<FsNode, ExerciseData & {
  readonly solutionAccess: SolutionAccess,
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
    lead: entry.attrs.lead,
    demand: entry.attrs.demand,
    num: cursor.pos() + 1,
  };
}

export const ExerciseContentType = defineContentType('kodim/exercise', {
  async index(source: FsNode, indexer: Indexer): Promise<ExerciseEntry> {
    const exerciseFile = await indexExercise(source);

    const attrs = {
      lead: exerciseFile.lead ?? 'no-lead',
      demand: exerciseFile.demand,
      solutionAccess: exerciseFile.solutionAccess ?? 'allow',
    };

    return {
      ...indexer.buildLeafEntry(source.fileName, source, 'protected', attrs),
      title: exerciseFile.title,
      assets: {
        folder: source.type === 'file'
          ? path.resolve(source.path, '../assets')
          : path.resolve(source.path, 'assets'),
        names: exerciseFile.assets,
      },
    }
  },
  
  async loadContent(
    cursor: Cursor<ExerciseEntry>, loader: Loader,
  ): Promise<Result<Exercise, LoadError>> {
    const entry = cursor.entry();
    return Result.success(await processExercise(entry.source, cursor, loader));
  },
});

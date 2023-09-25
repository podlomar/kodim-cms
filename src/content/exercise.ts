import path from 'path';
import { LeafEntry } from 'filefish/dist/treeindex.js';
import { IndexingContext, LoadingContext, contentType } from 'filefish/dist/content-types.js';
import { FsNode } from 'fs-inquire';
import { OkCursor } from 'filefish/dist/cursor.js';
import { Root as HastRoot } from 'hast';
import { processExercise } from '../render/markdown.js';
import { MarkdownSource } from '../render/markdown-source.js';
import { LoadError } from 'filefish/dist/errors.js';
import { Result } from 'monadix/result';
import { BaseContent, BaseShallowContent } from './base.js';

export type Demand = 1 | 2 | 3 | 4 | 5;

export type SolutionAccess = 'allow' | 'lock' | 'hide';

export interface ExerciseData {
  lead: string,
  demand: Demand,
}

export type ExerciseEntry = LeafEntry<ExerciseData & {
  solutionAccess: SolutionAccess,
}>;

export interface ShallowExercise extends BaseShallowContent, ExerciseData {
  num: number;
}

export interface Exercise extends BaseContent, ShallowExercise {
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

export const ExerciseContentType = contentType<FsNode, ExerciseEntry, Exercise, ShallowExercise>('kodim/exercise', {
  async indexOne(node: FsNode, context: IndexingContext): Promise<ExerciseEntry> {
    const exerciseFile = await indexExercise(node);

    const data = {
      lead: exerciseFile.lead ?? 'no-lead',
      demand: exerciseFile.demand,
      solutionAccess: exerciseFile.solutionAccess ?? 'allow',
    };

    return {
      ...context.buildLeafEntry(node, data),
      title: exerciseFile.title,
      assets: exerciseFile.assets,
    }
  },
  async loadOne(
    cursor: OkCursor<ExerciseEntry>, context: LoadingContext
  ): Promise<Result<Exercise, LoadError>> {
    const entry = cursor.entry();
    return Result.success(await processExercise(entry.fsNode, cursor, context));
  },
  async loadShallowOne(
    cursor: OkCursor<ExerciseEntry>
  ): Promise<Result<ShallowExercise, LoadError>> {
    const entry = cursor.entry();
    return Result.success({
      path: cursor.contentPath(),
      name: entry.name,
      title: entry.title,
      lead: entry.data.lead,
      demand: entry.data.demand,
      num: cursor.pos() + 1,
    });
  }
});

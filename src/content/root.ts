import { ParentEntry, Indexer } from 'filefish/indexer';
import { defineContentType } from 'filefish/content-type';
import { Cursor } from 'filefish/cursor';
import {
  DivisionContentType,
  DivisionEntry,
  CoursesDivision,
  CoursesDivisionSource
} from './division.js';
import { Result } from "monadix/result";
import { Loader } from 'filefish/loader';

export interface RootSource {
  readonly divisions: CoursesDivisionSource[];
}

export type RootEntry = ParentEntry<RootSource, DivisionEntry>;

export interface Root {
  readonly divisions: CoursesDivision[];
}

export const RootContentType = defineContentType('kodim/root', {
  async index(source: RootSource, indexer: Indexer): Promise<RootEntry> {
    const subEntries = await indexer.indexChildren(
      '', source.divisions, DivisionContentType
    );
    
    return indexer.buildParentEntry('', source, 'public', {}, subEntries);
  },

  async loadContent(
    cursor: Cursor<RootEntry>, loader: Loader,
  ): Promise<Result<Root, 'forbidden' | 'not-found'>> {
    const divisions = Result.collectSuccess(
      await Promise.all(cursor.children().map((c) => DivisionContentType.loadContent(c, loader)))
    );

    return Result.success({ divisions });
  }
});

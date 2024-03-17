import path from 'path';
import { ParentEntry, Indexer } from 'filefish/indexer';
import { defineContentType } from 'filefish/content-type';
import { Cursor } from 'filefish/cursor';
import {
  CoursesDivisionContentType,
  CoursesDivisionEntry,
  CoursesDivision,
  CoursesDivisionSource
} from './courses-division.js';
import { Result } from "monadix/result";
import { Loader } from 'filefish/loader';
import { BlogDivision, BlogDivisionContentType, BlogDivisionEntry } from './blog-division.js';
import { FolderNode, folder } from 'fs-inquire';

export interface RootSource {
  readonly kodimCourses: CoursesDivisionSource;
  readonly czechitasCourses: CoursesDivisionSource;
  readonly blog: string;
}

export type RootEntry = ParentEntry<RootSource, CoursesDivisionEntry | BlogDivisionEntry>;

export interface Root {
  readonly kodimDivision: CoursesDivision,
  readonly czechitasDivision: CoursesDivision,
  readonly blogDivision: BlogDivision,
}

export const RootContentType = defineContentType('kodim/root', {
  async index(source: RootSource, indexer: Indexer): Promise<RootEntry> {
    const kodimCoursesEntry = await indexer.indexChild(
      source.kodimCourses.name, source.kodimCourses, CoursesDivisionContentType
    );
    const czechitasCoursesEntry = await indexer.indexChild(
      source.czechitasCourses.name, source.czechitasCourses, CoursesDivisionContentType
    );
    const blogEntry = await indexer.indexChild(
      'blog', folder(path.join(source.blog, 'articles')).result.getOrThrow(), BlogDivisionContentType
    );
    
    return indexer.buildParentEntry('', source, 'public', {}, [
      kodimCoursesEntry,
      czechitasCoursesEntry,
      blogEntry,
    ]);
  },

  async loadContent(
    cursor: Cursor<RootEntry>, loader: Loader,
  ): Promise<Result<Root, 'forbidden' | 'not-found'>> {
    const kodimCoursesCursor = cursor.nthChild(0) as Cursor<CoursesDivisionEntry> | null;
    const czechitasCoursesCursor = cursor.nthChild(1) as Cursor<CoursesDivisionEntry> | null;
    const blogCursor = cursor.nthChild(2) as Cursor<BlogDivisionEntry>  | null;
    
    if (kodimCoursesCursor === null || czechitasCoursesCursor === null || blogCursor === null) {
      return Result.fail('not-found');
    }    

    const kodimDivision = await CoursesDivisionContentType.loadContent(
      kodimCoursesCursor, loader
    );
    const czechitasDivision = await CoursesDivisionContentType.loadContent(
      czechitasCoursesCursor, loader
    );
    const blogDivision = await BlogDivisionContentType.loadContent(blogCursor, loader);
    
    if (kodimDivision.isFail() || czechitasDivision.isFail() || blogDivision.isFail()) {
      return Result.fail('not-found');
    }
    
    return Result.success({
      kodimDivision: kodimDivision.get(),
      czechitasDivision: czechitasDivision.get(),
      blogDivision: blogDivision.get(),
    });
  }
});

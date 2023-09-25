import path from 'path';
import { promises as fs } from 'fs';
import yaml from 'yaml';
import { InnerEntry } from 'filefish/dist/treeindex.js';
import { IndexingContext, LoadingContext, contentType } from 'filefish/dist/content-types.js';
import { folder, FolderNode } from 'fs-inquire';
import { OkCursor } from 'filefish/dist/cursor.js';
import { LessonContentType, LessonEntry, ShallowLesson } from './lesson.js';
import { BaseContent, BaseShallowContent, buildBaseContent } from './base.js';
import { LoadError } from 'filefish/dist/errors.js';
import { Result } from 'monadix/result';

export interface ChapterData {
  readonly lead: string;
}

export type ChapterEntry = InnerEntry<LessonEntry, ChapterData>;

interface EntryFile {
  title: string,
  lead: string,
  lessons: string[];
}

export type ShallowChapter = BaseShallowContent & ChapterData;

export interface Chapter extends ShallowChapter, BaseContent {
  readonly lessons: ShallowLesson[],
}

export const ChapterContentType = contentType('kodim/chapter', {
  async indexOne(folderNode: FolderNode, context: IndexingContext): Promise<ChapterEntry> {
    const entryFileContent = await fs.readFile(
      path.resolve(folderNode.path, 'entry.yml'), 'utf-8'
    );
    const entryFile = yaml.parse(entryFileContent) as EntryFile;
    
    const lessonFolders = folder(folderNode)
      .select
      .folders
      .byPaths(entryFile.lessons)
      .getOrThrow();

    const data = {
      lead: entryFile.lead,
    };

    const subEntries = await context.indexSubEntries(
      lessonFolders, folderNode.fileName, LessonContentType
    );

    return {
      ...context.buildInnerEntry(folderNode, data, subEntries),
      title: entryFile.title,
    }
  },
  async loadOne(
    cursor: OkCursor<ChapterEntry>, context: LoadingContext
  ): Promise<Result<Chapter, LoadError>> {
    const entry = cursor.entry();
    const lessons = Result.collectSuccess(
      await LessonContentType.loadShallowMany(cursor.children(), context),
    );

    return Result.success({
      ...buildBaseContent(cursor),
      lead: entry.data.lead,
      lessons,
    })
  },
  async loadShallowOne(
    cursor: OkCursor<ChapterEntry>, context: LoadingContext
  ): Promise<Result<ShallowChapter, LoadError>> {
    const entry = cursor.entry();
    return Result.success({
      path: cursor.contentPath(),
      name: entry.name,
      title: entry.title,
      lead: entry.data.lead,
    });
  }
});

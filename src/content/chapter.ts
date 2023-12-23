import path from 'path';
import { promises as fs } from 'fs';
import yaml from 'yaml';
import { ParentEntry, Indexer } from 'filefish/indexer';
import { defineContentType } from 'filefish/content-type';
import { folder, FolderNode } from 'fs-inquire';
import { Cursor } from 'filefish/cursor';
import { LessonContentType, LessonEntry, LessonNavItem, lessonNavItem } from './lesson.js';
import { BaseContent, BaseNavItem, buildBaseContent } from './base.js';
import { LoadError, Loader } from 'filefish/loader';
import { Result } from 'monadix/result';

export interface ChapterData {
  readonly lead: string;
}

export type ChapterEntry = ParentEntry<LessonEntry, ChapterData>;

interface EntryFile {
  title: string,
  lead: string,
  lessons: string[];
}

export type ChapterNavItem = BaseNavItem & ChapterData;

export interface Chapter extends ChapterNavItem, BaseContent {
  readonly lessons: LessonNavItem[],
}

export const chapterNavItem = (cursor: Cursor<ChapterEntry>): ChapterNavItem => {
  const entry = cursor.entry();
  return {
    path: cursor.contentPath(),
    name: entry.name,
    title: entry.title,
    lead: entry.data.lead,
  };
};

export const ChapterContentType = defineContentType('kodim/chapter', {
  async indexNode(folderNode: FolderNode, indexer: Indexer): Promise<ChapterEntry> {
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

    const subEntries = await indexer.indexChildren(lessonFolders, LessonContentType);
    return {
      ...indexer.buildParentEntry(folderNode, data, subEntries),
      title: entryFile.title,
    }
  },

  async loadContent(
    cursor: Cursor<ChapterEntry>, loader: Loader,
  ): Promise<Result<Chapter, LoadError>> {
    const entry = cursor.entry();
    return Result.success({
      ...buildBaseContent(cursor),
      lead: entry.data.lead,
      lessons: cursor.children().map((c) => lessonNavItem(c))
    });
  },
});

import path from 'path';
import { promises as fs } from 'fs';
import yaml from 'yaml';
import { Indexer, ParentEntry } from 'filefish/indexer';
import { defineContentType } from 'filefish/content-type';
import { folder, FolderNode } from 'fs-inquire';
import { ChapterContentType, ChapterEntry, ChapterNavItem, chapterNavItem } from './chapter.js';
import { Cursor } from 'filefish/cursor';
import { LessonContentType, LessonEntry, LessonNavItem } from './lesson.js';
import { TopicContentType, TopicEntry } from './topic.js';
import { Result } from 'monadix/result';
import { BaseContent, BaseNavItem, buildBaseContent, buildBaseNavItem } from './base.js';
import { LoadError, Loader } from 'filefish/loader';

export interface CourseData {
  readonly lead: string,
  readonly image: string,
}

export type CourseEntry = ParentEntry<ChapterEntry, CourseData>;

interface EntryFile {
  readonly title: string,
  readonly lead: string,
  readonly image: string,
  readonly chapters?: string[];
  readonly lessons?: string[];
}

export interface CourseNavItem extends BaseNavItem, CourseData {
  readonly topicMask: string;
}

export interface Course extends CourseNavItem, BaseContent {
  chapters: ChapterNavItem[];
}

export const courseNavItem = (cursor: Cursor<CourseEntry>, loader: Loader): CourseNavItem => {
  const parentCursor = cursor.parent() as Cursor<TopicEntry>;
  const topicEntry = parentCursor.entry();
  const entry = cursor.entry();
    
  return {
    ...buildBaseNavItem(cursor),
    lead: entry.data.lead,
    image: CourseContentType.buildAssetPath(cursor, entry.data.image, loader),
    topicMask: TopicContentType.buildAssetPath(parentCursor, topicEntry.data.mask, loader),
  };
};

export const CourseContentType = defineContentType('kodim/course', {
  async indexNode(folderNode: FolderNode, indexer: Indexer): Promise<CourseEntry> {
    const entryFileContent = await fs.readFile(
      path.resolve(folderNode.path, 'entry.yml'), 'utf-8'
    );
    const entryFile = yaml.parse(entryFileContent) as EntryFile;
    const names = entryFile.chapters ?? entryFile.lessons ?? [];
    const folders = folder(folderNode)
      .select
      .folders
      .byPaths(names)
      .getOrThrow();

    const imageName = entryFile.image.startsWith('assets/')
      ? entryFile.image.slice(7)
      : null;

    const data: CourseData = {
      lead: entryFile.lead,
      image: imageName ?? '',
    };

    const subEntries = entryFile.lessons === undefined
      ? await indexer.indexChildren(folders, ChapterContentType)
      : [{
        type: 'parent' as const,
        contentId: ChapterContentType.contentId,
        name: 'lekce',
        fsNode: folderNode,
        subEntries: await indexer.indexChildren(folders, LessonContentType),
        title: '',
        data: {
          lead: ''
        },
      }];

    return {
      ...indexer.buildParentEntry(folderNode, data, subEntries),
      title: entryFile.title,
      assets: imageName === null ? undefined : [imageName],
    };
  },

  async loadContent(
    cursor: Cursor<CourseEntry>, loader: Loader,
  ): Promise<Result<Course, LoadError>>  {
    const parentCursor = cursor.parent() as Cursor<TopicEntry>;
    const topicEntry = parentCursor.entry();
    const entry = cursor.entry();

    return Result.success({
      ...buildBaseContent(cursor),
      lead: entry.data.lead,
      image: CourseContentType.buildAssetPath(cursor, entry.data.image, loader),
      topicMask: TopicContentType.buildAssetPath(parentCursor, topicEntry.data.mask, loader),
      chapters: cursor.children().map((c) => chapterNavItem(c)),
    });
  },
});

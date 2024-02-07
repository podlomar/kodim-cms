import path from 'path';
import { promises as fs } from 'fs';
import yaml from 'yaml';
import { Indexer, ParentEntry } from 'filefish/indexer';
import { defineContentType } from 'filefish/content-type';
import { folder, FolderNode } from 'fs-inquire';
import { ChapterContentType, ChapterEntry, ChapterNavItem, chapterNavItem } from './chapter.js';
import { Cursor } from 'filefish/cursor';
import { LessonContentType } from './lesson.js';
import { Result } from 'monadix/result';
import { BaseContent, BaseNavItem, buildBaseContent, buildBaseNavItem } from './base.js';
import { LoadError, Loader } from 'filefish/loader';

export type Organization = 'kodim' | 'czechitas';

export type CourseSource = {
  readonly name: string,
  readonly folderNode: FolderNode,
  readonly repo: {
    readonly url: string,
    readonly folder: string,
  } | null,
  readonly topic: string | null,
  readonly organization: Organization,
}

export type CourseData = {
  readonly lead: string,
  readonly image: string,
  readonly organization: Organization,
  readonly topic: string | null,
}

export type CourseEntry = ParentEntry<CourseSource, ChapterEntry, CourseData>;

interface EntryFile {
  readonly title?: string,
  readonly lead?: string,
  readonly image?: string,
  readonly chapters?: string[];
  readonly lessons?: string[];
}

export interface CourseNavItem extends BaseNavItem, CourseData {};

export interface Course extends CourseNavItem, BaseContent {
  chapters: ChapterNavItem[];
}

export const courseNavItem = (cursor: Cursor<CourseEntry>, loader: Loader): CourseNavItem => {
  const entry = cursor.entry();
    
  return {
    ...buildBaseNavItem(cursor),
    lead: entry.attrs.lead,
    image: loader.buildAssetUrlPath(cursor, entry.attrs.image),
    organization: entry.attrs.organization,
    topic: entry.attrs.topic,
  };
};

export const CourseContentType = defineContentType('kodim/course', {
  async index(source: CourseSource, indexer: Indexer): Promise<CourseEntry> {
    const entryFileContent = await fs.readFile(
      path.resolve(source.folderNode.path, 'entry.yml'), 'utf-8'
    );
    const entryFile = yaml.parse(entryFileContent) as EntryFile;
    const names = entryFile.chapters ?? entryFile.lessons ?? [];
    const folders = folder(source.folderNode)
      .select
      .folders
      .byPaths(names)
      .getOrThrow();

    const image = entryFile.image === undefined
      ? null
      : entryFile.image.startsWith('assets/')
        ? entryFile.image.slice(7)
        : null;

    const data: CourseData = {
      lead: entryFile.lead ?? '',
      image: image ?? 'unknown',
      organization: source.organization,
      topic: source.topic,
    };

    const subEntries: ChapterEntry[] = entryFile.lessons === undefined
      ? await indexer.indexChildren(source.name, folders, ChapterContentType)
      : [{
        type: 'parent' as const,
        contentId: ChapterContentType.contentId,
        name: 'lekce',
        source: source.folderNode,
        access: 'public',
        subEntries: await indexer.indexChildren(source.name, folders, LessonContentType),
        title: '',
        attrs: {
          lead: ''
        },
      }];

    const assets = data.image === null
      ? undefined
      : {
        folder: path.resolve(source.folderNode.path, 'assets'),
        names: [data.image],
      };

    return {
      ...indexer.buildParentEntry(source.name, source, 'public', data, subEntries),
      title: entryFile.title ?? source.name,
      assets,
    };
  },

  async loadContent(
    cursor: Cursor<CourseEntry>, loader: Loader,
  ): Promise<Result<Course, LoadError>>  {
    const entry = cursor.entry();
    return Result.success({
      ...buildBaseContent(cursor),
      lead: entry.attrs.lead,
      image: loader.buildAssetUrlPath(cursor, entry.attrs.image),
      organization: entry.attrs.organization,
      topic: entry.attrs.topic,
      chapters: cursor.children().map((c) => chapterNavItem(c)),
    });
  },
});

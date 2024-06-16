import { EntryAccess, Indexer, ParentEntry } from 'filefish/indexer';
import { defineContentType } from 'filefish/content-type';
import { folder, FolderNode } from 'fs-inquire';
import { Cursor } from 'filefish/cursor';
import { SectionContentType, SectionEntry, sectionNavItem, SectionNavItem } from './section.js';
import { BaseContent, BaseNavItem, buildBaseContent } from './base.js';
import { LoadError, Loader } from 'filefish/loader';
import { Result } from 'monadix/result';
import { parseEntryFile } from './common.js';

export type LessonData = {
  lead: string | null,
}

export type LessonEntry = ParentEntry<FolderNode, SectionEntry, LessonData>;

interface EntryFile {
  title?: string,
  lead?: string,
  access?: EntryAccess,
  sections?: string[];
}

export interface LessonNavItem extends BaseNavItem, LessonData {
  num: number,
  locked: boolean,
};

export interface Lesson extends LessonNavItem, BaseContent {
  sections: SectionNavItem[]
  prev: LessonNavItem | null,
  next: LessonNavItem | null,
}

export const lessonNavItem = (cursor: Cursor<LessonEntry>): LessonNavItem => {
  const entry = cursor.entry();
  return {
    path: cursor.contentPath(),
    num: cursor.pos() + 1,
    name: entry.name,
    title: entry.title,
    lead: entry.data.lead,
    locked: cursor.permission() === 'locked',
  };
};

export const LessonContentType = defineContentType('kodim/lesson', {
  async index(source: FolderNode, indexer: Indexer): Promise<LessonEntry> {
    const entryFile: EntryFile = await parseEntryFile(source.path);
    const sectionFiles = folder(source)
      .select
      .files
      .byPaths(entryFile.sections ?? [], '.md')
      .getOrThrow();

    const access = ['public', 'protected'].includes(String(entryFile.access))
      ? entryFile.access!
      : 'public';

    const data = { lead: entryFile.lead ?? null};
    const subEntries = await indexer.indexChildren(source.fileName, sectionFiles, SectionContentType);
    
    return {
      ...indexer.buildParentEntry(source.fileName, source, access, data, subEntries),
      title: entryFile.title ?? source.fileName,
    };
  },

  async loadContent(
    cursor: Cursor<LessonEntry>, loader: Loader,
  ): Promise<Result<Lesson, LoadError>> {
    const entry = cursor.entry();
    const prevSibling = cursor.prevSibling();
    const nextSibling = cursor.nextSibling();
    
    return Result.success({
      ...buildBaseContent(cursor),
      num: cursor.pos() + 1,
      lead: entry.data.lead,
      sections: cursor.children().map((c) => sectionNavItem(c)),
      prev: prevSibling === null ? null : lessonNavItem(prevSibling),
      next: nextSibling === null ? null : lessonNavItem(nextSibling),
      locked: cursor.permission() === 'locked',
    });
  },
});

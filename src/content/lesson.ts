import path from 'path';
import { promises as fs } from 'fs';
import yaml from 'yaml';
import { Indexer, ParentEntry } from 'filefish/indexer';
import { defineContentType } from 'filefish/content-type';
import { folder, FolderNode } from 'fs-inquire';
import { Cursor } from 'filefish/cursor';
import { SectionContentType, SectionEntry, sectionNavItem, SectionNavItem } from './section.js';
import { BaseContent, BaseNavItem, buildBaseContent } from './base.js';
import { LoadError, Loader } from 'filefish/loader';
import { Result } from 'monadix/result';

export interface LessonData {
  lead: string,
}

export type LessonEntry = ParentEntry<SectionEntry, LessonData>;

interface EntryFile {
  title: string,
  lead: string,
  sections: string[];
}

export interface LessonNavItem extends BaseNavItem, LessonData {
  num: number,
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
  };
};

export const LessonContentType = defineContentType('kodim/lesson', {
  async indexNode(folderNode: FolderNode, indexer: Indexer): Promise<LessonEntry> {
    const entryFileContent = await fs.readFile(
      path.resolve(folderNode.path, 'entry.yml'), 'utf-8'
    );
    const entryFile = yaml.parse(entryFileContent) as EntryFile;
    
    const sectionFiles = folder(folderNode)
      .select
      .files
      .byPaths(entryFile.sections, '.md')
      .getOrThrow();

    const data = { lead: entryFile.lead };
    const subEntries = await indexer.indexChildren(sectionFiles, SectionContentType);
    return {
      ...indexer.buildParentEntry(folderNode, data, subEntries),
      title: entryFile.title,
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
    });
  },
});

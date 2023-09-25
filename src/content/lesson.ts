import path from 'path';
import { promises as fs } from 'fs';
import yaml from 'yaml';
import { InnerEntry } from 'filefish/dist/treeindex.js';
import { IndexingContext, LoadingContext, contentType } from 'filefish/dist/content-types.js';
import { folder, FolderNode } from 'fs-inquire';
import { OkCursor } from 'filefish/dist/cursor.js';
import { SectionContentType, SectionEntry, ShallowSection } from './section.js';
import { BaseContent, BaseShallowContent, buildBaseContent } from './base.js';
import { LoadError } from 'filefish/dist/errors.js';
import { Result } from 'monadix/result';

export interface LessonData {
  lead: string,
}

export type LessonEntry = InnerEntry<SectionEntry, LessonData>;

interface EntryFile {
  title: string,
  lead: string,
  sections: string[];
}

export interface ShallowLesson extends BaseShallowContent, LessonData {
  num: number,
};

export interface Lesson extends ShallowLesson, BaseContent {
  sections: ShallowSection[]
  prev: ShallowLesson | null,
  next: ShallowLesson | null,
}

export const LessonContentType = contentType('kodim/lesson', {
  async indexOne(folderNode: FolderNode, context: IndexingContext): Promise<LessonEntry> {
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
    const subEntries = await context.indexSubEntries(
      sectionFiles, folderNode.fileName, SectionContentType,
    );
    return {
      ...context.buildInnerEntry(folderNode, data, subEntries),
      title: entryFile.title,
    };
  },
  async loadOne(
    cursor: OkCursor<LessonEntry>, context: LoadingContext
  ): Promise<Result<Lesson, LoadError>> {
    const entry = cursor.entry();
    const prev = await cursor.prevSibling().loadShallow(LessonContentType, context);
    const next = await cursor.nextSibling().loadShallow(LessonContentType, context);

    const sections = Result.collectSuccess(
      await SectionContentType.loadShallowMany(cursor.children(), context)
    );
    
    return Result.success({
      ...buildBaseContent(cursor),
      num: cursor.pos() + 1,
      lead: entry.data.lead,
      sections,
      prev: prev.getOrElse(null),
      next: next.getOrElse(null),
    });
  },
  async loadShallowOne(
    cursor: OkCursor<LessonEntry>
  ): Promise<Result<ShallowLesson, LoadError>> {
    const entry = cursor.entry();
    return Result.success({
      path: cursor.contentPath(),
      num: cursor.pos() + 1,
      name: entry.name,
      title: entry.title,
      lead: entry.data.lead,
    });
  }
});

import path from 'path';
import { promises as fs } from 'fs';
import yaml from 'yaml';
import { IndexEntry, InnerEntry } from 'filefish/dist/treeindex.js';
import { RefableContentType, IndexingContext, LoadingContext } from 'filefish/dist/content-types.js';
import { folder, FolderNode } from 'fs-inquire';
import { OkCursor } from 'filefish/dist/cursor.js';
import { SectionContentType, SectionEntry, ShallowSection } from './section.js';

const LESSON_ENTRY_CONTENT_ID = 'lesson';

export interface LessonEntry extends InnerEntry<SectionEntry> {
  title: string,
  lead: string,
}

interface EntryFile {
  title: string,
  lead: string,
  sections: string[];
}

export interface ShallowLesson {
  num: number,
  name: string;
  title: string,
  lead: string,
  path: string,
};

export interface Lesson extends ShallowLesson {
  sections: ShallowSection[]
  prev: ShallowLesson | null,
  next: ShallowLesson | null,
}

export const LessonContentType: RefableContentType<
  FolderNode, LessonEntry, Lesson, ShallowLesson
> = {
  async index(folderNode: FolderNode, context: IndexingContext): Promise<LessonEntry> {
    const entryFileContent = await fs.readFile(
      path.resolve(folderNode.path, 'entry.yml'), 'utf-8'
    );
    const entryFile = yaml.parse(entryFileContent) as EntryFile;
    
    const sectionFiles = folder(folderNode)
      .select
      .files
      .byPaths(entryFile.sections, '.md')
      .getOrThrow();
    
    const subEntries = await context.indexMany(sectionFiles, SectionContentType);

    return {
      type: 'inner',
      contentId: LESSON_ENTRY_CONTENT_ID,
      name: folderNode.parsedPath.name,
      fsNode: folderNode,
      title: entryFile.title,
      lead: entryFile.lead,
      subEntries,
    }
  },

  fits(entry: IndexEntry): entry is LessonEntry {
    return entry.contentId === LESSON_ENTRY_CONTENT_ID;
  },

  async loadContent(cursor: OkCursor, context: LoadingContext): Promise<Lesson> {
    const entry = cursor.entry() as LessonEntry;
    const prevCursor = cursor.prevSibling();
    const nextCursor = cursor.nextSibling();

    const sections = (
      await context.loadShallowMany(cursor.children(), SectionContentType)
    ) as ShallowSection[];
    
    return {
      path: cursor.contentPath(),
      num: cursor.pos() + 1,
      name: entry.name,
      title: entry.title,
      lead: entry.lead,
      sections,
      prev: prevCursor.isOk()
        ? (await context.loadShallow(prevCursor, LessonContentType)) as ShallowLesson
        : null,
      next: nextCursor.isOk()
        ? (await context.loadShallow(nextCursor, LessonContentType)) as ShallowLesson
        : null,
    }
  },

  async loadShallowContent(cursor: OkCursor): Promise<ShallowLesson> {
    const entry = cursor.entry() as LessonEntry;
    return {
      path: cursor.contentPath(),
      num: cursor.pos() + 1,
      name: entry.name,
      title: entry.title,
      lead: entry.lead,
    }
  }
};

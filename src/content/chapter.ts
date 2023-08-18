import path from 'path';
import { promises as fs } from 'fs';
import yaml from 'yaml';
import { IndexEntry, InnerEntry } from 'filefish/dist/treeindex.js';
import { RefableContentType, IndexingContext, LoadingContext } from 'filefish/dist/content-types.js';
import { folder, FolderNode } from 'fs-inquire';
import { OkCursor } from 'filefish/dist/cursor.js';
import { LessonContentType, LessonEntry, ShallowLesson } from './lesson.js';

const CHAPTER_ENTRY_CONTENT_ID = 'chapter';

export interface ChapterEntry extends InnerEntry<LessonEntry> {
  title: string,
  lead: string,
}

interface EntryFile {
  title: string,
  lead: string,
  lessons: string[];
}

export interface ShallowChapter {
  path: string;
  name: string;
  title: string;
  lead: string;
}

export interface Chapter extends ShallowChapter {
  lessons: ShallowLesson[],
}

export const ChapterContentType: RefableContentType<
  FolderNode, ChapterEntry, Chapter, ShallowChapter
> = {
  async index(folderNode: FolderNode, context: IndexingContext): Promise<ChapterEntry> {
    const entryFileContent = await fs.readFile(
      path.resolve(folderNode.path, 'entry.yml'), 'utf-8'
    );
    const entryFile = yaml.parse(entryFileContent) as EntryFile;
    
    const lessonFolders = folder(folderNode)
      .select
      .folders
      .byNames(entryFile.lessons)
      .getOrThrow();

    const subEntries = await context.indexMany(lessonFolders, LessonContentType);

    return {
      type: 'inner',
      contentId: CHAPTER_ENTRY_CONTENT_ID,
      name: folderNode.parsedPath.name,
      fsNode: folderNode,
      title: entryFile.title,
      lead: entryFile.lead,
      subEntries,
    }
  },
  
  fits(entry: IndexEntry): entry is ChapterEntry {
    return entry.contentId === CHAPTER_ENTRY_CONTENT_ID;
  },
  
  async loadContent(cursor: OkCursor, context: LoadingContext): Promise<Chapter> {
    const entry = cursor.entry() as ChapterEntry;
    const lessons = (
      await context.loadShallowMany(cursor.children(), LessonContentType)
    ) as ShallowLesson[];

    return {
      path: cursor.contentPath(),
      name: entry.name,
      title: entry.title,
      lead: entry.lead,
      lessons,
    }
  },

  async loadShallowContent(cursor: OkCursor, context: LoadingContext): Promise<ShallowChapter> {
    const entry = cursor.entry() as ChapterEntry;
    return {
      path: cursor.contentPath(),
      name: entry.name,
      title: entry.title,
      lead: entry.lead,
    }
  }
};

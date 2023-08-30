import path from 'path';
import { promises as fs } from 'fs';
import yaml from 'yaml';
import { simpleGit } from 'simple-git';
import { IndexEntry, InnerEntry } from 'filefish/dist/treeindex.js';
import { RefableContentType, IndexingContext, LoadingContext } from 'filefish/dist/content-types.js';
import { folder, FolderNode } from 'fs-inquire';
import { Chapter, ChapterContentType, ChapterEntry, ShallowChapter } from './chapter.js';
import { OkCursor } from 'filefish/dist/cursor.js';
import { LessonContentType, LessonEntry, ShallowLesson } from './lesson.js';
import type { TopicEntry } from './topic.js';

const COURSE_ENTRY_CONTENT_ID = 'course';

export interface CourseEntry extends InnerEntry<ChapterEntry> {
  title: string,
  lead: string,
  image: string,
  repoUrl?: string,
};

interface EntryFile {
  title: string,
  lead: string,
  image: string,
  chapters?: string[];
  lessons?: string[];
}

export interface ShallowCourse {
  path: string;
  name: string;
  title: string;
  lead: string;
  image: string;
  topicMask: string;
}

export interface Course extends ShallowCourse {
  chapters: ShallowChapter[];
}

export const CourseContentType: RefableContentType<FolderNode, CourseEntry, Course, ShallowCourse> = {
  async index(folderNode: FolderNode, context: IndexingContext): Promise<CourseEntry> {
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

    const gitFolder = folder(folderNode).select.folder.byPath('.git');

    let repoUrl: string | undefined = undefined;
    if (gitFolder.isSuccess()) {
      const git = simpleGit({
        baseDir: folderNode.path,
        binary: 'git',
      });
  
      repoUrl = await git.remote(['get-url', 'origin']) as string;
      repoUrl = repoUrl.trim();
    }

    const imageName = entryFile.image.startsWith('assets/')
      ? entryFile.image.slice(7)
      : null;

    return {
      type: 'inner' as const,
      contentId: COURSE_ENTRY_CONTENT_ID,
      fsNode: folderNode,
      name: folderNode.parsedPath.name,
      title: entryFile.title,
      lead: entryFile.lead,
      image: imageName ?? '',
      repoUrl,
      assets: imageName === null ? undefined : [imageName],
      subEntries: entryFile.lessons === undefined
        ? await context.indexMany(folders, ChapterContentType)
        : [{
          type: 'inner' as const,
          contentId: 'chapter',
          name: 'lekce',
          fsNode: folderNode,
          subEntries: await context.indexMany(folders, LessonContentType),
          title: '',
          lead: '',
        }]
    };
  },
  
  fits(entry: IndexEntry): entry is CourseEntry {
    return entry.contentId === COURSE_ENTRY_CONTENT_ID;
  },
  
  async loadContent(cursor: OkCursor, context: LoadingContext): Promise<Course> {
    const topicEntry = cursor.parent().entry() as TopicEntry;
    const entry = cursor.entry() as CourseEntry;
    const subCursors = cursor.children();
    
    const chapters = await context.loadMany(subCursors, ChapterContentType);

    return {
      path: cursor.contentPath(),
      name: entry.name,
      title: entry.title,
      lead: entry.lead,
      image: context.buildAssetPath(cursor, entry.image),
      topicMask: context.buildAssetPath(cursor.parent() as OkCursor, topicEntry.mask),
      chapters: chapters as Chapter[],
    };
  },

  async loadShallowContent(cursor: OkCursor, context: LoadingContext): Promise<ShallowCourse> {
    const topicEntry = cursor.parent().entry() as TopicEntry;
    const entry = cursor.entry() as CourseEntry;
    
    return {
      path: cursor.contentPath(),
      name: entry.name,
      title: entry.title,
      lead: entry.lead,
      image: context.buildAssetPath(cursor, entry.image),
      topicMask: context.buildAssetPath(cursor.parent() as OkCursor, topicEntry.mask),
    };
  }
};

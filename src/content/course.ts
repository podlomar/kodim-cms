import path from 'path';
import { promises as fs } from 'fs';
import yaml from 'yaml';
import { simpleGit } from 'simple-git';
import { InnerEntry } from 'filefish/dist/treeindex.js';
import { IndexingContext, LoadingContext, contentType } from 'filefish/dist/content-types.js';
import { folder, FolderNode } from 'fs-inquire';
import { Chapter, ChapterContentType, ChapterEntry, ShallowChapter } from './chapter.js';
import { OkCursor } from 'filefish/dist/cursor.js';
import { LessonContentType, LessonEntry, ShallowLesson } from './lesson.js';
import { TopicContentType, TopicEntry } from './topic.js';
import { Result } from 'monadix/result';
import { BaseContent, BaseShallowContent, buildBaseContent, buildBaseShallowContent } from './base.js';
import { LoadError } from 'filefish/dist/errors.js';

export interface CourseData {
  readonly lead: string,
  readonly image: string,
}

export type CourseEntry = InnerEntry<
  ChapterEntry,
  CourseData & {
    repoUrl?: string,
  }
>;

interface EntryFile {
  title: string,
  lead: string,
  image: string,
  chapters?: string[];
  lessons?: string[];
}

export interface ShallowCourse extends BaseShallowContent, CourseData {
  topicMask: string;
}

export interface Course extends ShallowCourse, BaseContent {
  chapters: ShallowChapter[];
}

export const CourseContentType = contentType('kodim/course', {
  async indexOne(folderNode: FolderNode, context: IndexingContext): Promise<CourseEntry> {
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

    const data = {
      lead: entryFile.lead,
      image: imageName ?? '',
      repoUrl,
    };

    const subEntries = entryFile.lessons === undefined
      ? await context.indexSubEntries(folders, folderNode.fileName, ChapterContentType)
      : [{
        type: 'inner' as const,
        contentId: ChapterContentType.contentId,
        name: 'lekce',
        fsNode: folderNode,
        subEntries: await context.indexSubEntries(folders, folderNode.fileName, LessonContentType),
        title: '',
        data: {
          lead: ''
        },
      }];

    return {
      ...context.buildInnerEntry(folderNode, data, subEntries),
      title: entryFile.title,
      assets: imageName === null ? undefined : [imageName],
    };
  },
  async loadOne(
    cursor: OkCursor<CourseEntry>, context: LoadingContext,
  ): Promise<Result<Course, LoadError>>  {
    const parentCursor = cursor.parent() as OkCursor<TopicEntry>;
    const topicEntry = parentCursor.entry();
    const entry = cursor.entry();
    const subCursors = cursor.children();
    
    const chapters = Result.collectSuccess(
      await ChapterContentType.loadShallowMany(subCursors, context)
    );

    return Result.success({
      ...buildBaseContent(cursor),
      lead: entry.data.lead,
      image: CourseContentType.buildAssetPath(cursor, entry.data.image, context),
      topicMask: TopicContentType.buildAssetPath(parentCursor, topicEntry.data.mask, context),
      chapters: chapters as Chapter[],
    });
  },
  async loadShallowOne(
    cursor: OkCursor<CourseEntry>, context: LoadingContext,
  ): Promise<Result<ShallowCourse, LoadError>>  {
    const parentCursor = cursor.parent() as OkCursor<TopicEntry>;
    const topicEntry = parentCursor.entry();
    const entry = cursor.entry();
    
    return Result.success({
      ...buildBaseShallowContent(cursor),
      lead: entry.data.lead,
      image: CourseContentType.buildAssetPath(cursor, entry.data.image, context),
      topicMask: TopicContentType.buildAssetPath(parentCursor, topicEntry.data.mask, context),
    });
  }
});

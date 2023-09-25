import path from 'path';
import { promises as fs } from 'fs';
import yaml from 'yaml';
import { InnerEntry } from 'filefish/dist/treeindex.js';
import { IndexingContext, LoadingContext, contentType } from 'filefish/dist/content-types.js';
import { folder, FolderNode } from 'fs-inquire';
import { OkCursor } from 'filefish/dist/cursor.js';
import { CourseContentType, CourseEntry, ShallowCourse } from './course.js';
import { Result, Success } from 'monadix/result';
import { BaseContent, buildBaseContent } from './base.js';
import { KodimCmsIndexingContext } from '../indexing-context.js';

export interface TopicData {
  heading: string,
  image: string,
  mask: string,
  lead: string,
};

export type TopicEntry = InnerEntry<CourseEntry, TopicData>;

interface CourseDef {
  path: string;
  repoUrl: string;
  repoFolder: string;
}

interface EntryFile {
  title: string,
  heading: string,
  image: string,
  mask: string,
  lead: string,
  courses: CourseDef[],
}

export interface Topic extends BaseContent, TopicData {
  courses: ShallowCourse[],
}

export const TopicContentType = contentType('kodim/topic', {
  async indexOne(folderNode: FolderNode, context: IndexingContext): Promise<TopicEntry> {
    const cmsIndexingContext = context as KodimCmsIndexingContext;
    const entryFileContent = await fs.readFile(
      path.resolve(folderNode.path, 'entry.yml'), 'utf-8'
    );
    const entryFile = yaml.parse(entryFileContent) as EntryFile;
    
    const courseFolders = folder(folderNode)
      .select
      .folders
      .byPaths(entryFile.courses.map(course => course.path))
      .getOrThrow();

    for (let i = 0; i < entryFile.courses.length; i++) {
      const def = entryFile.courses[i];
      const folder = courseFolders[i];
      cmsIndexingContext.registerRepo(
        entryFile.courses[i].repoUrl,
        path.resolve(folderNode.path, def.repoFolder),
        [...cmsIndexingContext.parentContentPath.slice(1), folderNode.fileName, folder.fileName],
        CourseContentType,
      );
    }

    const imageName = entryFile.image.startsWith('assets/')
      ? entryFile.image.slice(7)
      : null;
    
    const maskName = entryFile.mask.startsWith('assets/')
      ? entryFile.mask.slice(7)
      : null;
    
    const data = {
      heading: entryFile.heading,
      lead: entryFile.lead,
      image: imageName ?? '',
      mask: maskName ?? '',
    };
    
    const subEntries = await context.indexSubEntries(
      courseFolders, folderNode.fileName, CourseContentType
    );
    const assets = [imageName, maskName].filter((name): name is string => name !== null);

    return {
      ...context.buildInnerEntry(folderNode, data, subEntries),
      title: entryFile.title,
      assets,
    };
  },
  async loadOne(
    cursor: OkCursor<TopicEntry>, context: LoadingContext,
  ): Promise<Result<Topic, 'forbidden' | 'not-found'>>  {
    const entry = cursor.entry();
    const subCursors = cursor.children();

    const courses = Result.collectSuccess(
      await CourseContentType.loadShallowMany(subCursors, context),
    );

    return Result.success({
      ...buildBaseContent(cursor),
      lead: entry.data.lead,
      heading: entry.data.heading,
      image: TopicContentType.buildAssetPath(cursor, entry.data.image, context),
      mask: TopicContentType.buildAssetPath(cursor, entry.data.mask, context),
      courses,
    });
  },
});

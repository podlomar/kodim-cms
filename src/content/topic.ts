import path from 'path';
import { promises as fs } from 'fs';
import yaml from 'yaml';
import { ParentEntry } from 'filefish/indexer';
import { defineContentType } from 'filefish/content-type';
import { folder, FolderNode } from 'fs-inquire';
import { Cursor } from 'filefish/cursor';
import { CourseContentType, CourseEntry, CourseNavItem, courseNavItem } from './course.js';
import { Result, Success } from 'monadix/result';
import { BaseContent, buildBaseContent } from './base.js';
import { Indexer } from 'filefish/indexer';
import { Loader, LoadError } from 'filefish/loader';
import { KodimCmsIndexer } from '../cms-indexer.js';

export interface TopicData {
  heading: string,
  image: string,
  mask: string,
  lead: string,
};

export type TopicEntry = ParentEntry<CourseEntry, TopicData>;

interface CourseDef {
  path: string;
  repoUrl: string;
  repoFolder: string;
}

interface TopicEntryFile {
  title: string,
  heading: string,
  image: string,
  mask: string,
  lead: string,
  courses: CourseDef[],
}

export interface Topic extends BaseContent, TopicData {
  courses: CourseNavItem[],
}

export const TopicContentType = defineContentType('kodim/topic', {
  async indexNode(folderNode: FolderNode, indexer: Indexer): Promise<TopicEntry> {
    const kodimCmsIndexer = indexer as KodimCmsIndexer;
    const entryFileContent = await fs.readFile(
      path.resolve(folderNode.path, 'entry.yml'), 'utf-8'
    );
    const entryFile = yaml.parse(entryFileContent) as TopicEntryFile;
    
    const courseFolders = folder(folderNode)
      .select
      .folders
      .byPaths(entryFile.courses.map(course => course.path))
      .getOrThrow();

    const imageName = entryFile.image.startsWith('assets/')
      ? entryFile.image.slice(7)
      : null;
    
    const maskName = entryFile.mask.startsWith('assets/')
      ? entryFile.mask.slice(7)
      : null;
    
    for (let i = 0; i < entryFile.courses.length; i++) {
      const def = entryFile.courses[i];
      const courseFolder = courseFolders[i];
      kodimCmsIndexer.registerRepo(
        entryFile.courses[i].repoUrl,
        path.resolve(folderNode.path, def.repoFolder),
        [...indexer.contentPath.slice(1), folderNode.fileName, courseFolder.fileName],
        CourseContentType,
      );
    }

    const data = {
      heading: entryFile.heading,
      lead: entryFile.lead,
      image: imageName ?? '',
      mask: maskName ?? '',
    };
    
    const subEntries = await indexer.indexChildren(courseFolders, CourseContentType);
    const assets = [imageName, maskName].filter((name): name is string => name !== null);

    return {
      ...indexer.buildParentEntry(folderNode, data, subEntries),
      title: entryFile.title,
      assets,
    };
  },

  async loadContent(
    cursor: Cursor<TopicEntry>, loader: Loader,
  ): Promise<Result<Topic, LoadError>>  {
    const entry = cursor.entry();
    return Result.success({
      ...buildBaseContent(cursor),
      lead: entry.data.lead,
      heading: entry.data.heading,
      image: TopicContentType.buildAssetPath(cursor, entry.data.image, loader),
      mask: TopicContentType.buildAssetPath(cursor, entry.data.mask, loader),
      courses: cursor.children().map((c) => courseNavItem(c, loader)),
    });
  },
});

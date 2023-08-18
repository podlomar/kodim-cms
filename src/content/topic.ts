import path from 'path';
import { promises as fs } from 'fs';
import yaml from 'yaml';
import { IndexEntry, InnerEntry } from 'filefish/dist/treeindex.js';
import { IndexingContext, LoadingContext, ContentType } from 'filefish/dist/content-types.js';
import { folder, FolderNode } from 'fs-inquire';
import { OkCursor } from 'filefish/dist/cursor.js';
import { Course, CourseContentType, CourseEntry, ShallowCourse } from './course.js';

const TOPIC_ENTRY_CONTENT_ID = 'topic';

export interface TopicEntry extends InnerEntry<CourseEntry> {
  title: string,
  heading: string,
  image: string,
  mask: string,
  lead: string,
};

interface EntryFile {
  title: string,
  heading: string,
  image: string,
  mask: string,
  lead: string,
  courses: string[];
}

export interface Topic {
  name: string,
  title: string,
  heading: string,
  image: string,
  mask: string,
  lead: string,
  courses: ShallowCourse[],
}

export const TopicContentType: ContentType<FolderNode, TopicEntry, Topic> = {
  async index(folderNode: FolderNode, context: IndexingContext): Promise<TopicEntry> {
    const entryFileContent = await fs.readFile(
      path.resolve(folderNode.path, 'entry.yml'), 'utf-8'
    );
    const entryFile = yaml.parse(entryFileContent) as EntryFile;
    
    const courseFolders = folder(folderNode)
      .select
      .folders
      .byNames(entryFile.courses)
      .getOrThrow();

    const subEntries = await context.indexMany(courseFolders, CourseContentType);
    const imageName = entryFile.image.startsWith('assets/')
      ? entryFile.image.slice(7)
      : null;
    const maskName = entryFile.mask.startsWith('assets/')
      ? entryFile.mask.slice(7)
      : null;
    
    const assets = [imageName, maskName].filter((name): name is string => name !== null);

    return {
      type: 'inner',
      contentId: TOPIC_ENTRY_CONTENT_ID,
      fsNode: folderNode,
      name: folderNode.parsedPath.name,
      title: entryFile.title,
      heading: entryFile.heading,
      lead: entryFile.lead,
      image: imageName ?? '',
      mask: maskName ?? '',
      assets,
      subEntries,
    };
  },
  
  fits(entry: IndexEntry): entry is TopicEntry {
    return entry.contentId === TOPIC_ENTRY_CONTENT_ID;
  },
  
  async loadContent(cursor: OkCursor, context: LoadingContext): Promise<Topic> {
    const entry = cursor.entry() as TopicEntry;
    const subCursors = cursor.children();
    
    const courses = (
      await context.loadMany(subCursors, CourseContentType)
    ) as Course[];

    return {
      name: entry.name,
      title: entry.title,
      lead: entry.lead,
      image: context.buildAssetPath(cursor, entry.image),
      mask: context.buildAssetPath(cursor, entry.mask),
      heading: entry.heading,
      courses,
    };
  },
};

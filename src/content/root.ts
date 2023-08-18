import path from 'path';
import { promises as fs } from 'fs';
import yaml from 'yaml';
import { IndexEntry, InnerEntry } from 'filefish/dist/treeindex.js';
import { ContentType, IndexingContext, LoadingContext } from 'filefish/dist/content-types.js';
import { folder, FolderNode } from 'fs-inquire';
import { OkCursor } from 'filefish/dist/cursor.js';
import { Topic, TopicContentType, TopicEntry } from './topic.js';

const ROOT_ENTRY_CONTENT_ID = 'root';

interface EntryFile {
  topics: string[];
}

export type RootEntry = InnerEntry<TopicEntry>;

export interface Root {
  topics: Topic[];
}

export const RootContentType: ContentType<FolderNode, RootEntry, Root> = {
  async index(folderNode: FolderNode, context: IndexingContext): Promise<RootEntry> {
    const entryFileContent = await fs.readFile(
      path.resolve(folderNode.path, 'entry.yml'), 'utf-8'
    );
    const entryFile = yaml.parse(entryFileContent) as EntryFile;
    
    const topicFolders = folder(folderNode)
      .select
      .folders
      .byNames(entryFile.topics)
      .getOrThrow();

    const subEntries = await context.indexMany(topicFolders, TopicContentType);
  
    return {
      type: 'inner',
      contentId: ROOT_ENTRY_CONTENT_ID,
      name: '',
      fsNode: folderNode,
      subEntries,
    };
  },
  
  fits(entry: IndexEntry): entry is RootEntry {
    return entry.contentId === ROOT_ENTRY_CONTENT_ID;
  },

  async loadContent(cursor: OkCursor, context: LoadingContext): Promise<Root> {
    const entry = cursor.entry() as RootEntry;
    const subCursors = cursor.children();
    
    const topics = (
      await context.loadMany(subCursors, TopicContentType)
    ) as Topic[];

    return { topics };
  },
};

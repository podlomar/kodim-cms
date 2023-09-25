import path from 'path';
import { promises as fs } from 'fs';
import yaml from 'yaml';
import { InnerEntry } from 'filefish/dist/treeindex.js';
import { IndexingContext, LoadingContext, contentType } from 'filefish/dist/content-types.js';
import { folder, FolderNode } from 'fs-inquire';
import { OkCursor } from 'filefish/dist/cursor.js';
import { Topic, TopicContentType, TopicEntry } from './topic.js';
import { Result } from "monadix/result";

interface EntryFile {
  topics: string[];
}

export type RootEntry = InnerEntry<TopicEntry>;

export interface Root {
  topics: Topic[];
}

export const RootContentType = contentType('kodim/root', {
  async indexOne(folderNode: FolderNode, context: IndexingContext): Promise<RootEntry> {
    const entryFileContent = await fs.readFile(
      path.resolve(folderNode.path, 'entry.yml'), 'utf-8'
    );
    const entryFile = yaml.parse(entryFileContent) as EntryFile;
    
    const topicFolders = folder(folderNode)
      .select
      .folders
      .byPaths(entryFile.topics)
      .getOrThrow();

    const subEntries = await context.indexSubEntries(
      topicFolders, '', TopicContentType
    );
  
    return {
      ...context.buildInnerEntry(folderNode, {}, subEntries),
      name: '',
    };
  },
  async loadOne(
    cursor: OkCursor<RootEntry>, context: LoadingContext,
  ): Promise<Result<Root, 'forbidden' | 'not-found'>> {
    const topics = Result.collectSuccess(
      await TopicContentType.loadMany(cursor.children(), context)
    );

    return Result.success({ topics });
  }
});

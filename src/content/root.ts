import path from 'path';
import { promises as fs } from 'fs';
import yaml from 'yaml';
import { ParentEntry, Indexer } from 'filefish/indexer';
import { defineContentType } from 'filefish/content-type';
import { folder, FolderNode } from 'fs-inquire';
import { Cursor } from 'filefish/cursor';
import { Topic, TopicContentType, TopicEntry } from './topic.js';
import { Result } from "monadix/result";
import { Loader } from 'filefish/loader';

interface EntryFile {
  topics: string[];
}

export type RootEntry = ParentEntry<TopicEntry>;

export interface Root {
  topics: Topic[];
}

export const RootContentType = defineContentType('kodim/root', {
  async indexNode(folderNode: FolderNode, indexer: Indexer): Promise<RootEntry> {
    const entryFileContent = await fs.readFile(
      path.resolve(folderNode.path, 'entry.yml'), 'utf-8'
    );
    const entryFile = yaml.parse(entryFileContent) as EntryFile;
    
    const topicFolders = folder(folderNode)
      .select
      .folders
      .byPaths(entryFile.topics)
      .getOrThrow();

    const subEntries = await indexer.indexChildren(topicFolders, TopicContentType);
  
    return {
      ...indexer.buildParentEntry(folderNode, {}, subEntries),
      name: '',
    };
  },

  async loadContent(
    cursor: Cursor<RootEntry>, loader: Loader,
  ): Promise<Result<Root, 'forbidden' | 'not-found'>> {
    const topics = Result.collectSuccess(
      await Promise.all(cursor.children().map((c) => TopicContentType.loadContent(c, loader)))
    );

    return Result.success({ topics });
  }
});

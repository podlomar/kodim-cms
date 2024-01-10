import { ParentEntry, Indexer } from 'filefish/indexer';
import { defineContentType } from 'filefish/content-type';
import { Cursor } from 'filefish/cursor';
import { Topic, TopicContentType, TopicEntry, TopicSource } from './topic.js';
import { Result } from "monadix/result";
import { Loader } from 'filefish/loader';

export interface RootSource {
  readonly topics: TopicSource[];
}

export type RootEntry = ParentEntry<RootSource, TopicEntry>;

export interface Root {
  readonly topics: Topic[];
}

export const RootContentType = defineContentType('kodim/root', {
  async index(source: RootSource, indexer: Indexer): Promise<RootEntry> {
    const subEntries = await indexer.indexChildren(
      '', source.topics, TopicContentType
    );
    
    return indexer.buildParentEntry('', source, 'public', {}, subEntries);
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

import { Indexer, ParentEntry } from 'filefish/indexer';
import { defineContentType } from 'filefish/content-type';
import { folder, FolderNode } from 'fs-inquire';
import { Cursor } from 'filefish/cursor';
import { Result } from 'monadix/result';
import { BaseContent, buildBaseContent } from './base.js';
import { LoadError, Loader } from 'filefish/loader';
import { ArticleContentType, ArticleEntry, ArticleNavItem, articleNavItem } from './article.js';

export type ArticlesEntry = ParentEntry<FolderNode, ArticleEntry, {}>;

export interface Articles extends BaseContent {
  articles: ArticleNavItem[],
};

export const ArticlesContentType = defineContentType('kodim/articles', {
  async index(source: FolderNode, indexer: Indexer): Promise<ArticlesEntry> {
    const folders = folder(source)
      .select
      .folders
      .all()
      .getOrThrow();

    const subEntries = await indexer.indexChildren(
      'clanky', folders, ArticleContentType,
    );

    subEntries.sort((a, b) => {
      return b.data.date.localeCompare(a.data.date);
    });

    return indexer.buildParentEntry('clanky', source, 'public', {}, subEntries);
  },

  async loadContent(
    cursor: Cursor<ArticlesEntry>, loader: Loader,
  ): Promise<Result<Articles, LoadError>>  {
    return Result.success({
      ...buildBaseContent(cursor),
      articles: cursor.children().map(articleNavItem),
    });
  },
});

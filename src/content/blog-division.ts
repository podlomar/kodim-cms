import { ParentEntry } from 'filefish/indexer';
import { defineContentType } from 'filefish/content-type';
import { Cursor } from 'filefish/cursor';
import { Result } from 'monadix/result';
import { BaseContent, buildBaseContent } from './base.js';
import { Indexer } from 'filefish/indexer';
import { Loader, LoadError } from 'filefish/loader';
import { FolderNode } from 'fs-inquire/dist/fsnodes.js';
import { ArticleNavItem, articleNavItem } from './article.js';
import { ArticlesContentType, ArticlesEntry } from './articles.js';

export interface BlogDivision extends BaseContent {
  type: 'blog',
  interest: string,
  articles: ArticleNavItem[],
};

export type BlogDivisionEntry = ParentEntry<FolderNode, ArticlesEntry, {}>;

export const BlogDivisionContentType = defineContentType('kodim/blog-division', {
  async index(source: FolderNode, indexer: Indexer): Promise<BlogDivisionEntry> {
    const articlesEntry = await indexer.indexChild('clanky', source, ArticlesContentType);
    return {
      ...indexer.buildParentEntry('blog', source, 'public', {}, [articlesEntry]),
      title: 'Blog',
    };
  },

  async loadContent(
    cursor: Cursor<BlogDivisionEntry>, loader: Loader,
  ): Promise<Result<BlogDivision, LoadError>>  {
    const articlesCursor = cursor.nthChild(0);
    
    if (articlesCursor === null) {
      return Result.fail('not-found');
    }

    const articles = articlesCursor.children().map(articleNavItem);
    return Result.success({
      ...buildBaseContent(cursor),
      type: 'blog',
      interest: 'Články na blogu',
      articles,
    });
  },
});

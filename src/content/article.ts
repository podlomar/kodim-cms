import path from 'path';
import { Indexer, LeafEntry } from 'filefish/indexer';
import { defineContentType } from 'filefish/content-type';
import { FolderNode } from 'fs-inquire';
import { Cursor } from 'filefish/cursor';
import { BaseContent, BaseNavItem, buildBaseContent } from './base.js';
import { LoadError, Loader } from 'filefish/loader';
import { Result } from 'monadix/result';
import { Root as HastRoot } from 'hast';
import { MarkdownSource } from '../render/markdown-source.js';

export interface Author {
  name: string;
  link?: string;
  avatar?: string;
}

export type ArticleData = {
  lead: string,
  author: Author,
  date: string,
  draft: boolean,
}

export type ArticleEntry = LeafEntry<FolderNode, ArticleData>;

export interface ArticleNavItem extends BaseNavItem, ArticleData {};

export interface Article extends ArticleNavItem, BaseContent {
  prev: ArticleNavItem | null,
  next: ArticleNavItem | null,
  content: HastRoot
}

export const articleNavItem = (cursor: Cursor<ArticleEntry>): ArticleNavItem => {
  const entry = cursor.entry();
  return {
    path: cursor.contentPath(),
    name: entry.name,
    title: entry.title,
    author: entry.data.author,
    lead: entry.data.lead,
    date: entry.data.date,
    draft: entry.data.draft,
  };
};

interface ArticleFile {
  readonly title: string;
  readonly lead: string;
  readonly author: Author;
  readonly date: string;
  readonly assets: string[];
  readonly draft: boolean;
}

const indexArticle = async (filePath: string): Promise<ArticleFile> => {
  const source = await MarkdownSource.fromFile(filePath);
  const assets = source.collectAssets();
  const frontMatter = source.getFrontMatter();

  return {
    title: frontMatter.title ?? 'Unknown title',
    lead: frontMatter.lead ?? '',
    author: {
      name: frontMatter.author?.name ?? 'Uknown author',
      link: frontMatter.author?.link,
      avatar: frontMatter.author?.avatar,
    },
    date: frontMatter.date ?? 'Unknown date',
    draft: frontMatter.draft ?? false,
    assets,
  };
}

export const loadArticle = async (
  filePath: string, cursor: Cursor<ArticleEntry>, loader: Loader,
): Promise<HastRoot | null> => {
  try {
    const source = await MarkdownSource.fromFile(filePath);
    return source.process(cursor, loader);
  } catch {
    return null;
  }
};

export const ArticleContentType = defineContentType('kodim/article', {
  async index(source: FolderNode, indexer: Indexer): Promise<ArticleEntry> {
    const articleFile = await indexArticle(path.join(source.path, 'article.md'));
    const data: ArticleData = {
      lead: articleFile.lead,
      author: articleFile.author,
      date: articleFile.date,
      draft: articleFile.draft,
    };

    return {
      ...indexer.buildLeafEntry(source.fileName, source, 'public', data),
      title: articleFile.title,
      assets: {
        folder: path.join(source.path, 'assets'),
        names: articleFile.assets,
      },
    };
  },

  async loadContent(
    cursor: Cursor<ArticleEntry>, loader: Loader,
  ): Promise<Result<Article, LoadError>> {
    const entry = cursor.entry();
    const prevSibling = cursor.prevSibling();
    const nextSibling = cursor.nextSibling();
    const content = await loadArticle(
      path.join(entry.source.path, 'article.md'), cursor, loader
    );
    
    if (content === null) {
      return Result.fail('not-found');
    }

    return Result.success({
      ...buildBaseContent(cursor),  
      lead: entry.data.lead,
      author: entry.data.author,
      date: entry.data.date,
      draft: entry.data.draft,
      prev: prevSibling === null ? null : articleNavItem(prevSibling),
      next: nextSibling === null ? null : articleNavItem(nextSibling),
      content,
    });
  },
});

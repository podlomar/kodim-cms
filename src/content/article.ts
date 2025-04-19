import { promises as fs } from 'fs';
import path from 'path';
import yaml from 'yaml';
import { Indexer, LeafEntry } from 'filefish/indexer';
import { defineContentType } from 'filefish/content-type';
import { FolderNode } from 'fs-inquire';
import { Cursor } from 'filefish/cursor';
import { BaseContent, BaseNavItem, buildBaseContent } from './base.js';
import { LoadError, Loader } from 'filefish/loader';
import { Result } from 'monadix/result';
import { Root as HastRoot, RootContent } from 'hast';
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

export type ArticleEntry = LeafEntry<FolderNode, ArticleData> & {
  seriesFile: string | null,
};

export interface ArticleNavItem extends BaseNavItem, ArticleData { };

export interface Article extends ArticleNavItem, BaseContent {
  prev: ArticleNavItem | null,
  next: ArticleNavItem | null,
  content: HastRoot,
  summary: HastRoot | null,
  seriesIndex: SeriesIndex | null,
  styles: string[],
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
  readonly series: string | null;
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
    series: frontMatter.series ?? null,
    date: frontMatter.date ?? 'Unknown date',
    draft: frontMatter.draft ?? false,
    assets,
  };
}

export interface SeriesIndex {
  title: string;
  lead: string;
  parts: {
    title: string;
    link: string;
    lead: string;
  }[];
}

export const loadSeriesIndex = async (file: string): Promise<SeriesIndex | null> => {
  try {
    const content = await fs.readFile(file, 'utf-8');
    return yaml.parse(content);
  } catch (e) {
    console.error('Error loading series index:', e);
    return null;
  }
};

interface LoadedArticle {
  summary: HastRoot | null,
  content: HastRoot,
  seriesIndex: SeriesIndex | null,
  styles: string[],
}

export const loadArticle = async (
  filePath: string, cursor: Cursor<ArticleEntry>, loader: Loader,
): Promise<LoadedArticle | null> => {
  try {
    const source = await MarkdownSource.fromFile(filePath);
    const { content: root, styles } = await source.process(cursor, loader);

    const rootChildren: RootContent[] = [];
    let summary: RootContent | null = null;

    for (const node of root.children) {
      if (node.type === 'doctype' || node.type === 'comment') {
        continue;
      }

      if (node.type === 'text' && node.value.trim() === '') {
        continue;
      }

      if (node.type === 'element' && node.tagName === 'summary') {
        summary = node;
        continue;
      }

      rootChildren.push(node);
    }

    const seriesFile = cursor.entry().seriesFile;
    const seriesIndex = seriesFile === null
      ? null
      : await loadSeriesIndex(seriesFile);

    return {
      summary: summary === null ? null : {
        type: 'root',
        children: summary.children,
      },
      content: {
        ...root,
        children: rootChildren,
      },
      seriesIndex,
      styles,
    };
  } catch {
    return null;
  }
};

export const ArticleContentType = defineContentType('kodim/article', {
  async index(source: FolderNode, indexer: Indexer): Promise<ArticleEntry> {
    const articleFile = await indexArticle(path.join(source.path, 'article.md'));
    const seriesFile = articleFile.series === null
      ? null
      : path.join(path.dirname(source.path), '../series', `${articleFile.series}.yml`);

    const data: ArticleData = {
      lead: articleFile.lead,
      author: articleFile.author,
      date: articleFile.date,
      draft: articleFile.draft,
    };

    return {
      ...indexer.buildLeafEntry(source.fileName, source, 'public', data),
      title: articleFile.title,
      seriesFile,
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
    const loaded = await loadArticle(
      path.join(entry.source.path, 'article.md'), cursor, loader
    );

    if (loaded === null) {
      return Result.fail('not-found');
    }

    const { content, summary, seriesIndex, styles } = loaded;
    return Result.success({
      ...buildBaseContent(cursor),
      lead: entry.data.lead,
      author: entry.data.author,
      seriesIndex,
      date: entry.data.date,
      draft: entry.data.draft,
      prev: prevSibling === null ? null : articleNavItem(prevSibling),
      next: nextSibling === null ? null : articleNavItem(nextSibling),
      content,
      summary,
      styles,
    });
  },
});

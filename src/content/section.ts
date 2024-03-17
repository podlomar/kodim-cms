import path from 'node:path';
import { EntryAccess, Indexer, ParentEntry } from 'filefish/indexer';
import { defineContentType } from 'filefish/content-type';
import { FileNode, folder, fsNode } from 'fs-inquire';
import { toString as mdastToString } from 'mdast-util-to-string'
import { Cursor } from 'filefish/cursor';
import { ExerciseContentType, ExerciseEntry, ExerciseNavItem, exerciseNavItem } from './exercise.js';
import { processSection } from '../render/markdown.js';
import { Root as HastRoot } from 'hast';
import { MarkdownSource } from '../render/markdown-source.js';
import { BaseContent, BaseNavItem, buildBaseContent } from './base.js';
import { LoadError, Loader } from 'filefish/loader';
import { Result } from 'monadix/result';


export type SectionEntry = ParentEntry<FileNode, ExerciseEntry>;

interface SectionFile {
  title?: string;
  access?: EntryAccess;
  assets: string[];
  excs: string[];
}

export interface SectionNavItem extends BaseNavItem {
  exercises?: ExerciseNavItem[],
}

export interface TextBlock {
  type: 'hast',
  root: HastRoot,
}

export interface ExerciseBlock {
  type: 'excs',
  excs: ExerciseNavItem[],
}

export type SectionBlock = TextBlock | ExerciseBlock;

export interface Section extends SectionNavItem, BaseContent {
  blocks: SectionBlock[],
  prev: SectionNavItem | null,
  next: SectionNavItem | null,
}

export const indexSection = async (file: string): Promise<SectionFile | undefined> => {
  try {
    const source = await MarkdownSource.fromFile(file);
    const tree = source.getRoot();

    let title: string | undefined = undefined;
    let excs: string[] = [];

    for (const node of tree.children) {
      if (node.type === "heading" && node.depth === 2 && title === undefined) {
        title = mdastToString(node);
      }

      if (node.type === "leafDirective" && node.name === "exc") {
        const content = node.children[0];
        if (content.type === "text") {
          excs.push(content.value.trim());
        }
      }
    }

    const assets = source.collectAssets();

    return { title, excs, assets };
  } catch (err: any) {
    const { code } = err;
    if (code === 'ENOENT') {
      return undefined;
    } else {
      throw err;
    }
  }
};

export const sectionNavItem = (cursor: Cursor<SectionEntry>): SectionNavItem => {
  const entry = cursor.entry();
  const exercises = cursor.children().map(exerciseNavItem);
  return {
    path: cursor.contentPath(),
    name: entry.name,
    title: entry.title,
    exercises,
  };
};

export const SectionContentType = defineContentType('kodim/section', {
  async index(source: FileNode, indexer: Indexer): Promise<SectionEntry> {
    const sectionFile = await indexSection(source.path);
    const excsNodes = fsNode(source)
      .parent
      .select
      .nodes
      .byPaths(sectionFile?.excs ?? [], '', '.md')
      .getOrThrow();

    const access = sectionFile?.access ?? 'protected';
    const subEntries = await indexer.indexChildren(source.fileName, excsNodes, ExerciseContentType);
    const baseEntry = indexer.buildParentEntry(source.fileName, source, access, {}, subEntries);
    
    return {
      ...baseEntry,
      title: sectionFile?.title ?? baseEntry.title,
      assets: {
        folder: path.resolve(source.path, '../assets'),
        names: sectionFile?.assets ?? [],
      },
    }
  },
  async loadContent(
    cursor: Cursor<SectionEntry>, loader: Loader,
  ): Promise<Result<Section, LoadError>> {
    const entry = cursor.entry();
    const prevSibling = cursor.prevSibling();
    const nextSibling = cursor.nextSibling();
    const blocks = await processSection(entry.source.path, cursor, loader);

    return Result.success({
      ...buildBaseContent(cursor),
      prev: prevSibling === null ? null : sectionNavItem(prevSibling),
      next: nextSibling === null ? null : sectionNavItem(nextSibling),
      blocks,
    });
  },
});

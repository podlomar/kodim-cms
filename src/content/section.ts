import path from 'path';
import { InnerEntry } from 'filefish/dist/treeindex.js';
import { IndexingContext, LoadingContext, contentType } from 'filefish/dist/content-types.js';
import { FileNode, folder, fsNode } from 'fs-inquire';
import { toString as mdastToString } from 'mdast-util-to-string'
import { OkCursor } from 'filefish/dist/cursor.js';
import { ExerciseContentType, ExerciseEntry, ShallowExercise } from './exercise.js';
import { processSection } from '../render/markdown.js';
import { Root as HastRoot } from 'hast';
import { MarkdownSource } from '../render/markdown-source.js';
import { BaseContent, BaseShallowContent, buildBaseContent } from './base.js';
import { LoadError } from 'filefish/dist/errors.js';
import { Result } from 'monadix/result';

export type SectionEntry = InnerEntry<ExerciseEntry>;

interface SectionFile {
  title?: string;
  assets: string[];
  excs: string[];
}

export type ShallowSection = BaseShallowContent;

export interface TextBlock {
  type: 'hast',
  root: HastRoot,
}

export interface ExerciseBlock {
  type: 'excs',
  excs: ShallowExercise[],
}

export type SectionBlock = TextBlock | ExerciseBlock;

export interface Section extends ShallowSection, BaseContent {
  blocks: SectionBlock[],
  prev: ShallowSection | null,
  next: ShallowSection | null,
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

export const SectionContentType = contentType('kodim/section', {
  async indexOne(file: FileNode, context: IndexingContext): Promise<SectionEntry> {
    const sectionFile = await indexSection(file.path);
    const excsNodes = fsNode(file)
      .parent
      .select
      .nodes
      .byPaths(sectionFile?.excs ?? [], '', '.md')
      .getOrThrow();

    const subEntries = await context.indexSubEntries(excsNodes, file.fileName, ExerciseContentType);
    const baseEntry = context.buildInnerEntry(file, {}, subEntries);
    return {
      ...baseEntry,
      title: sectionFile?.title ?? baseEntry.title,
      assets: sectionFile?.assets,
    }
  },
  async loadOne(
    cursor: OkCursor<SectionEntry>, context: LoadingContext
  ): Promise<Result<Section, LoadError>> {
    const entry = cursor.entry();
    const prev = await cursor.prevSibling().loadShallow(SectionContentType, context);
    const next = await cursor.nextSibling().loadShallow(SectionContentType, context);
    const blocks = await processSection(entry.fsNode.path, cursor, context);

    return Result.success({
      ...buildBaseContent(cursor),
      prev: prev.getOrElse(null),
      next: next.getOrElse(null),
      blocks,
    });
  },
  async loadShallowOne(
    cursor: OkCursor<SectionEntry>
  ): Promise<Result<ShallowSection, LoadError>> {
    const entry = cursor.entry();
    return Result.success({
      path: cursor.contentPath(),
      name: entry.name,
      title: entry.title,
    });
  }
});

import path from 'path';
import { promises as fs } from 'fs';
import { unified } from "unified";
import { selectAll } from 'unist-util-select';
import markdown from "remark-parse";
import directive from "remark-directive";
import rehype from "remark-rehype";
import stringify from "rehype-stringify";
import { IndexEntry, InnerEntry, LeafEntry } from 'filefish/dist/treeindex.js';
import { RefableContentType, IndexingContext, LoadingContext } from 'filefish/dist/content-types.js';
import { FileNode, folder, fsNode } from 'fs-inquire';
import { OkCursor } from 'filefish/dist/cursor.js';
import { ExerciseContentType, ExerciseEntry, ShallowExercise } from './exercise.js';
import { SectionProcessor } from '../render/markdown.js';
import { Content, Root } from 'mdast';
import { Root as HastRoot } from 'hast';

const SECTION_ENTRY_CONTENT_ID = 'section';

export interface SectionEntry extends InnerEntry<ExerciseEntry> {
  title: string,
}

interface SectionFile {
  title: string;
  assets: string[];
  excs: string[];
}

export interface ShallowSection {
  path: string,
  name: string;
  title: string,
};

export interface TextBlock {
  type: 'hast',
  root: HastRoot,
}

export interface ExerciseBlock {
  type: 'excs',
  excs: ShallowExercise[],
}

export type SectionBlock = TextBlock | ExerciseBlock;

export interface Section extends ShallowSection {
  blocks: SectionBlock[],
  prev: ShallowSection | null,
  next: ShallowSection | null,
}

export const processor = unified()
  .use(markdown)
  .use(directive)
  .use(rehype)
  .use(stringify);

export const indexAssets = (tree: Root): string[] => {
  const assets = [] as string[];
  const nodes = selectAll('image, link, leafDirective[name=fig]', tree) as Content[];

  for (const content of nodes) {
    let url: string | null = null;
    if (content.type === 'image' || content.type === 'link') {
      if (content.url.startsWith('assets/')) {
        url = content.url;
      }
    } else if (content.type === 'leafDirective') {
      const src = content.attributes?.src ?? '';
      if (src.startsWith('assets/')) {
        url = src;
      }
    }
    
    if (url !== null) {
      assets.push(url.slice(7));
    }
  }
  
  return assets;
}

export const indexSection = async (file: string): Promise<SectionFile | undefined> => {
  try {
    const text = await fs.readFile(file, "utf-8");
    const tree = processor.parse(text);

    let title: string | null = null;
    let excs: string[] = [];

    for (const node of tree.children) {
      if (node.type === "heading" && node.depth === 2) {
        const content = node.children[0];
        if (content.type === "text" && title === null) {
          title = content.value;
        }
      }

      if (node.type === "leafDirective" && node.name === "exc") {
        const content = node.children[0];
        if (content.type === "text") {
          excs.push(content.value.trim());
        }
      }
    }

    if (title === null) {
      title = path.basename(file);
    }

    const assets = indexAssets(tree);

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

const sectionProcessor = new SectionProcessor();

export const SectionContentType: RefableContentType<
  FileNode, SectionEntry, Section, ShallowSection
> = {
  async index(file: FileNode, context: IndexingContext): Promise<SectionEntry> {
    const sectionFile = await indexSection(file.path);
    const excsNodes = fsNode(file)
      .parent
      .select
      .nodes
      .byPaths(sectionFile?.excs ?? [], 'md')
      .getOrThrow();

    const subEntries = await context.indexMany(excsNodes, ExerciseContentType);

    return {
      type: 'inner',
      contentId: SECTION_ENTRY_CONTENT_ID,
      name: file.parsedPath.name,
      fsNode: file,
      title: sectionFile?.title ?? 'not-found',
      assets: sectionFile?.assets,
      subEntries,
    }
  },
  
  fits(entry: IndexEntry): entry is SectionEntry {
    return entry.contentId === SECTION_ENTRY_CONTENT_ID;
  },
  
  async loadContent(cursor: OkCursor, context: LoadingContext): Promise<Section> {
    const entry = cursor.entry() as SectionEntry;
    const prevCursor = cursor.prevSibling();
    const nextCursor = cursor.nextSibling();
    const blocks = await sectionProcessor.process(entry.fsNode.path, cursor, context);

    return {
      path: cursor.contentPath(),
      name: entry.name,
      title: entry.title,
      prev: prevCursor.isOk()
        ? (await context.loadShallow(prevCursor, SectionContentType)) as ShallowSection
        : null,
      next: nextCursor.isOk()
        ? (await context.loadShallow(nextCursor, SectionContentType)) as ShallowSection
        : null,
      blocks,
    }
  },

  async loadShallowContent(cursor: OkCursor): Promise<ShallowSection> {
    const entry = cursor.entry() as SectionEntry;
    return {
      path: cursor.contentPath(),
      name: entry.name,
      title: entry.title,
    }
  }
};

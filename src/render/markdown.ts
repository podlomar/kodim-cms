import { SectionBlock } from "../content/section.js";
import { RootContent, Text } from "hast";
import { LoadingContext } from "filefish/dist/content-types.js";
import { OkCursor } from "filefish/dist/cursor.js";
import { Exercise, ExerciseContentType, ExerciseEntry } from "../content/exercise.js";
import { MarkdownSource } from "./markdown-source.js";
import { FsNode } from "fs-inquire";
import { crumbsFromCursor } from "../content/crumbs.js";

export const processSection = async (
  file: string, cursor: OkCursor, context: LoadingContext,
): Promise<SectionBlock[]> => {
  const source = await MarkdownSource.fromFile(file);
  const root = await source.process(cursor, context);
  const blocks: SectionBlock[] = [];

  for(const node of root.children) {
    if (node.type === 'doctype' || node.type === 'comment') {
      continue;
    }
      
    if (node.type === 'text' && node.value.trim() === '') {
      continue;
    }

    let lastBlock = blocks.at(-1);
    if (node.type === 'element' && node.tagName === 'exc') {
      const content = (node.children[0] as Text).value as string;
      const name = content.trim().split('/').at(-1)!;
      const excCursor = cursor.navigate(name);
      if (!excCursor.isOk()) {
        continue;
      }

      const exc = await context.loadShallow(excCursor, ExerciseContentType);     
      if (exc === 'mismatch') {
        continue;
      }

      if (lastBlock === undefined || lastBlock.type !== 'excs') {
        blocks.push({ type: 'excs', excs: [exc] });
      } else {
        lastBlock.excs.push(exc);
      }
      continue;
    }

    if (lastBlock === undefined || lastBlock.type !== 'hast') {
      blocks.push({
        type: 'hast',
        root: {
          type: 'root',
          children: [node],
        }
      });
    } else {
      lastBlock.root.children.push(node);
    } 
  }
    
  return blocks;
};

export const processExercise = async (
  fsNode: FsNode, cursor: OkCursor, context: LoadingContext
): Promise<Exercise> => {
  const filePath = fsNode.type === 'file'
    ? fsNode.path
    : fsNode.path + '/exercise.md';
  
  const entry = cursor.entry() as ExerciseEntry;
  const source = await MarkdownSource.fromFile(filePath);
  const root = await source.process(cursor, context);
  
  const rootChildren: RootContent[] = [];
  let solution: RootContent | null = null;
  
  for(const node of root.children) {
    if (node.type === 'doctype' || node.type === 'comment') {
      continue;
    }
    
    if (node.type === 'text' && node.value.trim() === '') {
      continue;
    }

    if (node.type === 'element' && node.tagName === 'solution') {
      solution = node;
      continue;
    }

    rootChildren.push(node);
  }
  
  return {
    crumbs: crumbsFromCursor(cursor),
    path: cursor.contentPath(),
    name: entry.name,
    lead: entry.lead,
    title: entry.title,
    demand: entry.demand,
    num: cursor.pos() + 1,
    assign: {
      ...root,
      children: rootChildren,
    },
    solution: solution === null || entry.solutionAccess === 'hide'
      ? 'none'
      : entry.solutionAccess === 'lock'
        ? 'locked'
        : {
          type: 'root',
          children: solution.children,
        },
  };
};

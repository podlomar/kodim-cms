import { SectionBlock, SectionContentType, SectionEntry } from "../content/section.js";
import { RootContent, Text } from "hast";
import { LoadingContext } from "filefish/dist/content-types.js";
import { OkCursor } from "filefish/dist/cursor.js";
import { Exercise, ExerciseContentType, ExerciseEntry } from "../content/exercise.js";
import { MarkdownSource } from "./markdown-source.js";
import { FsNode } from "fs-inquire";
import { buildBaseContent } from "../content/base.js";

export const processSection = async (
  file: string, cursor: OkCursor<SectionEntry>, context: LoadingContext,
): Promise<SectionBlock[]> => {
  const source = await MarkdownSource.fromFile(file);
  const root = await source.process(cursor, SectionContentType, context);
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

      const excResult = await excCursor.loadShallow(ExerciseContentType, context);
      if (excResult.isFail()) {
        continue;
      }

      if (lastBlock === undefined || lastBlock.type !== 'excs') {
        blocks.push({ type: 'excs', excs: [excResult.get()] });
      } else {
        lastBlock.excs.push(excResult.get());
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
  fsNode: FsNode, cursor: OkCursor<ExerciseEntry>, context: LoadingContext,
): Promise<Exercise> => {
  const filePath = fsNode.type === 'file'
    ? fsNode.path
    : fsNode.path + '/exercise.md';
  
  const entry = cursor.entry() as ExerciseEntry;
  const source = await MarkdownSource.fromFile(filePath);
  const root = await source.process(cursor, ExerciseContentType, context);
  
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
    ...buildBaseContent(cursor),
    lead: entry.data.lead,
    demand: entry.data.demand,
    num: cursor.pos() + 1,
    assign: {
      ...root,
      children: rootChildren,
    },
    solution: solution === null || entry.data.solutionAccess === 'hide'
      ? 'none'
      : entry.data.solutionAccess === 'lock'
        ? 'locked'
        : {
          type: 'root',
          children: solution.children,
        },
  };
};

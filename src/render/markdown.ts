import { SectionBlock, SectionEntry } from "../content/section.js";
import { RootContent, Text } from "hast";
import { Loader } from "filefish/loader";
import { Cursor } from "filefish/cursor";
import { Exercise, ExerciseEntry, exerciseNavItem } from "../content/exercise.js";
import { MarkdownSource } from "./markdown-source.js";
import { FsNode } from "fs-inquire";
import { buildBaseContent } from "../content/base.js";
import { CourseEntry, CourseIntro } from "../content/course.js";
import { Root as HastRoot } from 'hast';

export const processCourseInfo = async (
  file: string, cursor: Cursor<CourseEntry>, loader: Loader,
): Promise<CourseIntro> => {
  const source = await MarkdownSource.fromFile(file);
  const { content: root } = await source.process(cursor, loader);
  const items: HastRoot[] = [];

  for(const node of root.children) {
    if (node.type === 'doctype' || node.type === 'comment') {
      continue;
    }
      
    if (node.type === 'text' && node.value.trim() === '') {
      continue;
    }
    
    if (node.type === 'element' && node.tagName === 'h2') {
      items.push({
        type: 'root',
        children: [node],
      });
    } else {
      const lastItem = items.at(-1);
      if (lastItem === undefined) {
        continue;
      }
      
      lastItem.children.push(node);
    } 
  }
    
  return { items };
};

interface ProcessedSection {
  blocks: SectionBlock[],
  styles: string[],
}

export const processSection = async (
  file: string, cursor: Cursor<SectionEntry>, loader: Loader,
): Promise<ProcessedSection> => {
  const source = await MarkdownSource.fromFile(file);
  const { content: root, styles } = await source.process(cursor, loader);
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
      if (excCursor === null) {
        continue;
      }

      const exerciseNav = exerciseNavItem(excCursor as Cursor<ExerciseEntry>);
      if (lastBlock === undefined || lastBlock.type !== 'excs') {
        blocks.push({ type: 'excs', excs: [exerciseNav] });
      } else {
        lastBlock.excs.push(exerciseNav);
      }
      continue;
    }

    if (lastBlock === undefined || lastBlock.type !== 'hast') {
      blocks.push({
        type: 'hast',
        root: {
          type: 'root',
          children: [node],
        },
      });
    } else {
      lastBlock.root.children.push(node);
    } 
  }
    
  return { blocks, styles };
};

export const processExercise = async (
  fsNode: FsNode, cursor: Cursor<ExerciseEntry>, loader: Loader,
): Promise<Exercise> => {
  const filePath = fsNode.type === 'file'
    ? fsNode.path
    : fsNode.path + '/exercise.md';
  
  const entry = cursor.entry();
  const source = await MarkdownSource.fromFile(filePath);
  const { content: root, styles } = await source.process(cursor, loader);
  
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
    context: entry.data.context,
    num: cursor.pos() + 1,
    assign: {
      ...root,
      children: rootChildren,
    },
    styles,
    solution: solution === null
      ? 'none'
      : cursor.permission() === 'locked'
        ? 'locked'
        : {
          type: 'root',
          children: solution.children,
        },
  };
};

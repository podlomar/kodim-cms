import { promises as fs } from "fs";
import path from 'path';
import { unified } from "unified";
import markdown from "remark-parse";
import directive from "remark-directive";
import rehype from "remark-rehype";
import stringify from "rehype-stringify";
import { EntryCommon, InnerEntry } from '../core/entry.js';
import { EntryLoader } from '../core/loader.js';
import { Jsml } from '../jsml.js';
import { ResourceRef } from '../core/resource.js';
import { LessonSectionIndex } from "../entries";
import { ExerciseEntry, ExerciseLoader } from "./exercise.js";
import type { LessonEntry } from "./lesson.js";
import { MarkdownProcessor } from "../markdown.js";
import { buildExcTransform } from "../markdown-transforms.js";

export type LessonSectionRef = ResourceRef<{}>;

export interface LessonSectionAttrs {
  jsml: Jsml;
  prev: LessonSectionRef | null,
  next: LessonSectionRef | null,
}

export const processor = unified()
  .use(markdown)
  .use(directive)
  .use(rehype)
  .use(stringify);

export const parseSection = async (file: string): Promise<LessonSectionIndex> => {
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

  return { title, excs };
};


export class LessonSectionLoader extends EntryLoader<
  LessonSectionIndex,
  LessonEntry,
  LessonSectionEntry
> {
  protected async loadEntry(
    common: EntryCommon, index: LessonSectionIndex, position: number
  ): Promise<LessonSectionEntry> {
    const sectionEntry = new LessonSectionEntry(this.parentEntry, common, index);
    const exercises = await new ExerciseLoader(sectionEntry).loadMany(index.excs);
    sectionEntry.pushSubEntries(...exercises);
    return sectionEntry;
  }
}

export class LessonSectionEntry extends InnerEntry<
  LessonEntry, {}, LessonSectionAttrs, LessonSectionIndex, ExerciseEntry
> {
  private readonly markdownProcessor: MarkdownProcessor;

  public constructor(
    parentEntry: LessonEntry,
    common: EntryCommon,
    index: LessonSectionIndex,
  ) {
    super(parentEntry, common, index, []);
    this.markdownProcessor = new MarkdownProcessor(
      () => ''
    ).useTransform(
      'exc', buildExcTransform(this),
    );
  }

  public getPublicAttrs(): {} {
    return {};
  }

  public async fetchFullAttrs(index: LessonSectionIndex): Promise<LessonSectionAttrs> {
    const jsml = await this.markdownProcessor.process(`${this.common.fsPath}.md`);
    const next = this.getNextSibling()?.getRef() ?? null
    const prev = this.getPrevSibling()?.getRef() ?? null

    return { jsml, next, prev };
  }
}
import { existsSync, promises as fs } from "fs";
import path from 'path';
import { EntryBase, ParentEntry, RefableEntry } from '@filefish/core/dist/entry.js';
import { EntryLoader } from '@filefish/core/dist/loader.js';
import { BaseContent, ContentRef, createBaseContent } from './content.js';
import { Jsml } from './jsml.js';
import { unified } from "unified";
import markdown from "remark-parse";
import directive from "remark-directive";
import rehype from "remark-rehype";
import stringify from "rehype-stringify";
import { MarkdownProcessor } from "./markdown.js";
import { ExerciseEntry, ExerciseLoader } from "./exercise.js";
import { FailedNode, FSysNode, MaybeNode } from "@filefish/core/dist/fsysnodes";
import { buildExcTransform } from "./markdown-transforms.js";

export type LessonSectionRef = ContentRef<{}>;

export interface LessonSection extends BaseContent {
  readonly jsml: Jsml;
  readonly prev: LessonSectionRef | null;
  readonly next: LessonSectionRef | null;
}

export interface LessonSectionIndex {
  readonly title: string | null;
  readonly excs: string[];
}

export const processor = unified()
  .use(markdown)
  .use(directive)
  .use(rehype)
  .use(stringify);

export const parseSection = async (filePath: string): Promise<LessonSectionIndex> => {
  const text = await fs.readFile(filePath, "utf-8");
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

  return { title, excs };
};

export class LessonSectionEntry 
  extends ParentEntry<LessonSection, ExerciseEntry>
  implements RefableEntry<LessonSectionRef> 
{
  private markdownProcessor: MarkdownProcessor;
  
  public constructor(base: EntryBase, subEntries: ExerciseEntry[]) {
    super(base, subEntries);
    this.markdownProcessor = this.markdownProcessor = new MarkdownProcessor(() => '').useTransform(
      'exc', buildExcTransform(this),
    );
  }

  public getContentRef(): LessonSectionRef {
    return {
      status: 'ok',
      ...createBaseContent(this.base),
      publicContent: {},
    }
  }

  public async fetch(): Promise<LessonSection> {
    return {
      ...createBaseContent(this.base),
      jsml: await this.markdownProcessor.process(this.base.fsPath),
      prev: this.parent?.getPrevSibling(this.index)?.getContentRef() ?? null,
      next: this.parent?.getNextSibling(this.index)?.getContentRef() ?? null,
    }
  }
}

export class LessonSectionLoader extends EntryLoader<LessonSectionEntry> {
  protected async loadEntry(base: EntryBase): Promise<LessonSectionEntry> {
    const index = await parseSection(base.fsPath);
    const nodes = await Promise.all(
      index.excs.map(async (exc): Promise<MaybeNode> => {
        const subPath = exc.replace('>', '/');
        const filePath = path.join(base.fsPath, '..', `${subPath}.md`);

        if (existsSync(filePath)) {
          return {
            type: 'file',
            fsPath: filePath,
            contentPath: `${base.contentPath}/${exc}`,
            name: exc,
            title: null,
            extension: 'md',
            extra: null,
          }
        }

        const folderPath = path.join(base.fsPath, '..', `${subPath}`);

        try {
          const stat = await fs.stat(folderPath);

          if (stat.isDirectory()) {
            return {
              type: 'folder',
              fsPath: folderPath,
              contentPath: `${base.contentPath}/${exc}`,
              name: exc,
              title: null,
              extra: null,
            }
          }

          return {
            type: 'failed',
            problems: [`Exercise with link '${exc}' is neither a markdown file nor a directory`],
          }
        } catch(e) {
          return {
            type: 'failed',
            problems: [`Could not find exercise with link '${exc}'`],
          }
        }
      })
    );
    
    const okNodes = nodes.filter((node): node is FSysNode => node.type !== 'failed');
    const failedNodes = nodes.filter((node): node is FailedNode => node.type === 'failed');
    const problems = failedNodes.flatMap((node) => node.problems);
    const subEntries = await new ExerciseLoader().loadMany(okNodes);

    return new LessonSectionEntry({
      ...base,
      title: index.title,
      problems: [...base.problems, ...problems],
    }, subEntries);
  }
}

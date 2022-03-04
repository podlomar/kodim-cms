import { promises as fs } from "fs";
import path from 'path';
import { buildAssetPath, Resource, createBaseResource, Crumbs, ResourceRef } from "./resource.js";
import { BaseResourceProvider, NotFoundProvider, ProviderSettings } from "./provider.js";
import type { LessonProvider } from "./lesson.js";
import { unified } from "unified";
import markdown from "remark-parse";
import directive from "remark-directive";
import rehype from "remark-rehype";
import stringify from "rehype-stringify";
import { LessonSectionIndex } from "../entries";
import { InnerEntry, BaseEntry, BrokenEntry } from "./entry.js";
import { ExerciseEntry, ExerciseLoader, ExerciseProvider } from "./exercise.js";
import { findChild } from "./content-node.js";
import { MarkdownProcessor } from "../markdown.js";
import { buildExcTransform } from "../markdown-transforms.js";
import { Jsml } from "../jsml.js";
import { AccessCheck } from "./access-check.js";
import { EntryLoader } from "./loader.js";

export type LessonSectionEntry = InnerEntry<{}, ExerciseEntry>;

export type LessonSectionResource = Resource<{
  jsml: Jsml;
  prev: LessonSectionRef | null,
  next: LessonSectionRef | null,
}>;

export type LessonSectionRef = ResourceRef<{}>;

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

export class LessonSectionLoader extends EntryLoader<LessonSectionIndex, LessonSectionEntry> {
  protected async loadIndex(fsPath: string): Promise<LessonSectionIndex | 'not-found'> {
    return parseSection(`${fsPath}.md`);
  }

  protected async loadEntry(
    baseEntry: BaseEntry, index: LessonSectionIndex, position: number
  ): Promise<LessonSectionEntry> {
    const exercises = await new ExerciseLoader().loadMany(baseEntry, index.excs);

    return {
      nodeType: 'inner',
      ...baseEntry,
      props: {},
      subEntries: exercises,
    };
  }
}

export class LessonSectionProvider extends BaseResourceProvider<
  LessonProvider, LessonSectionEntry | BrokenEntry, ExerciseProvider
> {
  private markdownProcessor: MarkdownProcessor;

  constructor(
    parent: LessonProvider,
    entry: LessonSectionEntry | BrokenEntry,
    position: number,
    crumbs: Crumbs,
    accessCheck: AccessCheck,
    settings: ProviderSettings
  ) {
    super(parent, entry, position, crumbs, accessCheck, settings);
    this.markdownProcessor = new MarkdownProcessor(
      this.buildAssetPath,
    ).useTransform(
      'exc', buildExcTransform(this),
    );;
  }

  private buildAssetPath = (fileName: string) => buildAssetPath(
    fileName, path.join(this.entry.path, '..'), this.settings.baseUrl
  )

  public async fetch(): Promise<LessonSectionResource> {
    const baseResource = createBaseResource(this.entry,
      this.crumbs,
      this.settings.baseUrl
    );

    if (!this.accessCheck.accepts()) {
      return {
        ...baseResource,
        status: 'forbidden',
        content: {
          type: this.entry.nodeType === 'broken' ? 'broken' : 'public',
        }
      };
    }

    if (this.entry.nodeType === 'broken') {
      return {
        ...createBaseResource(
          this.entry,
          this.crumbs,
          this.settings.baseUrl
        ),
        status: 'ok',
        content: {
          type: 'broken',
        }
      }
    }

    const next = this.parent.getNextSection(this.position);
    const prev = this.parent.getPrevSection(this.position);
    const jsml = await this.markdownProcessor.process(`${this.entry.fsPath}.md`);

    return {
      ...createBaseResource(
        this.entry,
        this.crumbs,
        this.settings.baseUrl
      ),
      status: 'ok',
      content: {
        type: 'full',
        jsml,
        next,
        prev,
      }
    }
  }

  public find(link: string): ExerciseProvider | NotFoundProvider {
    if (!this.accessCheck.accepts()) {
      return new NotFoundProvider();
    }

    if (this.entry.nodeType === 'broken') {
      return new NotFoundProvider();
    }

    const result = findChild(this.entry.subEntries, link);
    if (result === null) {
      return new NotFoundProvider();
    }

    return new ExerciseProvider(
      this,
      result.child,
      result.pos,
      [...this.crumbs, {
        title: this.entry.title,
        path: this.entry.path
      }],
      this.accessCheck.step(result.child),
      this.settings
    );
  }

  public findProvider(link: string): ExerciseProvider | null {
    if (this.entry.nodeType === 'broken') {
      return null;
    }

    const result = findChild(this.entry.subEntries, link);
    if (result === null) {
      return null;
    }

    return new ExerciseProvider(
      this,
      result.child,
      result.pos,
      [...this.crumbs, {
        title: this.entry.title,
        path: this.entry.path
      }],
      this.accessCheck.step(result.child),
      this.settings
    );
  }

  public findRepo(repoUrl: string): null {
    return null;
  }
}
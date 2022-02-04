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
import { createSuccessEntry, BrokenEntry, SuccessEntry, EntryLocation, Entry } from "./entry.js";
import { ExerciseEntry, ExerciseProvider, loadExercise } from "./exercise.js";
import { findChild } from "./content-node.js";
import { MarkdownProcessor } from "../markdown.js";
import { buildExcTransform } from "../markdown-transforms.js";
import { Jsml } from "../jsml.js";
import { Access } from "./access.js";

export type LessonSectionRef = ResourceRef<{}>;

export type LessonSectionEntry = Entry<{
  exercises: ExerciseEntry[],
}>;

export type LessonSectionResource = Resource<{
  jsml: Jsml;
  prev: LessonSectionRef | null,
  next: LessonSectionRef | null,
}>;

export const processor = unified()
  .use(markdown)
  .use(directive)
  .use(rehype)
  .use(stringify);

interface SectionIndex {
  title: string;
  excs: string[];
}

export const parseSection = async (file: string): Promise<SectionIndex> => {
  const text = await fs.readFile(file, "utf-8");
  const tree = processor.parse(text);
  
  let title = "";
  let excs: string[] = [];

  for (const node of tree.children) {
    if (node.type === "heading" && node.depth === 2) {
      const content = node.children[0];
      if (content.type === "text") {
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

export const loadLessonSection = async (
  parentLocation: EntryLocation,
  folderName: string,
): Promise<LessonSectionEntry> => {
  const index = await parseSection(
    `${parentLocation.fsPath}/${folderName}.md`
  );

  const baseEntry = createSuccessEntry(parentLocation, folderName, index.title)

  let excsCount = 0; 
  const exercises = await Promise.all(
    index.excs.map((link: string, idx: number) => loadExercise(
      baseEntry.location, link, excsCount + idx
    ))
  );

  return {
    ...baseEntry,
    exercises,
  };
}

export class LessonSectionProvider extends BaseResourceProvider<
  LessonProvider, LessonSectionEntry, ExerciseProvider
> {
  private markdownProcessor: MarkdownProcessor;

  constructor(
    parent: LessonProvider, 
    entry: LessonSectionEntry, 
    position: number, 
    crumbs: Crumbs,
    access: Access,
    settings: ProviderSettings
  ) {
    super(parent, entry, position, crumbs, access, settings);
    this.markdownProcessor = new MarkdownProcessor(
      this.buildAssetPath,
    ).useTransform(
      'exc', buildExcTransform(this),
    );;
  }
  
  private buildAssetPath = (fileName: string) => buildAssetPath(
    fileName, path.join(this.entry.location.path, '..'), this.settings.baseUrl
  )

  public async fetch(): Promise<LessonSectionResource> {
    const baseResource = createBaseResource(this.entry,
      this.crumbs,
      this.settings.baseUrl
    );
    
    if (!this.access.accepts()) {
      return {
        ...baseResource,
        status: 'forbidden',
        content: {
          type: this.entry.type === 'broken' ? 'broken' : 'public',
        }
      };
    }
    
    if (this.entry.type === 'broken') {
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
    const jsml = await this.markdownProcessor.process(`${this.entry.location.fsPath}.md`);
    
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
    if (!this.access.accepts()) {
      return new NotFoundProvider();
    }
    
    if (this.entry.type === 'broken') {
      return new NotFoundProvider();
    }

    const result = findChild(this.entry.exercises, link);
    if (result === null) {
      return new NotFoundProvider();
    }
    
    return new ExerciseProvider(
      this, 
      result.child,
      result.pos, 
      [...this.crumbs, { 
        title: this.entry.title, 
        path: this.entry.location.path
      }],
      this.access.step(result.child.link),
      this.settings
    );
  }

  public findProvider(link: string): ExerciseProvider | null {
    if (this.entry.type === 'broken') {
      return null;
    }

    const result = findChild(this.entry.exercises, link);
    if (result === null) {
      return null;
    }

    return new ExerciseProvider(
      this, 
      result.child,
      result.pos, 
      [...this.crumbs, { 
        title: this.entry.title, 
        path: this.entry.location.path
      }],
      this.access.step(result.child.link),
      this.settings
    );
  }

  public findRepo(repoUrl: string): null {
    return null;
  }
}
import { promises as fs } from "fs";
import { buildAssetPath, Resource, createFailedResource, createSuccessResource, Crumbs, ResourceRef } from "./resource.js";
import { BaseResourceProvider, NotFoundProvider, ProviderSettings } from "./provider.js";
import type { LessonProvider } from "./lesson.js";
import { unified } from "unified";
import markdown from "remark-parse";
import directive from "remark-directive";
import rehype from "remark-rehype";
import stringify from "rehype-stringify";
import { createSuccessEntry, FailedEntry, SuccessEntry } from "./entry.js";
import { Exercise, ExerciseProvider, loadExercise } from "./exercise.js";
import { findChild } from "./content-node.js";
import { MarkdownProcessor } from "../markdown.js";
import { buildExcTransform } from "../markdown-transforms.js";
import { Jsml } from "../jsml.js";

export type LessonSectionRef = ResourceRef;

export interface SuccessLessonSection extends SuccessEntry {
  exercises: Exercise[],
};

export type LessonSection = SuccessLessonSection | FailedEntry;

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
  parentEntry: SuccessEntry,
  folderName: string,
): Promise<LessonSection> => {
  const index = await parseSection(
    `${parentEntry.fsPath}/${folderName}.md`
  );

  const baseEntry = createSuccessEntry(parentEntry, folderName, index.title)

  let excsCount = 0; 
  const exercises = await Promise.all(
    index.excs.map((link: string, idx: number) => loadExercise(
      baseEntry, link, excsCount + idx
    ))
  );

  return {
    ...baseEntry,
    exercises,
  };
}

export class LessonSectionProvider extends BaseResourceProvider<
  LessonProvider, LessonSection, ExerciseProvider
> {
  private markdownProcessor: MarkdownProcessor;

  constructor(
    parent: LessonProvider, 
    entry: LessonSection, 
    position: number, 
    crumbs: Crumbs,
    settings: ProviderSettings
  ) {
    super(parent, entry, position, crumbs, settings);
    this.markdownProcessor = new MarkdownProcessor(
      this.buildAssetPath,
    ).useTransform(
      'exc', buildExcTransform(this),
    );;
  }
  
  private buildAssetPath = (fileName: string) => buildAssetPath(
    fileName, this.entry, this.settings.baseUrl
  )

  public async fetch(): Promise<LessonSectionResource> {
    if (this.entry.type === 'failed') {
      return createFailedResource(this.entry, this.settings.baseUrl);
    }
    
    const next = this.parent.getNextSection(this.position);
    const prev = this.parent.getPrevSection(this.position);
    const jsml = await this.markdownProcessor.process(`${this.entry.fsPath}.md`);
    
    return {
      ...createSuccessResource(this.entry, this.crumbs, this.settings.baseUrl),
      jsml,
      next,
      prev,
    }
  }

  public find(link: string): ExerciseProvider | NotFoundProvider {
    if (this.entry.type === 'failed') {
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
        path: this.entry.path
      }],
      this.settings
    );
  }

  public findRepo(repoUrl: string): null {
    return null;
  }
}
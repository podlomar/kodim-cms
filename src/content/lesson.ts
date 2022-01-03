import { LessonIndex } from "../entries";
import { createFailedEntry, createSuccessEntry, FailedEntry, SuccessEntry } from "./entry.js";
import { ResourceRef, createSuccessResource, createFailedResource, createSuccessRef, createResourceRef, createFailedRef, Resource } from './resource.js';
import { findChild, readIndexFile } from "./content-node.js";
import { BaseResourceProvider, NotFoundProvider } from "./provider.js";
import type { ChapterProvider } from "./chapter.js";
import { LessonSection, LessonSectionProvider, LessonSectionRef, LessonSectionResource, loadLessonSection } from "./lesson-section.js";

export type LessonRef = ResourceRef<{
  num: number, 
  lead: string,
}>;

export interface SuccessLesson extends SuccessEntry { 
  num: number,
  lead: string,
  sections: LessonSection[],
}
export type Lesson = SuccessLesson | FailedEntry;

export type LessonResource = Resource<{
  num: number,
  lead: string,
  fullSection?: LessonSectionResource,
  sections: LessonSectionRef[],
  next: LessonRef | null,
  prev: LessonRef | null,
}>;

export const loadLesson = async (
  parentEntry: SuccessEntry,
  folderName: string,
  position: number,
): Promise<Lesson> => {
  const index = await readIndexFile<LessonIndex>(
    `${parentEntry.fsPath}/${folderName}`
  );
  
  if (index === 'not-found') {
    return createFailedEntry(parentEntry, folderName);
  }

  const baseEntry = createSuccessEntry(parentEntry, folderName, index.title);

  const sections = await Promise.all(
    index.sections.map((sectionLink: string) => loadLessonSection(
      baseEntry, sectionLink,
    ))
  );

  return {
    ...baseEntry,
    num: position + 1,
    lead: index.lead,
    sections,
  }
}

export const createLessonRef = (lesson: Lesson, baseUrl: string): LessonRef => {
  if (lesson.type === 'failed') {
    return createFailedRef(lesson, baseUrl);
  }

  return {
    ...createSuccessRef(lesson, baseUrl),
    num: lesson.num,
    lead: lesson.lead,
  }
}

export class LessonProvider extends BaseResourceProvider<
  ChapterProvider, Lesson, LessonSectionProvider
> {
  public getFirstSectionLink(): string | null {
    if (this.entry.type === 'failed') {
      return null;
    }

    if (this.entry.sections.length === 0) {
      return null;
    }

    return this.entry.sections[0].link;
  }

  public async fetch(expandSection?: 'first' | { link: string }): Promise<LessonResource> {
    if (this.entry.type === 'failed') {
      return createFailedResource(this.entry, this.settings.baseUrl);
    }
    
    const sections = this.entry.sections.map(
      (section) => createResourceRef(section, this.settings.baseUrl)
    );

    const next = this.parent.getNextLesson(this.position);
    const prev = this.parent.getPrevLesson(this.position);
    
    const result: LessonResource = {
      ...createSuccessResource(this.entry, this.crumbs, this.settings.baseUrl),
      num: this.entry.num,
      lead: this.entry.lead,
      sections,
      next,
      prev,
    };

    if (expandSection === undefined) {
      return result;
    }

    const fullSectionLink = expandSection === 'first' 
      ? this.getFirstSectionLink()
      : expandSection.link;

    if (fullSectionLink === null) {
      return result;
    }
    
    const fullSectionProvider = this.find(fullSectionLink);
    if (fullSectionProvider === null) {
      return result;
    }

    const fullSection = await fullSectionProvider.fetch();
    if (fullSection.type === 'not-found') {
      return result;
    }
    
    return { ...result, fullSection }; 
  }

  public find(link: string): LessonSectionProvider | NotFoundProvider {
    if (this.entry.type === 'failed') {
      return new NotFoundProvider;
    }

    const result = findChild(this.entry.sections, link);
    if (result === null) {
      return new NotFoundProvider;
    }
    
    return new LessonSectionProvider(
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

  public getNextSection(pos: number): LessonSectionRef | null {
    if (this.entry.type === 'failed') {
      return null;
    }

    const section = this.entry.sections[pos + 1];
    if (section === undefined) {
      return null;
    }

    return createResourceRef(section, this.settings.baseUrl);
  }

  public getPrevSection(pos: number): LessonSectionRef | null {
    if (this.entry.type === 'failed') {
      return null;
    }

    const section = this.entry.sections[pos - 1];
    if (section === undefined) {
      return null;
    }

    return createResourceRef(section, this.settings.baseUrl);
  }
}
import { LessonIndex } from "../entries";
import { createBrokenEntry, createSuccessEntry, BrokenEntry, SuccessEntry, EntryLocation } from "./entry.js";
import { ResourceRef, createOkResource, createBrokenResource, createOkRef, createResourceRef, createBrokenRef, Resource, createForbiddenRef } from './resource.js';
import { findChild, readIndexFile } from "./content-node.js";
import { BaseResourceProvider, NoAccessProvider, NotFoundProvider } from "./provider.js";
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
export type Lesson = SuccessLesson | BrokenEntry;

export type LessonResource = Resource<{
  num: number,
  lead: string,
  fullSection?: LessonSectionResource,
  sections: LessonSectionRef[],
  next: LessonRef | null,
  prev: LessonRef | null,
}>;

export const loadLesson = async (
  parentLocation: EntryLocation,
  folderName: string,
  position: number,
): Promise<Lesson> => {
  const index = await readIndexFile<LessonIndex>(
    `${parentLocation.fsPath}/${folderName}`
  );
  
  if (index === 'not-found') {
    return createBrokenEntry(parentLocation, folderName);
  }

  const baseEntry = createSuccessEntry(parentLocation, folderName, index.title);

  const sections = await Promise.all(
    index.sections.map((sectionLink: string) => loadLessonSection(
      baseEntry.location, sectionLink,
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
  if (lesson.type === 'broken') {
    return createBrokenRef(lesson, baseUrl);
  }

  return {
    ...createOkRef(lesson, baseUrl),
    num: lesson.num,
    lead: lesson.lead,
  }
}

export class LessonProvider extends BaseResourceProvider<
  ChapterProvider, Lesson, LessonSectionProvider
> {
  public getFirstSectionLink(): string | null {
    if (this.entry.type === 'broken') {
      return null;
    }

    if (this.entry.sections.length === 0) {
      return null;
    }

    return this.entry.sections[0].link;
  }

  public async fetch(expandSection?: 'first' | { link: string }): Promise<LessonResource> {
    if (this.entry.type === 'broken') {
      return createBrokenResource(this.entry, this.crumbs, this.settings.baseUrl);
    }
    
    const sections = this.entry.sections.map(
      (section) => {
        const sectionAccess = this.access.step(section.link);
        if (sectionAccess.accepts()) {
          return createResourceRef(section, this.settings.baseUrl);
        }

        return createForbiddenRef(section, this.settings.baseUrl);
      }
    );

    const next = this.parent.getNextLesson(this.position);
    const prev = this.parent.getPrevLesson(this.position);
    
    const result: LessonResource = {
      ...createOkResource(this.entry, this.crumbs, this.settings.baseUrl),
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
    if (fullSection.status === 'not-found') {
      return result;
    }
    
    return { ...result, fullSection }; 
  }

  public find(link: string): LessonSectionProvider | NotFoundProvider | NoAccessProvider {
    if (this.entry.type === 'broken') {
      return new NotFoundProvider;
    }

    const result = findChild(this.entry.sections, link);
    if (result === null) {
      return new NotFoundProvider;
    }
    
    const childAccess = this.access.step(result.child.link);
    if (!childAccess.accepts()) {
      return new NoAccessProvider(result.child, this.settings);
    }

    return new LessonSectionProvider(
      this, 
      result.child, 
      result.pos, 
      [...this.crumbs, { 
        title: this.entry.title, 
        path: this.entry.location.path
      }],
      childAccess,
      this.settings
    );
  }

  public getNextSection(pos: number): LessonSectionRef | null {
    if (this.entry.type === 'broken') {
      return null;
    }

    const section = this.entry.sections[pos + 1];
    if (section === undefined) {
      return null;
    }

    const childAccess = this.access.step(section.link);
    if (!childAccess.accepts()) {
      return createForbiddenRef(section, this.settings.baseUrl);
    }

    return createResourceRef(section, this.settings.baseUrl);
  }

  public getPrevSection(pos: number): LessonSectionRef | null {
    if (this.entry.type === 'broken') {
      return null;
    }

    const section = this.entry.sections[pos - 1];
    if (section === undefined) {
      return null;
    }

    const childAccess = this.access.step(section.link);
    if (!childAccess.accepts()) {
      return createForbiddenRef(section, this.settings.baseUrl);
    }

    return createResourceRef(section, this.settings.baseUrl);
  }

  public findRepo(repoUrl: string): null {
    return null;
  }
}
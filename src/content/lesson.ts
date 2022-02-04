import { LessonIndex } from "../entries";
import { createBrokenEntry, createSuccessEntry, Entry, EntryLocation } from "./entry.js";
import { ResourceRef, createBaseResource, createBaseRef, Resource } from './resource.js';
import { findChild, readIndexFile } from "./content-node.js";
import { BaseResourceProvider, NotFoundProvider } from "./provider.js";
import type { ChapterProvider } from "./chapter.js";
import { LessonSectionEntry, LessonSectionProvider, LessonSectionRef, LessonSectionResource, loadLessonSection } from "./lesson-section.js";

export type LessonRef = ResourceRef<{
  num: number, 
  lead: string,
}>;

export type LessonEntry = Entry<{ 
  num: number,
  lead: string,
  sections: LessonSectionEntry[],
}>;

export type LessonResource = Resource<{
  num: number,
  lead: string,
  fullSection?: LessonSectionResource,
  sections: LessonSectionRef[],
  next: LessonRef | null,
  prev: LessonRef | null,
}, {
  num: number,
  lead: string,
}>;

export const loadLesson = async (
  parentLocation: EntryLocation,
  folderName: string,
  position: number,
): Promise<LessonEntry> => {
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

export const createLessonRef = (
  lesson: LessonEntry,
  accessAllowed: boolean,
  baseUrl: string
): LessonRef => ({
  ...createBaseRef(
    accessAllowed ? 'ok' : 'forbidden', 
    lesson,
    baseUrl
  ),
  publicContent: lesson.type === 'broken'
    ? 'broken'
    : {
      num: lesson.num,
      lead: lesson.lead,
    }
});

export class LessonProvider extends BaseResourceProvider<
  ChapterProvider, LessonEntry, LessonSectionProvider
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
    const baseResource = createBaseResource(this.entry,
      this.crumbs,
      this.settings.baseUrl
    );
    
    if (!this.access.accepts()) {
      return {
        ...baseResource,
        status: 'forbidden',
        content: this.entry.type === 'broken' 
          ? {
            type:  'broken',
          } : {
            type: 'public',
            num: this.entry.num,
            lead: this.entry.lead,
          }
      };
    }
    
    if (this.entry.type === 'broken') {
      return {
        ...baseResource,
        status: 'ok',
        content: {
          type: 'broken',
        }
      };
    }
    
    const sections = this.entry.sections.map(
      (section) => {
        const sectionAccess = this.access.step(section.link);
        return {
          ...createBaseRef(
            sectionAccess.accepts() ? 'ok' : 'forbidden',
            section,
            this.settings.baseUrl,
          ),
          publicContent: section.type === 'broken' ? 'broken' : {},
        }
      }
    );

    const next = this.parent.getNextLesson(this.position);
    const prev = this.parent.getPrevLesson(this.position);
    
    const content = {
      type: 'full',
      num: this.entry.num,
      lead: this.entry.lead,
      sections,
      next,
      prev,
    };

    if (expandSection === undefined) {
      return <LessonResource>{
        ...baseResource,
        status: 'ok',
        content,
      };
    }

    const fullSectionLink = expandSection === 'first' 
      ? this.getFirstSectionLink()
      : expandSection.link;

    if (fullSectionLink === null) {
      return <LessonResource>{
        ...baseResource,
        status: 'ok',
        content,
      };
    }
    
    const fullSectionProvider = this.find(fullSectionLink);
    if (fullSectionProvider === null) {
      return <LessonResource>{
        ...baseResource,
        status: 'ok',
        content,
      };
    }

    const fullSection = await fullSectionProvider.fetch();
    if (fullSection.status === 'not-found') {
      return <LessonResource>{
        ...baseResource,
        status: 'ok',
        content,
      };
    }

    return <LessonResource>{
      ...baseResource,
      status: 'ok',
      content: {
        ...content,
        fullSection,
      }
    };
  }

  public find(link: string): LessonSectionProvider | NotFoundProvider {
    if (!this.access.accepts()) {
      return new NotFoundProvider();
    }
    
    if (this.entry.type === 'broken') {
      return new NotFoundProvider();
    }

    const result = findChild(this.entry.sections, link);
    if (result === null) {
      return new NotFoundProvider();
    }

    return new LessonSectionProvider(
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

  public getNextSection(pos: number): LessonSectionRef | null {
    if (this.entry.type === 'broken') {
      return null;
    }

    const section = this.entry.sections[pos + 1];
    if (section === undefined) {
      return null;
    }
    
    const childAccess = this.access.step(section.link);
    return {
      ...createBaseRef(
        childAccess.accepts() ? 'ok' : 'forbidden',
        section,
        this.settings.baseUrl,
      ),
      publicContent: section.type === 'broken' ? 'broken' : {},
    }
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
    return {
      ...createBaseRef(
        childAccess.accepts() ? 'ok' : 'forbidden',
        section,
        this.settings.baseUrl,
      ),
      publicContent: section.type === 'broken' ? 'broken' : {},
    }
  }

  public findRepo(repoUrl: string): null {
    return null;
  }
}
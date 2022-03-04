import { LessonIndex } from "../entries";
import { createBaseEntry, InnerEntry, BaseEntry, createBrokenEntry, BrokenEntry } from "./entry.js";
import { ResourceRef, createBaseResource, createBaseRef, Resource } from './resource.js';
import { findChild } from "./content-node.js";
import { BaseResourceProvider, NotFoundProvider } from "./provider.js";
import type { ChapterProvider } from "./chapter.js";
import { LessonSectionEntry, LessonSectionLoader, LessonSectionProvider, LessonSectionRef } from "./lesson-section.js";
import { EntryLoader } from "./loader";

export type LessonEntry = InnerEntry<{
  num: number,
  lead: string,
}, LessonSectionEntry>;

export type LessonResource = Resource<{
  num: number,
  lead: string,
  sections: LessonSectionRef[],
  next: LessonRef | null,
  prev: LessonRef | null,
}, {
  num: number,
  lead: string,
}>;

export type LessonRef = ResourceRef<{
  num: number,
  lead: string,
}>;

export class LessonLoader extends EntryLoader<LessonIndex, LessonEntry> {
  protected async loadEntry(
    baseEntry: BaseEntry, index: LessonIndex, position: number
  ): Promise<LessonEntry> {
    const sections = await new LessonSectionLoader().loadMany(baseEntry, index.sections);
    return {
      nodeType: 'inner',
      ...baseEntry,
      props: {
        num: position + 1,
        lead: index.lead,
      },
      subEntries: sections,
    };
  };
}

export const createLessonRef = (
  lesson: LessonEntry | BrokenEntry,
  accessAllowed: boolean,
  baseUrl: string
): LessonRef => ({
  ...createBaseRef(
    accessAllowed ? 'ok' : 'forbidden',
    lesson,
    baseUrl
  ),
  publicContent: lesson.nodeType === 'broken'
    ? 'broken'
    : {
      num: lesson.props.num,
      lead: lesson.props.lead,
    }
});

export class LessonProvider extends BaseResourceProvider<
  ChapterProvider, LessonEntry | BrokenEntry, LessonSectionProvider
> {
  public getFirstSectionLink(): string | null {
    if (this.entry.nodeType === 'broken') {
      return null;
    }

    if (this.entry.subEntries.length === 0) {
      return null;
    }

    return this.entry.subEntries[0].link;
  }

  public async fetch(): Promise<LessonResource> {
    const baseResource = createBaseResource(this.entry,
      this.crumbs,
      this.settings.baseUrl
    );

    if (!this.accessCheck.accepts()) {
      return {
        ...baseResource,
        status: 'forbidden',
        content: this.entry.nodeType === 'broken'
          ? {
            type: 'broken',
          } : {
            type: 'public',
            num: this.entry.props.num,
            lead: this.entry.props.lead,
          }
      };
    }

    if (this.entry.nodeType === 'broken') {
      return {
        ...baseResource,
        status: 'ok',
        content: {
          type: 'broken',
        }
      };
    }

    const sections = this.entry.subEntries.map(
      (section) => {
        const sectionAccess = this.accessCheck.step(section);
        return {
          ...createBaseRef(
            sectionAccess.accepts() ? 'ok' : 'forbidden',
            section,
            this.settings.baseUrl,
          ),
          publicContent: section.nodeType === 'broken' ? 'broken' : {},
        }
      }
    );

    const next = this.parent.getNextLesson(this.position);
    const prev = this.parent.getPrevLesson(this.position);

    return {
      ...baseResource,
      status: 'ok',
      content: {
        type: 'full',
        num: this.entry.props.num,
        lead: this.entry.props.lead,
        sections,
        next,
        prev,
      }
    };
  }

  public find(link: string): LessonSectionProvider | NotFoundProvider {
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

    return new LessonSectionProvider(
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

  public getNextSection(pos: number): LessonSectionRef | null {
    if (this.entry.nodeType === 'broken') {
      return null;
    }

    const section = this.entry.subEntries[pos + 1];
    if (section === undefined) {
      return null;
    }

    const childAccess = this.accessCheck.step(section);
    return {
      ...createBaseRef(
        childAccess.accepts() ? 'ok' : 'forbidden',
        section,
        this.settings.baseUrl,
      ),
      publicContent: section.nodeType === 'broken' ? 'broken' : {},
    }
  }

  public getPrevSection(pos: number): LessonSectionRef | null {
    if (this.entry.nodeType === 'broken') {
      return null;
    }

    const section = this.entry.subEntries[pos - 1];
    if (section === undefined) {
      return null;
    }

    const childAccess = this.accessCheck.step(section);
    return {
      ...createBaseRef(
        childAccess.accepts() ? 'ok' : 'forbidden',
        section,
        this.settings.baseUrl,
      ),
      publicContent: section.nodeType === 'broken' ? 'broken' : {},
    }
  }

  public findRepo(repoUrl: string): null {
    return null;
  }
}
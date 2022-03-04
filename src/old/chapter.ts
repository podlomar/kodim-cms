import { ChapterIndex } from "../entries";
import { BaseEntry, BrokenEntry, createBaseEntry, createBrokenEntry, InnerEntry } from "./entry.js";
import { Resource, createBaseResource, createBaseRef, ResourceRef } from './resource.js';
import { findChild } from "./content-node.js";
import type { CourseProvider } from "./course";
import { createLessonRef, LessonEntry, LessonProvider, LessonRef, LessonLoader } from "./lesson.js";
import { BaseResourceProvider, NotFoundProvider } from "./provider.js";
import { EntryLoader } from "./loader.js";

export type ChapterEntry = InnerEntry<{
  lead: string,
}, LessonEntry>;

export type ChapterResource = Resource<{
  lead: string,
  lessons: LessonRef[],
}, {
  lead: string,
}>;

export type ChapterRef = ResourceRef<{
  lead: string,
}>;

export class ChapterLoader extends EntryLoader<ChapterIndex, ChapterEntry> {
  protected async loadEntry(
    baseEntry: BaseEntry, index: ChapterIndex, position: number
  ): Promise<ChapterEntry> {
    const lessons = await new LessonLoader().loadMany(baseEntry, index.lessons);
    return {
      nodeType: 'inner',
      ...baseEntry,
      props: {
        lead: index.lead,
      },
      subEntries: lessons,
    }
  };
}

export const createChapterRef = (
  chapter: ChapterEntry | BrokenEntry,
  accessAllowed: boolean,
  baseUrl: string
): ChapterRef => ({
  ...createBaseRef(
    accessAllowed ? 'ok' : 'forbidden',
    chapter,
    baseUrl
  ),
  publicContent: chapter.nodeType === 'broken'
    ? 'broken'
    : {
      lead: chapter.props.lead,
    }
});

export class ChapterProvider extends BaseResourceProvider<
  CourseProvider, ChapterEntry | BrokenEntry, LessonProvider
> {
  public async fetch(): Promise<ChapterResource> {
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

    const lessons = this.entry.subEntries.map(
      (lesson) => {
        const accessCheck = this.accessCheck.step(lesson);
        return createLessonRef(lesson, accessCheck.accepts(), this.settings.baseUrl);
      }
    );

    return {
      ...baseResource,
      status: 'ok',
      content: {
        type: 'full',
        lead: this.entry.props.lead,
        lessons,
      }
    }
  }

  public find(link: string): LessonProvider | NotFoundProvider {
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

    return new LessonProvider(
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

  public getNextLesson(pos: number): LessonRef | null {
    if (this.entry.nodeType === 'broken') {
      return null;
    }

    const lesson = this.entry.subEntries[pos + 1];
    if (lesson === undefined) {
      return null;
    }

    const childAccess = this.accessCheck.step(lesson);
    return createLessonRef(lesson, childAccess.accepts(), this.settings.baseUrl);
  }

  public getPrevLesson(pos: number): LessonRef | null {
    if (this.entry.nodeType === 'broken') {
      return null;
    }

    const lesson = this.entry.subEntries[pos - 1];
    if (lesson === undefined) {
      return null;
    }

    const childAccess = this.accessCheck.step(lesson);
    return createLessonRef(lesson, childAccess.accepts(), this.settings.baseUrl);
  }

  public findRepo(repoUrl: string): null {
    return null;
  }
}
import { ChapterIndex } from "../entries";
import { createBrokenEntry, createSuccessEntry, EntryLocation, Entry } from "./entry.js";
import { Resource, createBaseResource, createBaseRef, ResourceRef } from './resource.js';
import { findChild, readIndexFile } from "./content-node.js";
import type { CourseProvider } from "./course";
import { createLessonRef, LessonEntry, LessonProvider, LessonRef, loadLesson } from "./lesson.js";
import { BaseResourceProvider, NotFoundProvider } from "./provider.js";

export type ChapterEntry = Entry<{
  lead: string,
  lessons: LessonEntry[],
}>;

export type ChapterResource = Resource<{
  lead: string,
  lessons: LessonRef[],
}, {
  lead: string,
}>;

export type ChapterRef = ResourceRef<{
  lead: string,
}>;

export const loadChapter = async (
  parentLocation: EntryLocation,
  folderName: string,
): Promise<ChapterEntry> => {
  const index = await readIndexFile<ChapterIndex>(
    `${parentLocation.fsPath}/${folderName}`
  );
  
  if (index === 'not-found') {
    return createBrokenEntry(parentLocation, folderName);
  }
  
  const baseEntry = createSuccessEntry(parentLocation, folderName, index.title);
  const lessons = await Promise.all(
    index.lessons.map((lessonLink: string, idx: number) => loadLesson(
      baseEntry.location, lessonLink, idx,
    ))
  );

  return {
    ...baseEntry,
    lead: index.lead,
    lessons,
  }
}

export const createChapterRef = (
  chapter: ChapterEntry,
  accessAllowed: boolean,
  baseUrl: string
): ChapterRef => ({
  ...createBaseRef(
    accessAllowed ? 'ok' : 'forbidden', 
    chapter,
    baseUrl
  ),
  publicContent: chapter.type === 'broken'
    ? 'broken'
    : {
      lead: chapter.lead,
    }
});

export class ChapterProvider extends BaseResourceProvider<
  CourseProvider, ChapterEntry, LessonProvider
> {
  public async fetch(): Promise<ChapterResource> {
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

    const lessons = this.entry.lessons.map(
      (lesson) => {
        const lessonAccess = this.access.step(lesson.link);
        return createLessonRef(lesson, lessonAccess.accepts(), this.settings.baseUrl);
      }
    );

    return {
      ...baseResource,
      status: 'ok',
      content: {
        type: 'full',
        lead: this.entry.lead,
        lessons,  
      }
    }
  }

  public find(link: string): LessonProvider | NotFoundProvider {
    if (!this.access.accepts()) {
      return new NotFoundProvider();
    }
    
    if (this.entry.type === 'broken') {
      return new NotFoundProvider();
    }

    const result = findChild(this.entry.lessons, link);
    if (result === null) {
      return new NotFoundProvider();
    }

    return new LessonProvider(
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

  public getNextLesson(pos: number): LessonRef | null {
    if (this.entry.type === 'broken') {
      return null;
    }

    const lesson = this.entry.lessons[pos + 1];
    if (lesson === undefined) {
      return null;
    }

    const childAccess = this.access.step(lesson.link);
    return createLessonRef(lesson, childAccess.accepts(), this.settings.baseUrl);
  }

  public getPrevLesson(pos: number): LessonRef | null {
    if (this.entry.type === 'broken') {
      return null;
    }

    const lesson = this.entry.lessons[pos - 1];
    if (lesson === undefined) {
      return null;
    }

    const childAccess = this.access.step(lesson.link);
    return createLessonRef(lesson, childAccess.accepts(), this.settings.baseUrl);
  }

  public findRepo(repoUrl: string): null {
    return null;
  }
}
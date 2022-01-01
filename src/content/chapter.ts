import { ChapterIndex } from "../entries";
import { createFailedEntry, createSuccessEntry, FailedEntry, SuccessEntry } from "./entry.js";
import { createFailedResource, createResourceRef, createSuccessRef, createSuccessResource, FailedResource, ResourceRef, SuccessResource } from './resource.js';
import { findChild, readIndexFile } from "./content-node.js";
import type { CourseProvider } from "./course";
import { createLessonRef, Lesson, LessonProvider, LessonRef, loadLesson } from "./lesson.js";
import { BaseResourceProvider } from "./provider.js";

export interface SuccessChapter extends SuccessEntry {
  lead: string,
  lessons: Lesson[],
}

export type Chapter = SuccessChapter | FailedEntry;

export interface SuccessChapterResource extends SuccessResource {
  lead: string,
  lessons: LessonRef[],
}

export type ChapterResource = SuccessChapterResource | FailedResource;

export const loadChapter = async (
  parentEntry: SuccessEntry,
  folderName: string,
): Promise<Chapter> => {
  const index = await readIndexFile<ChapterIndex>(
    `${parentEntry.fsPath}/${folderName}`
  );
  
  if (index === 'not-found') {
    return createFailedEntry(parentEntry, folderName);
  }
  
  const baseEntry = createSuccessEntry(parentEntry, folderName, index.title);
  const lessons = await Promise.all(
    index.lessons.map((lessonLink: string, idx: number) => loadLesson(
      baseEntry, lessonLink, idx,
    ))
  );

  return {
    ...baseEntry,
    lead: index.lead,
    lessons,
  }
}

export class ChapterProvider extends BaseResourceProvider<
  CourseProvider, Chapter, LessonProvider
> {
  public async fetch(): Promise<ChapterResource> {
    if (this.entry.type === 'failed') {
      return createFailedResource(this.entry, this.settings.baseUrl);
    }
    
    return {
      ...createSuccessResource(this.entry, this.crumbs, this.settings.baseUrl),
      lead: this.entry.lead,
      lessons: this.entry.lessons.map(
        (lesson) => createLessonRef(lesson, this.settings.baseUrl)
      ),
    }
  }

  public find(link: string): LessonProvider | null {
    if (this.entry.type === 'failed') {
      return null;
    }

    const result = findChild(this.entry.lessons, link);
    if (result === null) {
      return null;
    }
    
    return new LessonProvider(
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

  public getNextLesson(pos: number): LessonRef | null {
    if (this.entry.type === 'failed') {
      return null;
    }

    const lesson = this.entry.lessons[pos + 1];
    if (lesson === undefined) {
      return null;
    }

    return createLessonRef(lesson, this.settings.baseUrl);
  }

  public getPrevLesson(pos: number): LessonRef | null {
    if (this.entry.type === 'failed') {
      return null;
    }

    const lesson = this.entry.lessons[pos - 1];
    if (lesson === undefined) {
      return null;
    }

    return createLessonRef(lesson, this.settings.baseUrl);
  }
}
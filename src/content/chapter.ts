import { ChapterIndex } from "../entries";
import { createBrokenEntry, createSuccessEntry, BrokenEntry, SuccessEntry, EntryLocation } from "./entry.js";
import { Resource, createBrokenResource, createOkResource, createForbiddenRef } from './resource.js';
import { findChild, readIndexFile } from "./content-node.js";
import type { CourseProvider } from "./course";
import { createLessonRef, Lesson, LessonProvider, LessonRef, loadLesson } from "./lesson.js";
import { BaseResourceProvider, NoAccessProvider, NotFoundProvider } from "./provider.js";

export interface SuccessChapter extends SuccessEntry {
  lead: string,
  lessons: Lesson[],
}

export type Chapter = SuccessChapter | BrokenEntry;

export type ChapterResource = Resource<{
  lead: string,
  lessons: LessonRef[],
}>;

export const loadChapter = async (
  parentLocation: EntryLocation,
  folderName: string,
): Promise<Chapter> => {
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

export class ChapterProvider extends BaseResourceProvider<
  CourseProvider, Chapter, LessonProvider
> {
  public async fetch(): Promise<ChapterResource> {
    if (this.entry.type === 'broken') {
      return createBrokenResource(this.entry, this.crumbs, this.settings.baseUrl);
    }

    return {
      ...createOkResource(this.entry, this.crumbs, this.settings.baseUrl),
      lead: this.entry.lead,
      lessons: this.entry.lessons.map(
        (lesson) => {
          const lessonAccess = this.access.step(lesson.link);
          if (lessonAccess.accepts()) {
            return createLessonRef(lesson, this.settings.baseUrl);
          }
          
          return createForbiddenRef(lesson.title);
        }
      ),
    }
  }

  public find(link: string): LessonProvider | NotFoundProvider | NoAccessProvider {
    if (this.entry.type === 'broken') {
      return new NotFoundProvider();
    }

    const result = findChild(this.entry.lessons, link);
    if (result === null) {
      return new NotFoundProvider();
    }
    
    const childAccess = this.access.step(result.child.link);
    if (!childAccess.accepts()) {
      return new NoAccessProvider(result.child, [], this.settings);
    }

    return new LessonProvider(
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

  public getNextLesson(pos: number): LessonRef | null {
    if (this.entry.type === 'broken') {
      return null;
    }

    const lesson = this.entry.lessons[pos + 1];
    if (lesson === undefined) {
      return null;
    }

    const childAccess = this.access.step(lesson.link);
    if (!childAccess.accepts()) {
      return createForbiddenRef(lesson.title);
    }

    return createLessonRef(lesson, this.settings.baseUrl);
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
    if (!childAccess.accepts()) {
      return createForbiddenRef(lesson.title);
    }

    return createLessonRef(lesson, this.settings.baseUrl);
  }

  public findRepo(repoUrl: string): null {
    return null;
  }
}
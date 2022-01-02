import { CourseIndex } from "../entries";
import { FailedEntry, SuccessEntry, createSuccessEntry, createFailedEntry } from "./entry.js";
import { createSuccessResource, ResourceRef, createFailedResource, buildAssetPath, createFailedRef, createSuccessRef, ContentResource } from './resource.js';
import { Chapter, ChapterProvider, ChapterResource, loadChapter } from "./chapter.js";
import type { CoursesRootProvider } from "./content";
import { findChild, readIndexFile } from "./content-node.js";
import { BaseResourceProvider, NotFoundProvider } from "./provider.js";
import { createLessonRef } from "./lesson.js";

export type CourseRef = ResourceRef<{
  image: string,
  lead: string,
}>;

export interface SuccessCourse extends SuccessEntry {
  image: string,
  lead: string,
  chapters: Chapter[],
}

export type Course = SuccessCourse | FailedEntry;

export type CourseResource = ContentResource<{
  image: string,
  lead: string,
  chapters: ChapterResource[],
}>;

export const loadCourse = async (
  parentEntry: SuccessEntry,
  folderName: string,
): Promise<Course> => {
  const index = await readIndexFile<CourseIndex>(
    `${parentEntry.fsPath}/${folderName}`
  );
  
  if (index === 'not-found') {
    return createFailedEntry(parentEntry, folderName);
  }

  const baseEntry = createSuccessEntry(parentEntry, folderName, index.title);

  const chapters = await Promise.all(
    index.chapters === undefined ? [] : 
    index.chapters.map((chapterLink: string) => loadChapter(
      baseEntry, chapterLink
    ))
  );

  return {
    ...baseEntry,
    image: index.image,
    lead: index.lead,
    chapters,
  }
}

export const createCourseRef = (course: Course, baseUrl: string): CourseRef => {
  if (course.type === 'failed') {
    return createFailedRef(course, baseUrl);
  }

  return {
    ...createSuccessRef(course, baseUrl),
    image: buildAssetPath(course.image, course, baseUrl),
    lead: course.lead,
  }
}

export class CourseProvider extends BaseResourceProvider<
  CoursesRootProvider, Course, ChapterProvider
> {
  public async fetch(): Promise<CourseResource> {
    if (this.entry.type === 'failed') {
      return createFailedResource(this.entry, this.settings.baseUrl);
    }
    
    return {
      ...createSuccessResource(this.entry, this.crumbs, this.settings.baseUrl),
      image: buildAssetPath(this.entry.image, this.entry, this.settings.baseUrl),
      lead: this.entry.lead,
      chapters: this.entry.chapters.map((chapter) => {
        if (chapter.type === 'failed') {
          return createFailedResource(chapter, this.settings.baseUrl);
        }

        return {
          ...createSuccessResource(chapter, this.crumbs, this.settings.baseUrl),
          lead: chapter.lead,
          lessons: chapter.lessons.map(
            (lesson) => createLessonRef(lesson, this.settings.baseUrl)
          )
        }
      })
    }
  }

  public find(link: string): ChapterProvider | NotFoundProvider {
    if (this.entry.type === 'failed') {
      return new NotFoundProvider();
    }

    const result = findChild(this.entry.chapters, link);
    if (result === null) {
      return new NotFoundProvider();
    }
    
    return new ChapterProvider(
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
}
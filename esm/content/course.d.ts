import { FailedEntry, SuccessEntry } from "./entry.js";
import { FailedResource, ResourceRef, SuccessResource } from './resource.js';
import { Chapter, ChapterProvider, ChapterResource } from "./chapter.js";
import type { CoursesRootProvider } from "./content";
import { BaseResourceProvider } from "./provider.js";
export declare type CourseRef = ResourceRef<{
    image: string;
    lead: string;
}>;
export interface SuccessCourse extends SuccessEntry {
    image: string;
    lead: string;
    chapters: Chapter[];
}
export declare type Course = SuccessCourse | FailedEntry;
export interface SuccessCourseResource extends SuccessResource {
    image: string;
    lead: string;
    chapters: ChapterResource[];
}
export declare type CourseResource = SuccessCourseResource | FailedResource;
export declare const loadCourse: (parentEntry: SuccessEntry, folderName: string) => Promise<Course>;
export declare const createCourseRef: (course: Course, baseUrl: string) => CourseRef;
export declare class CourseProvider extends BaseResourceProvider<CoursesRootProvider, Course, ChapterProvider> {
    fetch(): Promise<CourseResource>;
    find(link: string): ChapterProvider | null;
}

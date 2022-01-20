import { FailedEntry, SuccessEntry } from "./entry.js";
import { ResourceRef, Resource } from './resource.js';
import { Chapter, ChapterProvider, ChapterResource } from "./chapter.js";
import type { CoursesRootProvider } from "./content";
import { BaseResourceProvider, NotFoundProvider } from "./provider.js";
export declare type CourseRef = ResourceRef<{
    image: string;
    lead: string;
}>;
export interface SuccessCourse extends SuccessEntry {
    image: string;
    lead: string;
    repo: {
        url: string;
        branch: string;
        secret: string;
    } | null;
    chapters: Chapter[];
}
export declare type Course = SuccessCourse | FailedEntry;
export declare type CourseResource = Resource<{
    image: string;
    lead: string;
    chapters: ChapterResource[];
}>;
export declare const loadCourse: (parentEntry: SuccessEntry, folderName: string) => Promise<Course>;
export declare const createCourseRef: (course: Course, baseUrl: string) => CourseRef;
export declare class CourseProvider extends BaseResourceProvider<CoursesRootProvider, Course, ChapterProvider> {
    reload(): Promise<void>;
    fetch(): Promise<CourseResource>;
    find(link: string): ChapterProvider | NotFoundProvider;
    findRepo(repoUrl: string): null;
}

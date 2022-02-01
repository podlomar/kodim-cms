import { BrokenEntry, SuccessEntry, EntryLocation } from "./entry.js";
import { ResourceRef, Resource } from './resource.js';
import { Chapter, ChapterProvider, ChapterResource } from "./chapter.js";
import type { CoursesRootProvider } from "./content";
import { BaseResourceProvider, NoAccessProvider, NotFoundProvider } from "./provider.js";
export declare type CourseRef = ResourceRef<{
    image: string;
    lead: string;
}, {}, {
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
export declare type Course = SuccessCourse | BrokenEntry;
export declare type CourseResource = Resource<{
    image: string;
    lead: string;
    chapters: ChapterResource[];
}>;
export declare const loadCourse: (parentLocation: EntryLocation, folderName: string) => Promise<Course>;
export declare const createCourseRef: (course: Course, accessAllowed: boolean, baseUrl: string) => CourseRef;
export declare class CourseProvider extends BaseResourceProvider<CoursesRootProvider, Course, ChapterProvider> {
    reload(): Promise<void>;
    fetch(): Promise<CourseResource>;
    find(link: string): ChapterProvider | NotFoundProvider | NoAccessProvider;
    findRepo(repoUrl: string): null;
}

import { Entry, EntryLocation } from "./entry.js";
import { ResourceRef, Resource } from './resource.js';
import { ChapterEntry, ChapterProvider, ChapterResource } from "./chapter.js";
import type { CoursesRootProvider } from "./content";
import { BaseResourceProvider, NotFoundProvider } from "./provider.js";
export declare type CourseEntry = Entry<{
    image: string;
    lead: string;
    repo: {
        url: string;
        branch: string;
        secret: string;
    } | null;
    chapters: ChapterEntry[];
}>;
export declare type CourseResource = Resource<{
    image: string;
    lead: string;
    chapters: ChapterResource[];
}, {
    image: string;
    lead: string;
}>;
export declare type CourseRef = ResourceRef<{
    image: string;
    lead: string;
}>;
export declare const loadCourse: (parentLocation: EntryLocation, folderName: string) => Promise<CourseEntry>;
export declare const createCourseRef: (courseEntry: CourseEntry, accessAllowed: boolean, baseUrl: string) => CourseRef;
export declare class CourseProvider extends BaseResourceProvider<CoursesRootProvider, CourseEntry, ChapterProvider> {
    reload(): Promise<void>;
    fetch(): Promise<CourseResource>;
    find(link: string): ChapterProvider | NotFoundProvider;
    findRepo(repoUrl: string): null;
}

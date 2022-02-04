import { Resource } from "./resource.js";
import { CourseEntry, CourseProvider, CourseRef } from "./course.js";
import { Entry } from "./entry.js";
import { BaseResourceProvider, NotFoundProvider, ResourceProvider } from "./provider.js";
export interface Division<T extends CourseEntry | CourseRef = CourseEntry> {
    readonly title: string;
    readonly lead: string;
    readonly courses: T[];
}
export declare type CoursesRootEntry = Entry<{
    divisions: Division[];
}>;
export declare type CoursesRootResource = Resource<{
    divisions: Division<CourseRef>[];
}>;
export declare const loadCoursesRoot: (contentFolder: string, coursesFolder: string) => Promise<CoursesRootEntry>;
export declare class CoursesRootProvider extends BaseResourceProvider<null, CoursesRootEntry, CourseProvider> {
    fetch(): Promise<CoursesRootResource>;
    find(link: string): CourseProvider | NotFoundProvider;
    findRepo(repoUrl: string): ResourceProvider | null;
}

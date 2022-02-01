import { Resource } from "./resource.js";
import { Course, CourseProvider, CourseRef } from "./course.js";
import { BrokenEntry, SuccessEntry } from "./entry.js";
import { BaseResourceProvider, NoAccessProvider, NotFoundProvider, ResourceProvider } from "./provider.js";
export interface Division<T extends Course | CourseRef = Course> {
    readonly title: string;
    readonly lead: string;
    readonly courses: T[];
}
export interface SuccessCoursesRoot extends SuccessEntry {
    divisions: Division[];
}
export declare type CoursesRoot = SuccessCoursesRoot | BrokenEntry;
export declare type CoursesRootResource = Resource<{
    divisions: Division<CourseRef>[];
}>;
export declare const loadCoursesRoot: (contentFolder: string, coursesFolder: string) => Promise<CoursesRoot>;
export declare class CoursesRootProvider extends BaseResourceProvider<null, CoursesRoot, CourseProvider> {
    fetch(): Promise<CoursesRootResource>;
    find(link: string): CourseProvider | NotFoundProvider | NoAccessProvider;
    findRepo(repoUrl: string): ResourceProvider | null;
}

import { ContentResource } from "./resource.js";
import { Course, CourseProvider, CourseRef } from "./course.js";
import { FailedEntry, SuccessEntry } from "./entry.js";
import { BaseResourceProvider, NotFoundProvider } from "./provider.js";
export interface Division<T extends Course | CourseRef = Course> {
    readonly title: string;
    readonly lead: string;
    readonly courses: T[];
}
export interface SuccessCoursesRoot extends SuccessEntry {
    divisions: Division[];
}
export declare type CoursesRoot = SuccessCoursesRoot | FailedEntry;
export declare type CoursesRootResource = ContentResource<{
    divisions: Division<CourseRef>[];
}>;
export declare const loadCoursesRoot: (contentFolder: string, coursesFolder: string) => Promise<CoursesRoot>;
export declare class CoursesRootProvider extends BaseResourceProvider<null, CoursesRoot, CourseProvider> {
    fetch(): Promise<CoursesRootResource>;
    find(link: string): CourseProvider | NotFoundProvider;
}

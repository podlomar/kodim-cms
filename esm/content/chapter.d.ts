import { FailedEntry, SuccessEntry } from "./entry.js";
import { FailedResource, SuccessResource } from './resource.js';
import type { CourseProvider } from "./course";
import { Lesson, LessonProvider, LessonRef } from "./lesson.js";
import { BaseResourceProvider } from "./provider.js";
export interface SuccessChapter extends SuccessEntry {
    lead: string;
    lessons: Lesson[];
}
export declare type Chapter = SuccessChapter | FailedEntry;
export interface SuccessChapterResource extends SuccessResource {
    lead: string;
    lessons: LessonRef[];
}
export declare type ChapterResource = SuccessChapterResource | FailedResource;
export declare const loadChapter: (parentEntry: SuccessEntry, folderName: string) => Promise<Chapter>;
export declare class ChapterProvider extends BaseResourceProvider<CourseProvider, Chapter, LessonProvider> {
    fetch(): Promise<ChapterResource>;
    find(link: string): LessonProvider | null;
    getNextLesson(pos: number): LessonRef | null;
    getPrevLesson(pos: number): LessonRef | null;
}

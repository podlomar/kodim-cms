import { FailedEntry, SuccessEntry } from "./entry.js";
import { ContentResource } from './resource.js';
import type { CourseProvider } from "./course";
import { Lesson, LessonProvider, LessonRef } from "./lesson.js";
import { BaseResourceProvider, NotFoundProvider } from "./provider.js";
export interface SuccessChapter extends SuccessEntry {
    lead: string;
    lessons: Lesson[];
}
export declare type Chapter = SuccessChapter | FailedEntry;
export declare type ChapterResource = ContentResource<{
    lead: string;
    lessons: LessonRef[];
}>;
export declare const loadChapter: (parentEntry: SuccessEntry, folderName: string) => Promise<Chapter>;
export declare class ChapterProvider extends BaseResourceProvider<CourseProvider, Chapter, LessonProvider> {
    fetch(): Promise<ChapterResource>;
    find(link: string): LessonProvider | NotFoundProvider;
    getNextLesson(pos: number): LessonRef | null;
    getPrevLesson(pos: number): LessonRef | null;
}

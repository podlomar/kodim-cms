import { BrokenEntry, SuccessEntry, EntryLocation } from "./entry.js";
import { Resource } from './resource.js';
import type { CourseProvider } from "./course";
import { Lesson, LessonProvider, LessonRef } from "./lesson.js";
import { BaseResourceProvider, NoAccessProvider, NotFoundProvider } from "./provider.js";
export interface SuccessChapter extends SuccessEntry {
    lead: string;
    lessons: Lesson[];
}
export declare type Chapter = SuccessChapter | BrokenEntry;
export declare type ChapterResource = Resource<{
    lead: string;
    lessons: LessonRef[];
}>;
export declare const loadChapter: (parentLocation: EntryLocation, folderName: string) => Promise<Chapter>;
export declare class ChapterProvider extends BaseResourceProvider<CourseProvider, Chapter, LessonProvider> {
    fetch(): Promise<ChapterResource>;
    find(link: string): LessonProvider | NotFoundProvider | NoAccessProvider;
    getNextLesson(pos: number): LessonRef | null;
    getPrevLesson(pos: number): LessonRef | null;
    findRepo(repoUrl: string): null;
}

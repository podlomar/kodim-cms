import { EntryLocation, Entry } from "./entry.js";
import { Resource } from './resource.js';
import type { CourseProvider } from "./course";
import { LessonEntry, LessonProvider, LessonRef } from "./lesson.js";
import { BaseResourceProvider, NotFoundProvider } from "./provider.js";
export declare type ChapterEntry = Entry<{
    lead: string;
    lessons: LessonEntry[];
}>;
export declare type ChapterResource = Resource<{
    lead: string;
    lessons: LessonRef[];
}, {
    lead: string;
}>;
export declare const loadChapter: (parentLocation: EntryLocation, folderName: string) => Promise<ChapterEntry>;
export declare class ChapterProvider extends BaseResourceProvider<CourseProvider, ChapterEntry, LessonProvider> {
    fetch(): Promise<ChapterResource>;
    find(link: string): LessonProvider | NotFoundProvider;
    getNextLesson(pos: number): LessonRef | null;
    getPrevLesson(pos: number): LessonRef | null;
    findRepo(repoUrl: string): null;
}

import { FailedEntry, SuccessEntry } from "./entry.js";
import { SuccessResource, FailedResource, ResourceRef } from './resource.js';
import { BaseResourceProvider } from "./provider.js";
import type { ChapterProvider } from "./chapter.js";
import { LessonSection, LessonSectionProvider, LessonSectionRef, LessonSectionResource } from "./lesson-section.js";
export declare type LessonRef = ResourceRef<{
    num: number;
    lead: string;
}>;
export interface SuccessLesson extends SuccessEntry {
    num: number;
    lead: string;
    sections: LessonSection[];
}
export declare type Lesson = SuccessLesson | FailedEntry;
export interface SuccessLessonResource extends SuccessResource {
    num: number;
    lead: string;
    fullSection?: LessonSectionResource;
    sections: LessonSectionRef[];
    next: LessonRef | null;
    prev: LessonRef | null;
}
export declare type LessonResource = SuccessLessonResource | FailedResource;
export declare const loadLesson: (parentEntry: SuccessEntry, folderName: string, position: number) => Promise<Lesson>;
export declare const createLessonRef: (lesson: Lesson, baseUrl: string) => LessonRef;
export declare class LessonProvider extends BaseResourceProvider<ChapterProvider, Lesson, LessonSectionProvider> {
    getFirstSectionLink(): string | null;
    fetch(expandSection?: 'first' | {
        link: string;
    }): Promise<LessonResource>;
    find(link: string): LessonSectionProvider | null;
    getNextSection(pos: number): LessonSectionRef | null;
    getPrevSection(pos: number): LessonSectionRef | null;
}

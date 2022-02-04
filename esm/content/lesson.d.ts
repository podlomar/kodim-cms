import { Entry, EntryLocation } from "./entry.js";
import { ResourceRef, Resource } from './resource.js';
import { BaseResourceProvider, NotFoundProvider } from "./provider.js";
import type { ChapterProvider } from "./chapter.js";
import { LessonSectionEntry, LessonSectionProvider, LessonSectionRef, LessonSectionResource } from "./lesson-section.js";
export declare type LessonRef = ResourceRef<{
    num: number;
    lead: string;
}>;
export declare type LessonEntry = Entry<{
    num: number;
    lead: string;
    sections: LessonSectionEntry[];
}>;
export declare type LessonResource = Resource<{
    num: number;
    lead: string;
    fullSection?: LessonSectionResource;
    sections: LessonSectionRef[];
    next: LessonRef | null;
    prev: LessonRef | null;
}, {
    num: number;
    lead: string;
}>;
export declare const loadLesson: (parentLocation: EntryLocation, folderName: string, position: number) => Promise<LessonEntry>;
export declare const createLessonRef: (lesson: LessonEntry, accessAllowed: boolean, baseUrl: string) => LessonRef;
export declare class LessonProvider extends BaseResourceProvider<ChapterProvider, LessonEntry, LessonSectionProvider> {
    getFirstSectionLink(): string | null;
    fetch(expandSection?: 'first' | {
        link: string;
    }): Promise<LessonResource>;
    find(link: string): LessonSectionProvider | NotFoundProvider;
    getNextSection(pos: number): LessonSectionRef | null;
    getPrevSection(pos: number): LessonSectionRef | null;
    findRepo(repoUrl: string): null;
}

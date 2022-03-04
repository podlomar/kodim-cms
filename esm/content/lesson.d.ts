import { LessonIndex } from '../entries.js';
import type { ChapterEntry } from './chapter.js';
import { EntryCommon, InnerEntry } from '../core/entry.js';
import { EntryLoader } from '../core/loader.js';
import { LessonSectionEntry, LessonSectionRef } from './lesson-section.js';
import { ResourceRef } from '../core/resource.js';
export interface PublicLessonAttrs {
    readonly num: number;
    readonly lead: string;
}
export interface FullLessonAttrs extends PublicLessonAttrs {
    sections: LessonSectionRef[];
    next: LessonRef | null;
    prev: LessonRef | null;
}
export declare type LessonRef = ResourceRef<PublicLessonAttrs>;
export declare class LessonLoader extends EntryLoader<LessonIndex, ChapterEntry, LessonEntry> {
    protected loadEntry(common: EntryCommon, index: LessonIndex, position: number): Promise<LessonEntry>;
}
export declare class LessonEntry extends InnerEntry<ChapterEntry, PublicLessonAttrs, FullLessonAttrs, LessonIndex, LessonSectionEntry> {
    getPublicAttrs(index: LessonIndex): PublicLessonAttrs;
    fetchFullAttrs(index: LessonIndex): Promise<FullLessonAttrs>;
}

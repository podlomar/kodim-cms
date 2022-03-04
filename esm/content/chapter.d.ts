import type { CourseEntry } from './course.js';
import { ChapterIndex } from '../entries.js';
import { EntryCommon, InnerEntry } from '../core/entry.js';
import { EntryLoader } from '../core/loader.js';
import { ResourceRef } from '../core/resource.js';
import { LessonEntry } from './lesson.js';
export interface PublicChapterAttrs {
    readonly lead: string;
}
export interface FullChapterAttrs extends PublicChapterAttrs {
    lessons: string[];
}
export declare type ChapterRef = ResourceRef<PublicChapterAttrs>;
export declare class ChapterLoader extends EntryLoader<ChapterIndex, CourseEntry, ChapterEntry> {
    protected loadEntry(common: EntryCommon, index: ChapterIndex, position: number): Promise<ChapterEntry>;
}
export declare class ChapterEntry extends InnerEntry<CourseEntry, PublicChapterAttrs, FullChapterAttrs, ChapterIndex, LessonEntry> {
    getPublicAttrs(index: ChapterIndex): PublicChapterAttrs;
    fetchFullAttrs(index: ChapterIndex): Promise<FullChapterAttrs>;
}

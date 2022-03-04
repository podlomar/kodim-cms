import { CourseIndex } from '../entries.js';
import { ChapterEntry, ChapterRef } from './chapter.js';
import { EntryCommon, InnerEntry } from '../core/entry.js';
import { EntryLoader } from '../core/loader.js';
import { ResourceRef } from '../core/resource.js';
import type { RootEntry } from './root.js';
export interface PublicCourseAttrs {
    readonly image: string;
    readonly lead: string;
}
export interface FullCourseAttrs extends PublicCourseAttrs {
    chapters: ChapterRef[];
}
export declare type CourseRef = ResourceRef<PublicCourseAttrs>;
export declare class CourseLoader extends EntryLoader<CourseIndex, RootEntry, CourseEntry> {
    protected loadEntry(common: EntryCommon, index: CourseIndex | null, position: number): Promise<CourseEntry>;
}
export declare class CourseEntry extends InnerEntry<RootEntry, PublicCourseAttrs, FullCourseAttrs, CourseIndex, ChapterEntry> {
    getPublicAttrs(index: CourseIndex): PublicCourseAttrs;
    fetchFullAttrs(index: CourseIndex): Promise<FullCourseAttrs>;
}

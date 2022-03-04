import { EntryCommon, InnerEntry } from '../core/entry.js';
import { EntryLoader } from '../core/loader.js';
import { Jsml } from '../jsml.js';
import { ResourceRef } from '../core/resource.js';
import { LessonSectionIndex } from "../entries";
import { ExerciseEntry } from "./exercise.js";
import type { LessonEntry } from "./lesson.js";
export declare type LessonSectionRef = ResourceRef<{}>;
export interface LessonSectionAttrs {
    jsml: Jsml;
    prev: LessonSectionRef | null;
    next: LessonSectionRef | null;
}
export declare const processor: import("unified").Processor<import("mdast").Root, import("mdast").Root, import("hast").Root, string>;
export declare const parseSection: (file: string) => Promise<LessonSectionIndex>;
export declare class LessonSectionLoader extends EntryLoader<LessonSectionIndex, LessonEntry, LessonSectionEntry> {
    protected loadEntry(common: EntryCommon, index: LessonSectionIndex, position: number): Promise<LessonSectionEntry>;
}
export declare class LessonSectionEntry extends InnerEntry<LessonEntry, {}, LessonSectionAttrs, LessonSectionIndex, ExerciseEntry> {
    private readonly markdownProcessor;
    constructor(parentEntry: LessonEntry, common: EntryCommon, index: LessonSectionIndex);
    getPublicAttrs(): {};
    fetchFullAttrs(index: LessonSectionIndex): Promise<LessonSectionAttrs>;
}

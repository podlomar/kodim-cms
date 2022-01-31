import { Resource, Crumbs, ResourceRef } from "./resource.js";
import { BaseResourceProvider, NoAccessProvider, NotFoundProvider, ProviderSettings } from "./provider.js";
import type { LessonProvider } from "./lesson.js";
import { FailedEntry, SuccessEntry } from "./entry.js";
import { Exercise, ExerciseProvider } from "./exercise.js";
import { Jsml } from "../jsml.js";
import { Access } from "./access.js";
export declare type LessonSectionRef = ResourceRef;
export interface SuccessLessonSection extends SuccessEntry {
    exercises: Exercise[];
}
export declare type LessonSection = SuccessLessonSection | FailedEntry;
export declare type LessonSectionResource = Resource<{
    jsml: Jsml;
    prev: LessonSectionRef | null;
    next: LessonSectionRef | null;
}>;
export declare const processor: import("unified").Processor<import("mdast").Root, import("mdast").Root, import("hast").Root, string>;
interface SectionIndex {
    title: string;
    excs: string[];
}
export declare const parseSection: (file: string) => Promise<SectionIndex>;
export declare const loadLessonSection: (parentEntry: SuccessEntry, folderName: string) => Promise<LessonSection>;
export declare class LessonSectionProvider extends BaseResourceProvider<LessonProvider, LessonSection, ExerciseProvider> {
    private markdownProcessor;
    constructor(parent: LessonProvider, entry: LessonSection, position: number, crumbs: Crumbs, access: Access, settings: ProviderSettings);
    private buildAssetPath;
    fetch(): Promise<LessonSectionResource>;
    find(link: string): ExerciseProvider | NotFoundProvider | NoAccessProvider;
    findProvider(link: string): ExerciseProvider | null;
    findRepo(repoUrl: string): null;
}
export {};

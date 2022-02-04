import { Resource, Crumbs, ResourceRef } from "./resource.js";
import { BaseResourceProvider, NotFoundProvider, ProviderSettings } from "./provider.js";
import type { LessonProvider } from "./lesson.js";
import { EntryLocation, Entry } from "./entry.js";
import { ExerciseEntry, ExerciseProvider } from "./exercise.js";
import { Jsml } from "../jsml.js";
import { Access } from "./access.js";
export declare type LessonSectionRef = ResourceRef<{}>;
export declare type LessonSectionEntry = Entry<{
    exercises: ExerciseEntry[];
}>;
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
export declare const loadLessonSection: (parentLocation: EntryLocation, folderName: string) => Promise<LessonSectionEntry>;
export declare class LessonSectionProvider extends BaseResourceProvider<LessonProvider, LessonSectionEntry, ExerciseProvider> {
    private markdownProcessor;
    constructor(parent: LessonProvider, entry: LessonSectionEntry, position: number, crumbs: Crumbs, access: Access, settings: ProviderSettings);
    private buildAssetPath;
    fetch(): Promise<LessonSectionResource>;
    find(link: string): ExerciseProvider | NotFoundProvider;
    findProvider(link: string): ExerciseProvider | null;
    findRepo(repoUrl: string): null;
}
export {};

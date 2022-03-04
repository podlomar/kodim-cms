import { Resource, Crumbs, ResourceRef } from "./resource.js";
import { BaseResourceProvider, NotFoundProvider, ProviderSettings } from "./provider.js";
import type { LessonProvider } from "./lesson.js";
import { LessonSectionIndex } from "../entries";
import { InnerEntry, BaseEntry } from "./entry.js";
import { ExerciseEntry, ExerciseProvider } from "./exercise.js";
import { Jsml } from "../jsml.js";
import { AccessCheck } from "./access-check.js";
export declare type LessonSectionEntry = InnerEntry<{}, ExerciseEntry>;
export declare type LessonSectionResource = Resource<{
    jsml: Jsml;
    prev: LessonSectionRef | null;
    next: LessonSectionRef | null;
}>;
export declare type LessonSectionRef = ResourceRef<{}>;
export declare const processor: import("unified").Processor<import("mdast").Root, import("mdast").Root, import("hast").Root, string>;
export declare const parseSection: (file: string) => Promise<LessonSectionIndex | 'not-found'>;
export declare const loadLessonSection: (parentBase: BaseEntry, folderName: string) => Promise<LessonSectionEntry>;
export declare class LessonSectionProvider extends BaseResourceProvider<LessonProvider, LessonSectionEntry, ExerciseProvider> {
    private markdownProcessor;
    constructor(parent: LessonProvider, entry: LessonSectionEntry, position: number, crumbs: Crumbs, accessCheck: AccessCheck, settings: ProviderSettings);
    private buildAssetPath;
    fetch(): Promise<LessonSectionResource>;
    find(link: string): ExerciseProvider | NotFoundProvider;
    findProvider(link: string): ExerciseProvider | null;
    findRepo(repoUrl: string): null;
}

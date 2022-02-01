import { Jsml, JsmlElement } from "../jsml.js";
import { BrokenEntry, SuccessEntry, EntryLocation } from "./entry.js";
import { BaseResourceProvider, NotFoundProvider, ProviderSettings } from "./provider.js";
import { Access } from "./access.js";
import { LessonSectionProvider } from "./lesson-section.js";
import { Crumbs, Resource } from "./resource.js";
export interface SuccessExercise extends SuccessEntry {
    demand: 1 | 2 | 3 | 4 | 5;
    num: number;
}
export declare type Exercise = SuccessExercise | BrokenEntry;
export declare type ExerciseResource = Resource<{
    demand: 1 | 2 | 3 | 4 | 5;
    num: number;
    assignJsml: Jsml;
    solutionJsml: Jsml;
}>;
export interface ExerciseAssign {
    demand: 1 | 2 | 3 | 4 | 5;
    num: number;
    jsml: Jsml;
}
export declare const loadExercise: (parentLocation: EntryLocation, link: string, pos: number) => Promise<Exercise>;
export declare class ExerciseProvider extends BaseResourceProvider<LessonSectionProvider, Exercise, never> {
    private markdownProcessor;
    constructor(parent: LessonSectionProvider, entry: Exercise, position: number, crumbs: Crumbs, access: Access, settings: ProviderSettings);
    find(link: string): NotFoundProvider;
    private buildAssetPath;
    fetch(): Promise<ExerciseResource>;
    fetchAssign(): Promise<JsmlElement>;
    findRepo(repoUrl: string): null;
}

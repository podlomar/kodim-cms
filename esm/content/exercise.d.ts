import { Jsml, JsmlElement } from "../jsml.js";
import { FailedEntry, SuccessEntry } from "./entry.js";
import { BaseResourceProvider, ProviderSettings } from "./provider.js";
import { LessonSectionProvider } from "./lesson-section.js";
import { Crumbs } from "./resource.js";
export interface SuccessExercise extends SuccessEntry {
    demand: 1 | 2 | 3 | 4 | 5;
    num: number;
}
export declare type Exercise = SuccessExercise | FailedEntry;
export interface ExerciseAssign {
    demand: 1 | 2 | 3 | 4 | 5;
    num: number;
    jsml: Jsml;
}
export declare const loadExercise: (parentEntry: SuccessEntry, link: string, pos: number) => Promise<Exercise>;
export declare class ExerciseProvider extends BaseResourceProvider<LessonSectionProvider, Exercise, never> {
    private markdownProcessor;
    constructor(parent: LessonSectionProvider, entry: Exercise, position: number, crumbs: Crumbs, settings: ProviderSettings);
    fetch(): Promise<null>;
    find(link: string): null;
    private buildAssetPath;
    fetchEntry(): Promise<Exercise>;
    fetchAssign(): Promise<JsmlElement>;
}

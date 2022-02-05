import { Jsml, JsmlElement } from "../jsml.js";
import { EntryLocation, LeafEntry } from "./entry.js";
import { BaseResourceProvider, NotFoundProvider, ProviderSettings } from "./provider.js";
import { Access } from "./access.js";
import { LessonSectionProvider } from "./lesson-section.js";
import { Crumbs, Resource } from "./resource.js";
export declare type ExerciseEntry = LeafEntry<{
    demand: 1 | 2 | 3 | 4 | 5;
    num: number;
}>;
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
export declare const loadExercise: (parentLocation: EntryLocation, link: string, pos: number) => Promise<ExerciseEntry>;
export declare class ExerciseProvider extends BaseResourceProvider<LessonSectionProvider, ExerciseEntry, never> {
    private markdownProcessor;
    constructor(parent: LessonSectionProvider, entry: ExerciseEntry, position: number, crumbs: Crumbs, access: Access, settings: ProviderSettings);
    find(link: string): NotFoundProvider;
    private buildAssetPath;
    fetch(): Promise<ExerciseResource>;
    fetchAssign(): Promise<JsmlElement>;
    findRepo(repoUrl: string): null;
}

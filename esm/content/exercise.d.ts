import { Jsml, JsmlElement } from "../jsml.js";
import { BaseEntry, LeafEntry } from "./entry.js";
import { BaseResourceProvider, NotFoundProvider, ProviderSettings } from "./provider.js";
import { AccessCheck } from "./access-check.js";
import { LessonSectionProvider } from "./lesson-section.js";
import { Crumbs, Resource } from "./resource.js";
export declare type ExerciseEntry = LeafEntry<{
    demand: 1 | 2 | 3 | 4 | 5;
    num: number;
    offerSolution: boolean;
}>;
export declare type ExerciseResource = Resource<{
    demand: 1 | 2 | 3 | 4 | 5;
    num: number;
    offerSolution: boolean;
    assignJsml: Jsml;
    solutionJsml: Jsml;
}>;
export interface ExerciseAssign {
    demand: 1 | 2 | 3 | 4 | 5;
    num: number;
    offerSolution: boolean;
    jsml: Jsml;
}
export declare const loadExercise: (parentBase: BaseEntry, link: string, pos: number) => Promise<ExerciseEntry>;
export declare class ExerciseProvider extends BaseResourceProvider<LessonSectionProvider, ExerciseEntry, never> {
    private markdownProcessor;
    constructor(parent: LessonSectionProvider, entry: ExerciseEntry, position: number, crumbs: Crumbs, accessCheck: AccessCheck, settings: ProviderSettings);
    find(link: string): NotFoundProvider;
    private buildAssetPath;
    fetch(): Promise<ExerciseResource>;
    fetchAssign(): Promise<JsmlElement>;
    findRepo(repoUrl: string): null;
}

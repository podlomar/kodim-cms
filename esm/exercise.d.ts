import { EntryBase, LeafEntry } from '@filefish/core/dist/entry.js';
import { EntryLoader } from '@filefish/core/dist/loader.js';
import { BaseContent, Crumbs } from './content.js';
import { Jsml, JsmlElement } from './jsml.js';
import { MarkdownProcessor } from './markdown.js';
export declare type Demand = 1 | 2 | 3 | 4 | 5;
export interface Exercise extends BaseContent {
    readonly crumbs: Crumbs;
    readonly demand: Demand;
    readonly num: number;
    readonly assignJsml: Jsml;
    readonly solutionJsml: Jsml;
}
export interface ExerciseFrontMatter {
    readonly title: string;
    readonly demand: Demand;
    readonly draftSolution?: boolean;
}
export declare class ExerciseEntry extends LeafEntry<Exercise> {
    private frontMatter;
    private markdownProcessor;
    constructor(base: EntryBase, frontMatter: ExerciseFrontMatter, mardownProcessor: MarkdownProcessor);
    private loadParts;
    fetchAssign(): Promise<JsmlElement>;
    fetch(): Promise<Exercise>;
}
export declare class ExerciseLoader extends EntryLoader<ExerciseEntry> {
    private markdownProcessor;
    constructor();
    private loadFrontMatter;
    protected loadEntry(base: EntryBase): Promise<ExerciseEntry>;
}

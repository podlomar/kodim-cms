import { ExerciseFrontMatter } from '../entries.js';
import { EntryCommon, LeafEntry } from '../core/entry.js';
import { EntryLoader } from '../core/loader.js';
import { Jsml, JsmlElement } from '../jsml.js';
import type { LessonSectionEntry } from './lesson-section.js';
export interface PublicExerciseAttrs {
    readonly demand: 1 | 2 | 3 | 4 | 5;
    readonly num: number;
    readonly showSolution: boolean;
}
export interface FullExerciseAttrs extends PublicExerciseAttrs {
    assignJsml: Jsml;
    solutionJsml: Jsml;
}
export interface ExerciseAssign extends PublicExerciseAttrs {
    readonly jsml: Jsml;
}
export declare class ExerciseEntry extends LeafEntry<LessonSectionEntry, PublicExerciseAttrs, FullExerciseAttrs, ExerciseFrontMatter> {
    getPublicAttrs(frontMatter: ExerciseFrontMatter): PublicExerciseAttrs;
    fetchFullAttrs(frontMatter: ExerciseFrontMatter): Promise<FullExerciseAttrs>;
    fetchAssign(): Promise<JsmlElement>;
}
export declare class ExerciseLoader extends EntryLoader<ExerciseFrontMatter, LessonSectionEntry, ExerciseEntry> {
    protected buildFsPath(fileName: string): string;
    protected loadIndex(fsPath: string): Promise<ExerciseFrontMatter | 'not-found'>;
    protected loadEntry(common: EntryCommon, frontMatter: ExerciseFrontMatter, position: number): Promise<ExerciseEntry>;
}

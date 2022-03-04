import { RootIndex } from '../entries.js';
import { EntryCommon, InnerEntry } from '../core/entry.js';
import { EntryLoader } from '../core/loader.js';
import { CourseEntry, CourseRef } from './course.js';
export interface Division {
    readonly title: string;
    readonly lead: string;
    readonly courses: CourseRef[];
}
export declare type FullRootAttrs = {
    divisions: Division[];
};
export declare class RootLoader extends EntryLoader<RootIndex, null, RootEntry> {
    private contentFolder;
    constructor(contentFolder: string);
    protected buildFsPath(fileName: string): string;
    protected loadEntry(common: EntryCommon, index: RootIndex, position: number): Promise<RootEntry>;
}
export declare class RootEntry extends InnerEntry<null, {}, FullRootAttrs, RootIndex, CourseEntry> {
    getPublicAttrs(): {};
    fetchFullAttrs(index: RootIndex): Promise<FullRootAttrs>;
}

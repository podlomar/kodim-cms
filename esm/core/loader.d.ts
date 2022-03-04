import { EntryIndex } from "../entries";
import { EntryCommon, Entry, InnerEntry } from "./entry.js";
export declare const readYamlFile: <T>(filePath: string) => Promise<T | "not-found">;
export declare abstract class EntryLoader<IndexType extends EntryIndex, ParentEntry extends InnerEntry<any, any, any, any, any> | null, EntryType extends Entry<any, any, any, any, any>> {
    protected readonly parentEntry: ParentEntry;
    constructor(parentEntry: ParentEntry);
    loadOne(fileName: string, position: number): Promise<EntryType>;
    loadMany(fileNames: string[], startPosition?: number): Promise<EntryType[]>;
    protected buildFsPath(fileName: string): string;
    protected loadIndex(fsPath: string): Promise<IndexType | 'not-found'>;
    protected abstract loadEntry(common: EntryCommon, index: IndexType | null, position: number): Promise<EntryType>;
}

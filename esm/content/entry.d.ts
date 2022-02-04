export interface EntryLocation {
    path: string;
    fsPath: string;
}
export interface BaseEntry {
    link: string;
    location: EntryLocation;
    title: string;
}
export declare const createBaseEntry: (parentLocation: EntryLocation, link: string, title?: string | undefined, fsPath?: string | undefined) => BaseEntry;
export interface SuccessEntry extends BaseEntry {
    type: 'success';
}
export declare const createSuccessEntry: (parentLocation: EntryLocation, link: string, title?: string | undefined, fsPath?: string | undefined) => SuccessEntry;
export interface BrokenEntry extends BaseEntry {
    type: 'broken';
}
export declare const createBrokenEntry: (parentLocation: EntryLocation, link: string, title?: string | undefined, fsPath?: string | undefined) => BrokenEntry;
export declare type Entry<T extends {} = {}> = SuccessEntry & T | BrokenEntry;

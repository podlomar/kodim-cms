export interface SuccessEntry {
    type: 'success';
    link: string;
    path: string;
    fsPath: string;
    title: string;
}
export interface FailedEntry {
    type: 'failed';
    link: string;
    path: string;
    fsPath: string;
}
export declare type Entry = SuccessEntry | FailedEntry;
export declare const createSuccessEntry: (parentEntry: SuccessEntry, link: string, title: string, fsPath?: string | undefined) => SuccessEntry;
export declare const createFailedEntry: (parentEntry: SuccessEntry, link: string, fsPath?: string | undefined) => FailedEntry;

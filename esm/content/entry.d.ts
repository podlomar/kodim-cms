import { EntryIndex } from "../entries";
export declare type EntryAccess = 'public' | 'logged-in' | 'claim' | 'deny';
export interface BaseEntry {
    link: string;
    title: string;
    path: string;
    fsPath: string;
    authors: string[];
    draft: boolean;
    access: EntryAccess;
}
export declare const createBaseEntry: <Props>(parentBase: BaseEntry, index: EntryIndex, link: string, fsPath?: string | undefined) => BaseEntry;
export interface OkLeafEntry<Props extends {}> extends BaseEntry {
    nodeType: 'leaf';
    props: Props;
}
export interface OkInnerEntry<Props extends {}, SubEntry extends Entry = any> extends BaseEntry {
    nodeType: 'inner';
    props: Props;
    subEntries: SubEntry[];
}
export interface BrokenEntry extends BaseEntry {
    nodeType: 'broken';
}
export declare const createBrokenEntry: (parentBase: BaseEntry, link: string, fsPath?: string | undefined) => BrokenEntry;
export declare type LeafEntry<Props extends {} = {}> = OkLeafEntry<Props> | BrokenEntry;
export declare type InnerEntry<Props extends {} = {}, SubEntry extends Entry = any> = (OkInnerEntry<Props, SubEntry> | BrokenEntry);
export declare type Entry = OkLeafEntry<any> | OkInnerEntry<any> | BrokenEntry;

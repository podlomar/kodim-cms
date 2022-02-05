export interface EntryLocation {
    path: string;
    fsPath: string;
}
export declare const createChildLocation: (parentLocation: EntryLocation, link: string, fsPath?: string | undefined) => {
    path: string;
    fsPath: string;
};
export interface BaseEntry<Props extends {} = any> {
    link: string;
    title: string;
    location: EntryLocation;
    props: Props;
}
export declare const createBaseEntry: <Props>(location: EntryLocation, link: string, props: Props, title?: string | undefined) => BaseEntry<Props>;
export interface OkLeafEntry<Props extends {}> extends BaseEntry<Props> {
    nodeType: 'leaf';
}
export interface OkInnerEntry<Props extends {}, SubEntry extends Entry = any> extends BaseEntry<Props> {
    nodeType: 'inner';
    subEntries: SubEntry[];
}
export interface BrokenEntry extends BaseEntry {
    nodeType: 'broken';
}
export declare type LeafEntry<Props extends {} = {}> = OkLeafEntry<Props> | BrokenEntry;
export declare type InnerEntry<Props extends {} = {}, SubEntry extends Entry = any> = (OkInnerEntry<Props, SubEntry> | BrokenEntry);
export declare type Entry = OkLeafEntry<any> | OkInnerEntry<any> | BrokenEntry;

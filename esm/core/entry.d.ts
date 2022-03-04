import { ResourceRef } from "./resource.js";
import { EntryIndex } from "../entries.js";
import { Resource, Crumbs } from "./resource.js";
export interface EntryCommon {
    readonly link: string;
    readonly path: string;
    readonly fsPath: string;
    readonly position: number;
    readonly baseUrl: string;
}
export declare abstract class Entry<ParentEntry extends InnerEntry<any, any, any, any, any> | null, PublicAttrs extends {}, FullAttrs extends PublicAttrs, Index extends EntryIndex, SubEntry extends Entry<any, any, any, any, any>> {
    protected readonly parentEntry: ParentEntry;
    protected readonly common: EntryCommon;
    protected readonly index: Index | null;
    protected readonly crumbs: Crumbs;
    constructor(parentEntry: ParentEntry, common: EntryCommon, index: Index | null, crumbs: Crumbs);
    getCommon(): EntryCommon;
    fetchResource(): Promise<Resource<Entry<ParentEntry, PublicAttrs, FullAttrs, Index, SubEntry>>>;
    getRef(): ResourceRef<PublicAttrs>;
    getNextSibling(): this | null;
    getPrevSibling(): this | null;
    getParent(): ParentEntry;
    abstract findSubEntry(link: string): SubEntry | null;
    abstract getPublicAttrs(index: Index): PublicAttrs;
    abstract fetchFullAttrs(index: Index): Promise<FullAttrs>;
}
export declare abstract class LeafEntry<ParentEntry extends InnerEntry<any, any, any, any, any> | null, PublicAttrs extends {}, FullAttrs extends PublicAttrs, Index extends EntryIndex> extends Entry<ParentEntry, PublicAttrs, FullAttrs, Index, never> {
    findSubEntry(link: string): null;
}
export declare abstract class InnerEntry<ParentEntry extends InnerEntry<any, any, any, any, any> | null, PublicAttrs extends {}, FullAttrs extends PublicAttrs, Index extends EntryIndex, SubEntry extends Entry<any, any, any, any, any>> extends Entry<ParentEntry, PublicAttrs, FullAttrs, Index, SubEntry> {
    protected readonly subEntries: SubEntry[];
    constructor(parentEntry: ParentEntry, common: EntryCommon, index: Index | null, crumbs: Crumbs);
    pushSubEntries(...subEntries: SubEntry[]): void;
    findSubEntry(link: string): SubEntry | null;
    findSubEntryByPos(pos: number): SubEntry | null;
}

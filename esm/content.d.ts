import { Entry } from "@filefish/core/dist/entry";
export interface CrumbStep {
    readonly path: string;
    readonly title: string;
}
export declare type Crumbs = CrumbStep[];
export interface BaseContent {
    readonly link: string;
    readonly path: string;
    readonly title: string | null;
}
export declare const createCrumbs: (entry: Entry<any>) => Crumbs | null;
export declare const createBaseContent: (base: EntryBase) => BaseContent;
export interface BaseContentRef {
    readonly status: 'ok' | 'forbidden';
    readonly link: string;
    readonly path: string;
    readonly title: string | null;
}
export interface PublicRef<Pub extends {}> extends BaseContentRef {
    publicContent: Pub;
}
export interface BrokenRef extends BaseContentRef {
    publicContent: 'broken';
}
export declare type ContentRef<Pub extends {}> = (PublicRef<Pub> | BrokenRef);

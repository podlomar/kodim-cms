import { Entry } from "./entry";
export interface CrumbStep {
    readonly path: string;
    readonly title: string;
}
export declare type Crumbs = CrumbStep[];
export declare type PublicContent<Pub extends {}> = {
    type: 'public';
} & Pub;
export declare type FullContent<Full extends {}> = {
    type: 'full';
} & Full;
export declare type BrokenContent<Bro extends {}> = {
    type: 'broken';
} & Bro;
export interface BaseResource {
    readonly link: string;
    readonly path: string;
    readonly url: string;
    readonly title: string;
    readonly crumbs: Crumbs;
}
export interface OkResource<Full extends {}, Bro extends {}> extends BaseResource {
    readonly status: 'ok';
    readonly content: FullContent<Full> | BrokenContent<Bro>;
}
export interface ForbiddenResource<Pub extends {}, Bro extends {}> extends BaseResource {
    readonly status: 'forbidden';
    readonly content: PublicContent<Pub> | BrokenContent<Bro>;
}
export declare type Resource<Full extends {} = {}, Pub extends {} = {}, Bro extends {} = {}> = (OkResource<Full, Bro> | ForbiddenResource<Pub, Bro>);
export interface NotFound {
    readonly status: 'not-found';
}
export declare const createBaseResource: (entry: Entry, crumbs: Crumbs, baseUrl: string) => BaseResource;
export declare const createNotFound: () => NotFound;
export interface BaseRef {
    readonly status: 'ok' | 'forbidden';
    readonly link: string;
    readonly path: string;
    readonly url: string;
    readonly title: string;
}
export interface PublicRef<Pub extends {}> extends BaseRef {
    publicContent: Pub;
}
export interface BrokenRef extends BaseRef {
    publicContent: 'broken';
}
export declare type ResourceRef<Pub extends {}> = (PublicRef<Pub> | BrokenRef);
export declare const createBaseRef: (status: 'ok' | 'forbidden', entry: Entry, baseUrl: string) => BaseRef;
export declare const buildAssetPath: (fileName: string, entryPath: string, baseUrl: string) => string;

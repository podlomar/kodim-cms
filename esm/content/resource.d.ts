import { Entry, BrokenEntry, SuccessEntry } from "./entry";
export interface CrumbStep {
    readonly path: string;
    readonly title: string;
}
export declare type Crumbs = CrumbStep[];
export interface BaseResource {
    readonly link: string;
    readonly path: string;
    readonly url: string;
    readonly title: string;
}
export interface OkResource extends BaseResource {
    readonly status: 'ok';
    readonly crumbs: Crumbs;
}
export interface BrokenResource extends BaseResource {
    readonly status: 'broken';
    readonly crumbs: Crumbs;
}
export interface ForbiddenResource extends BaseResource {
    readonly status: 'forbidden';
}
export interface NotFound {
    readonly status: 'not-found';
}
export declare type Resource<T = {}, B = {}, F = {}> = ((OkResource & T) | (BrokenResource & B) | (ForbiddenResource & F));
export declare const createOkResource: (entry: SuccessEntry, crumbs: Crumbs, baseUrl: string) => OkResource;
export declare const createBrokenResource: (entry: BrokenEntry, crumbs: Crumbs, baseUrl: string) => BrokenResource;
export declare const createForbiddenResource: (entry: Entry, baseUrl: string) => ForbiddenResource;
export declare const createNotFound: () => NotFound;
export interface OkRef extends BaseResource {
    status: 'ok';
    title: string;
}
export interface BrokenRef extends BaseResource {
    status: 'broken';
}
export interface ForbiddenRef {
    status: 'forbidden';
    title: string;
}
export declare type ResourceRef<T = {}, B = {}, F = {}> = ((OkRef & T) | (BrokenRef & B) | (ForbiddenRef & F));
export declare const createOkRef: (entry: SuccessEntry, baseUrl: string) => OkRef;
export declare const createBrokenRef: (entry: BrokenEntry, baseUrl: string) => BrokenRef;
export declare const createForbiddenRef: (title: string) => ForbiddenRef;
export declare const createResourceRef: (entry: Entry, baseUrl: string) => ResourceRef;
export declare const buildAssetPath: (fileName: string, entryPath: string, baseUrl: string) => string;

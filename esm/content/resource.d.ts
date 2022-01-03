import { Entry, FailedEntry, SuccessEntry } from "./entry";
export interface CrumbStep {
    readonly path: string;
    readonly title: string;
}
export declare type Crumbs = CrumbStep[];
export interface BaseResource {
    readonly link: string;
    readonly path: string;
    readonly url: string;
}
export interface SuccessResource extends BaseResource {
    readonly type: 'content';
    readonly title: string;
    readonly crumbs: Crumbs;
}
export interface FailedResource extends BaseResource {
    readonly type: 'failed';
}
export interface ForbiddenResource extends BaseResource {
    readonly type: 'forbidden';
}
export interface NotFound {
    readonly type: 'not-found';
}
export declare type Resource<T = {}> = ((SuccessResource & T) | FailedResource | ForbiddenResource);
export declare const createSuccessResource: (entry: SuccessEntry, crumbs: Crumbs, baseUrl: string) => SuccessResource;
export declare const createFailedResource: (entry: FailedEntry, baseUrl: string) => FailedResource;
export declare const createNotFound: () => NotFound;
export interface SuccessRef extends BaseResource {
    type: 'ref';
    title: string;
}
export interface FailedRef extends BaseResource {
    type: 'failed';
}
export declare type ResourceRef<T = {}> = (SuccessRef & T) | FailedRef;
export declare const createSuccessRef: (entry: SuccessEntry, baseUrl: string) => SuccessRef;
export declare const createFailedRef: (entry: FailedEntry, baseUrl: string) => FailedRef;
export declare const createResourceRef: (entry: Entry, baseUrl: string) => ResourceRef;
export declare const buildAssetPath: (fileName: string, entry: Entry, baseUrl: string) => string;

import { Entry, FailedEntry, SuccessEntry } from "./entry";
export interface CrumbStep {
    readonly path: string;
    readonly title: string;
}
export declare type Crumbs = CrumbStep[];
export interface ResourceLocation {
    readonly link: string;
    readonly path: string;
    readonly url: string;
}
export interface SuccessResource extends ResourceLocation {
    type: 'content';
    title: string;
    crumbs: Crumbs;
}
export interface FailedResource extends ResourceLocation {
    type: 'error';
}
export declare type ContentResource = SuccessResource | FailedResource;
export declare const createSuccessResource: (entry: SuccessEntry, crumbs: Crumbs, baseUrl: string) => SuccessResource;
export declare const createFailedResource: (entry: FailedEntry, baseUrl: string) => FailedResource;
export interface SuccessRef extends ResourceLocation {
    type: 'ref';
    title: string;
}
export interface FailedRef extends ResourceLocation {
    type: 'failed';
}
export declare type ResourceRef<T = {}> = (SuccessRef & T) | FailedRef;
export declare const createSuccessRef: (entry: SuccessEntry, baseUrl: string) => SuccessRef;
export declare const createFailedRef: (entry: FailedEntry, baseUrl: string) => FailedRef;
export declare const createResourceRef: (entry: Entry, baseUrl: string) => ResourceRef;
export declare const buildAssetPath: (fileName: string, entry: Entry, baseUrl: string) => string;

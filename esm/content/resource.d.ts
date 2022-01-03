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
export declare type SuccessResource<T = {}> = (ResourceLocation & {
    type: 'content';
    title: string;
    crumbs: Crumbs;
} & T);
export declare type FailedResource = (ResourceLocation & {
    type: 'failed';
});
export declare type ForbiddenResource = (ResourceLocation & {
    type: 'forbidden';
});
export interface NotFoundResource {
    type: 'not-found';
}
export declare type Resource<T = {}> = (SuccessResource<T> | FailedResource | ForbiddenResource | NotFoundResource);
export declare const createSuccessResource: (entry: SuccessEntry, crumbs: Crumbs, baseUrl: string) => SuccessResource;
export declare const createFailedResource: (entry: FailedEntry, baseUrl: string) => FailedResource;
export declare const createNotFoundResource: () => NotFoundResource;
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

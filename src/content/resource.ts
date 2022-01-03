import { Entry, FailedEntry, SuccessEntry } from "./entry";

export interface CrumbStep {
  readonly path: string;
  readonly title: string;
}

export type Crumbs = CrumbStep[];

export interface ResourceLocation {
  readonly link: string,
  readonly path: string,
  readonly url: string,
}

export type SuccessResource<T = {}> = (
  & ResourceLocation
  & {
    type: 'content',
    title: string,
    crumbs: Crumbs,
  } 
  & T
);

export type FailedResource = (
  & ResourceLocation 
  & {
    type: 'failed',
  }
);

export type ForbiddenResource = (
  & ResourceLocation 
  & {
    type: 'forbidden',
  }
);

export interface NotFoundResource {
  type: 'not-found',  
};

export type Resource<T = {}> = (
  | SuccessResource<T>
  | FailedResource
  | ForbiddenResource
  | NotFoundResource
);  

const createResourceLocation = (entry: Entry, baseUrl: string) => ({
  link: entry.link,
  path: entry.path,
  url: `${baseUrl}/content${entry.path}`,
})

export const createSuccessResource = (
  entry: SuccessEntry, crumbs: Crumbs, baseUrl: string
): SuccessResource => ({
  type: 'content',
  ...createResourceLocation(entry, baseUrl),
  crumbs,
  title: entry.title,
});

export const createFailedResource = (
  entry: FailedEntry,
  baseUrl: string,
): FailedResource => ({
  ...createResourceLocation(entry, baseUrl),
  type: 'failed',
});

export const createNotFoundResource = (): NotFoundResource => ({
  type: 'not-found',
});

export interface SuccessRef extends ResourceLocation {
  type: 'ref',
  title: string,
}

export interface FailedRef extends ResourceLocation {
  type: 'failed',
}

export type ResourceRef<T = {}> = (SuccessRef & T) | FailedRef;

export const createSuccessRef = (entry: SuccessEntry, baseUrl: string): SuccessRef => ({
  type: 'ref',
  ...createResourceLocation(entry, baseUrl),
  title: entry.title,
})

export const createFailedRef = (entry: FailedEntry, baseUrl: string): FailedRef => ({
  type: 'failed',
  ...createResourceLocation(entry, baseUrl),
})

export const createResourceRef = (
  entry: Entry, baseUrl: string,
): ResourceRef => entry.type === 'failed'
  ? createFailedRef(entry, baseUrl)
  : createSuccessRef(entry, baseUrl);

export const buildAssetPath = (fileName: string, entry: Entry, baseUrl: string) => {
  return `${baseUrl}/assets${entry.path}/${fileName}`;
}
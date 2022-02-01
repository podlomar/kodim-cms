import { Entry, BrokenEntry, SuccessEntry } from "./entry";

export interface CrumbStep {
  readonly path: string;
  readonly title: string;
}

export type Crumbs = CrumbStep[];

export interface BaseResource {
  readonly link: string,
  readonly path: string,
  readonly url: string,
  readonly title: string,
}

export interface OkResource extends BaseResource {
  readonly status: 'ok',
  readonly crumbs: Crumbs,
};

export interface BrokenResource extends BaseResource {
  readonly status: 'broken';
  readonly crumbs: Crumbs,
};

export interface ForbiddenResource extends BaseResource {
  readonly status: 'forbidden',
};

export interface NotFound {
  readonly status: 'not-found',  
};

export type Resource<T = {}, B = {}, F = {}> = (
  | (OkResource & T)
  | (BrokenResource & B)
  | (ForbiddenResource & F)
);

const createBaseResource = (entry: Entry, baseUrl: string): BaseResource => ({
  link: entry.link,
  title: entry.title,
  path: entry.location.path,
  url: `${baseUrl}/content${entry.location.path}`,
})

export const createOkResource = (
  entry: SuccessEntry, crumbs: Crumbs, baseUrl: string
): OkResource => ({
  status: 'ok',
  ...createBaseResource(entry, baseUrl),
  crumbs,
});

export const createBrokenResource = (
  entry: BrokenEntry,
  crumbs: Crumbs, 
  baseUrl: string,
): BrokenResource => ({
  status: 'broken',
  ...createBaseResource(entry, baseUrl),
  crumbs,
});

export const createForbiddenResource = (
  entry: Entry, baseUrl: string,
): ForbiddenResource => ({
  status: 'forbidden',
  ...createBaseResource(entry, baseUrl),
});

export const createNotFound = (): NotFound => ({
  status: 'not-found',
});

export interface OkRef extends BaseResource {
  status: 'ok',
  title: string,
}

export interface BrokenRef extends BaseResource {
  status: 'broken',
}

export interface ForbiddenRef {
  status: 'forbidden';
  title: string;
}

export type ResourceRef<T = {}, B = {}, F = {}> = (
  | (OkRef & T) 
  | (BrokenRef & B)
  | (ForbiddenRef & F)
);

export const createOkRef = (entry: SuccessEntry, baseUrl: string): OkRef => ({
  status: 'ok',
  ...createBaseResource(entry, baseUrl),
  title: entry.title,
})

export const createBrokenRef = (entry: BrokenEntry, baseUrl: string): BrokenRef => ({
  status: 'broken',
  ...createBaseResource(entry, baseUrl),
})

export const createForbiddenRef = (entry: Entry, baseUrl: string): ForbiddenRef => ({
  status: 'forbidden',
  title: entry.title,
})

export const createResourceRef = (
  entry: Entry, baseUrl: string,
): ResourceRef => entry.type === 'broken'
  ? createBrokenRef(entry, baseUrl)
  : createOkRef(entry, baseUrl);

export const buildAssetPath = (fileName: string, entryPath: string, baseUrl: string) => {
  return `${baseUrl}/assets${entryPath}/${fileName}`;
}
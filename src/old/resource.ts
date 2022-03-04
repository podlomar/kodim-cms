import { Entry } from "./entry";

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
  readonly crumbs: Crumbs,
}

export interface OkResource<
  Full extends {}, Bro extends {},
  > extends BaseResource {
  readonly status: 'ok',
  readonly content: FullResourceContent<Full> | BrokenResourceContent<Bro>;
}

export interface ForbiddenResource<
  Pub extends {}, Bro extends {},
  > extends BaseResource {
  readonly status: 'forbidden',
  readonly content: PublicResourceContent<Pub> | BrokenResourceContent<Bro>;
}

export type Resource<Full extends {} = {}, Pub extends {} = {}, Bro extends {} = {}> = (
  | OkResource<Full, Bro>
  | ForbiddenResource<Pub, Bro>
);

export interface NotFound {
  readonly status: 'not-found',
};

export const createBaseResource = (
  entry: Entry,
  crumbs: Crumbs,
  baseUrl: string
): BaseResource => ({
  link: entry.link,
  path: entry.path,
  url: `${baseUrl}/content${entry.path}`,
  title: entry.title,
  crumbs,
});

export const createNotFound = (): NotFound => ({
  status: 'not-found',
});

export interface BaseRef {
  readonly status: 'ok' | 'forbidden',
  readonly link: string,
  readonly path: string,
  readonly url: string,
  readonly title: string,
}

export interface PublicRef<Pub extends {}> extends BaseRef {
  publicContent: Pub,
};

export interface BrokenRef extends BaseRef {
  publicContent: 'broken',
};

export type ResourceRef<Pub extends {}> = (
  | PublicRef<Pub>
  | BrokenRef
);

export const createBaseRef = (
  status: 'ok' | 'forbidden',
  entry: Entry,
  baseUrl: string
): BaseRef => ({
  status,
  link: entry.link,
  path: entry.path,
  url: `${baseUrl}/content${entry.path}`,
  title: entry.title,
});

export const buildAssetPath = (fileName: string, entryPath: string, baseUrl: string) => {
  return `${baseUrl}/assets${entryPath}/${fileName}`;
}
import { Entry, EntryBase } from "@filefish/core/dist/entry";

export interface CrumbStep {
  readonly path: string;
  readonly title: string;
}

export type Crumbs = CrumbStep[];

export interface BaseContent {
  readonly link: string,
  readonly path: string,
  readonly title: string | null,
}

export const createCrumbs = (entry: Entry<any>): Crumbs | null => {
  const basesPath = entry.getBasesPath();
  if (basesPath.length < 2) {
    return null;
  }

  if (basesPath.length === 2) {
    return [];
  }

  return basesPath.slice(1, -1).map((base): CrumbStep => ({
    path: base.contentPath,
    title: base.title ?? base.link,
  }));
}

export const createBaseContent = (base: EntryBase): BaseContent => ({
  link: base.link,
  path: base.contentPath,
  title: base.title,
});

export interface BaseContentRef {
  readonly status: 'ok' | 'forbidden',
  readonly link: string,
  readonly path: string,
  readonly title: string | null,
}

export interface PublicRef<Pub extends {}> extends BaseContentRef {
  publicContent: Pub,
};

export interface BrokenRef extends BaseContentRef {
  publicContent: 'broken',
};

export type ContentRef<Pub extends {}> = (
  | PublicRef<Pub>
  | BrokenRef
);

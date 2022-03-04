import { Entry } from "./entry";

export interface CrumbStep {
  readonly path: string;
  readonly title: string;
}

export type Crumbs = CrumbStep[];

export type PublicContent<E extends Entry<any, any, any, any, any>> = {
  type: 'public',
} & ReturnType<E['getPublicAttrs']>;

export type FullContent<E extends Entry<any, any, any, any, any>> = {
  type: 'full',
} & Awaited<ReturnType<E['fetchFullAttrs']>>;

export type BrokenContent<Attrs extends {}> = {
  type: 'broken',
} & Attrs;

export interface BaseResource {
  readonly link: string,
  readonly path: string,
  readonly url: string,
  readonly title: string,
  readonly crumbs: Crumbs,
}

export interface FullContentResource<E extends Entry<any, any, any, any, any>> extends BaseResource {
  readonly status: 'ok',
  readonly content: FullContent<E>;
}

export interface BrokenContentResource extends BaseResource {
  readonly status: 'ok',
  readonly content: BrokenContent<{}>,
}

export interface ForbiddenResource<E extends Entry<any, any, any, any, any>> extends BaseResource {
  readonly status: 'forbidden',
  readonly content: PublicContent<E> | BrokenContent<{}>;
}

export type Resource<E extends Entry<any, any, any, any, any>> = (
  | FullContentResource<E>
  | BrokenContentResource
  | ForbiddenResource<E>
);

export interface BaseRef {
  readonly status: 'ok' | 'forbidden',
  readonly link: string,
  readonly path: string,
  readonly url: string,
  readonly title: string,
}

export interface PublicRef<PublicAttrs extends {}> extends BaseRef {
  publicContent: PublicAttrs,
};

export interface BrokenRef extends BaseRef {
  publicContent: 'broken',
};

export type ResourceRef<PublicAttrs extends {}> = (
  | PublicRef<PublicAttrs>
  | BrokenRef
);

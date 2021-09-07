export interface Crumb {
  readonly link: string;
  readonly title: string;
  readonly url: string;
}

export interface Resource {
  readonly type: string;
  readonly link: string;
  readonly url: string;
  readonly title: string;
  readonly crumbs: readonly Crumb[];
}

export type ResourceList = string[] | Resource[];
export type Data = ResourceList | Resource;
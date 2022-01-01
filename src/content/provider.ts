import { Entry } from "./entry.js";
import { ContentResource, createResourceRef, Crumbs, ResourceRef } from "./resource.js";

export interface ResourceProvider<
  C extends ResourceProvider<any> = any
> {
  fetch(): Promise<ContentResource | null>;
  find(link: string): C | null;
  search(...links: string[]): ResourceProvider | null;
  asset(fileName: string): string;
}

export abstract class BaseResourceProvider<
  P extends ResourceProvider | null, E extends Entry, C extends ResourceProvider,
> implements ResourceProvider<C> {
  protected readonly entry: E;
  protected readonly parent: P;
  protected readonly position: number;
  protected readonly settings: ProviderSettings;
  protected readonly crumbs: Crumbs;

  public constructor(
    parent: P, 
    entry: E, 
    position: number,
    crumbs: Crumbs,
    settings: ProviderSettings
  ) {
    this.entry = entry;
    this.parent = parent;
    this.position = position;
    this.crumbs = crumbs;
    this.settings = settings;
  }

  public search(...[link, ...restLinks]: string[]): ResourceProvider | null{
    if (link === '') {
      return this;
    }

    const child = this.find(link);

    if (child === null || restLinks.length === 0) {
      return child;
    }

    return child.search(...restLinks);
  }

  public asset(fileName: string): string {
    return `${this.entry.fsPath}/assets/${fileName}`;
  }

  public getEntry(): E {
    return this.entry;
  }

  public abstract fetch(): Promise<ContentResource | null>;
  public abstract find(link: string): C | null;
}

export interface ProviderSettings {
  baseUrl: string;
}
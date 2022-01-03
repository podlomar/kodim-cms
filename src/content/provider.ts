import { Entry } from "./entry.js";
import { Resource, createNotFoundResource, createResourceRef, Crumbs, NotFoundResource, ResourceRef } from "./resource.js";

export interface ResourceProvider<
  C extends ResourceProvider<any> = any
> {
  fetch(): Promise<Resource>;
  find(link: string): C | NotFoundProvider;
  search(...links: string[]): ResourceProvider;
  asset(fileName: string): string | null;
  success(): this | null;
}

export class NotFoundProvider implements ResourceProvider<never> {
  public async fetch(): Promise<NotFoundResource> {
    return createNotFoundResource();
  }

  public find(link: string): this {
    return this;
  };

  public search(): this {
    return this;
  }

  public asset(fileName: string): null {
    return null;
  }

  public success(): null {
    return null;
  }
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

  public search(...[link, ...restLinks]: string[]): ResourceProvider {
    if (link === '') {
      return this;
    }

    const child = this.find(link);
    if (child.success() === null || restLinks.length === 0) {
      return child;
    }

    return child.search(...restLinks);
  }

  public asset(fileName: string): string {
    return `${this.entry.fsPath}/assets/${fileName}`;
  }

  public success(): this { 
    return this;
  }

  public getEntry(): E {
    return this.entry;
  }

  public abstract fetch(): Promise<Resource>;
  public abstract find(link: string): C | NotFoundProvider;
}

export interface ProviderSettings {
  baseUrl: string;
}
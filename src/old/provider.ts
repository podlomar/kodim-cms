import { AccessCheck } from "./access-check.js";
import { BrokenEntry, InnerEntry, LeafEntry, OkEntry } from "./entry.js";
import { createNotFound, Crumbs, NotFound, Resource, ForbiddenResource, PublicResourceContent, BrokenResourceContent, createBaseResource } from "./resource.js";

export interface ResourceProvider {
  fetch(): Promise<Resource | NotFound>;
  find(link: string): ResourceProvider;
  search(...links: string[]): ResourceProvider;
  asset(fileName: string): string | 'forbidden' | 'not-found';
  findRepo(repoUrl: string): ResourceProvider | null;
  success(): this | null;
}

export class NotFoundProvider implements ResourceProvider {
  public async fetch(): Promise<NotFound> {
    return createNotFound();
  }

  public find(link: string): this {
    return this;
  };

  public search(): this {
    return this;
  }

  public findRepo(repoUrl: string): null {
    return null;
  }

  public asset(fileName: string): 'not-found' {
    return 'not-found';
  }

  public success(): null {
    return null;
  }
}

export abstract class BaseProvider {
  protected readonly position: number;
  protected readonly crumbs: Crumbs;
  protected readonly accessCheck: AccessCheck;
  protected readonly settings: ProviderSettings;

  public constructor(
    position: number,
    crumbs: Crumbs,
    accessCheck: AccessCheck,
    settings: ProviderSettings
  ) {
    this.position = position;
    this.crumbs = crumbs;
    this.accessCheck = accessCheck;
    this.settings = settings;
  }
}

export abstract class LeafProvider<
  E extends LeafEntry<any>, P extends InnerEntry<any, E>
> extends BaseProvider {
  protected readonly entry: E;
  protected readonly parent: P;

  public constructor(
    position: number,
    crumbs: Crumbs,
    accessCheck: AccessCheck,
    settings: ProviderSettings
  ) {
    this.position = position;
    this.crumbs = crumbs;
    this.accessCheck = accessCheck;
    this.settings = settings;
  }

}

>

export abstract class BaseResourceProvider<
  P extends ResourceProvider | null, E extends OkEntry | BrokenEntry, C extends ResourceProvider,
  > implements ResourceProvider {
  protected readonly entry: E;
  protected readonly parent: P;
  protected readonly position: number;
  protected readonly crumbs: Crumbs;
  protected readonly accessCheck: AccessCheck;
  protected readonly settings: ProviderSettings;

  public constructor(
    parent: P,
    entry: E,
    position: number,
    crumbs: Crumbs,
    accessCheck: AccessCheck,
    settings: ProviderSettings
  ) {
    this.entry = entry;
    this.parent = parent;
    this.position = position;
    this.crumbs = crumbs;
    this.accessCheck = accessCheck;
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

  public abstract reload(links: string[]): Promise<E>;
  public abstract fetch(): Promise<Resource | NotFound>;
  public abstract findRepo(repoUrl: string): ResourceProvider | null;
  public abstract find(link: string): C | NotFoundProvider;
}

export interface ProviderSettings {
  baseUrl: string;
}
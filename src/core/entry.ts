import { BrokenContentResource, FullContentResource, ResourceRef } from "./resource.js";
import { EntryIndex } from "../entries.js";
import { Resource, Crumbs } from "./resource.js";

export interface EntryCommon {
  readonly link: string,
  readonly path: string,
  readonly fsPath: string,
  readonly position: number,
  readonly baseUrl: string;
}

export abstract class Entry<
  ParentEntry extends InnerEntry<any, any, any, any, any> | null,
  PublicAttrs extends {},
  FullAttrs extends PublicAttrs,
  Index extends EntryIndex,
  SubEntry extends Entry<any, any, any, any, any>,
  > {

  protected readonly parentEntry: ParentEntry;
  protected readonly common: EntryCommon;
  protected readonly index: Index | null;
  protected readonly crumbs: Crumbs;

  public constructor(
    parentEntry: ParentEntry, common: EntryCommon, index: Index | null, crumbs: Crumbs
  ) {
    this.parentEntry = parentEntry;
    this.common = common;
    this.index = index;
    this.crumbs = crumbs;
  }

  public getCommon(): EntryCommon {
    return this.common;
  }

  public async fetchResource(): Promise<Resource<Entry<ParentEntry,
    PublicAttrs,
    FullAttrs,
    Index,
    SubEntry>
  >> {
    if (this.index === null) {
      return {
        status: 'ok',
        link: this.common.link,
        path: this.common.path,
        url: `${this.common.baseUrl}/content${this.common.path}`,
        title: this.common.link,
        crumbs: this.crumbs,
        content: { type: 'broken' },
      }
    }

    const fullAttrs = await this.fetchFullAttrs(this.index);
    return {
      status: 'ok',
      link: this.common.link,
      path: this.common.path,
      url: `${this.common.baseUrl}/content${this.common.path}`,
      title: this.index.title ?? this.common.link,
      crumbs: this.crumbs,
      content: {
        type: 'full',
        ...fullAttrs,
      }
    };
  }

  public getRef(): ResourceRef<PublicAttrs> {
    if (this.index === null) {
      return {
        status: 'ok',
        link: this.common.link,
        path: this.common.path,
        url: `${this.common.baseUrl}/content${this.common.path}`,
        title: this.common.link,
        publicContent: 'broken',
      }
    }

    return {
      status: 'ok',
      link: this.common.link,
      path: this.common.path,
      url: `${this.common.baseUrl}/content${this.common.path}`,
      title: this.index.title ?? this.common.link,
      publicContent: this.getPublicAttrs(this.index),
    }
  }

  public getNextSibling(): this | null {
    if (this.parentEntry === null) {
      return null;
    }

    return this.parentEntry.findSubEntryByPos(this.common.position + 1);
  }

  public getPrevSibling(): this | null {
    if (this.parentEntry === null) {
      return null;
    }

    return this.parentEntry.findSubEntryByPos(this.common.position - 1);
  }

  public getParent(): ParentEntry {
    return this.parentEntry;
  }

  public abstract findSubEntry(link: string): SubEntry | null;
  public abstract getPublicAttrs(index: Index): PublicAttrs;
  public abstract fetchFullAttrs(index: Index): Promise<FullAttrs>;
}

export abstract class LeafEntry<
  ParentEntry extends InnerEntry<any, any, any, any, any> | null,
  PublicAttrs extends {},
  FullAttrs extends PublicAttrs,
  Index extends EntryIndex,
  > extends Entry<ParentEntry, PublicAttrs, FullAttrs, Index, never> {

  public findSubEntry(link: string): null {
    return null;
  }
}

export abstract class InnerEntry<
  ParentEntry extends InnerEntry<any, any, any, any, any> | null,
  PublicAttrs extends {},
  FullAttrs extends PublicAttrs,
  Index extends EntryIndex,
  SubEntry extends Entry<any, any, any, any, any>,
  > extends Entry<ParentEntry, PublicAttrs, FullAttrs, Index, SubEntry> {
  protected readonly subEntries: SubEntry[];

  public constructor(
    parentEntry: ParentEntry, common: EntryCommon, index: Index | null, crumbs: Crumbs
  ) {
    super(parentEntry, common, index, crumbs);
    this.subEntries = [];
  }

  public pushSubEntries(...subEntries: SubEntry[]) {
    this.subEntries.push(...subEntries);
  }

  public findSubEntry(link: string): SubEntry | null {
    return this.subEntries.find((subEntry) => subEntry.getCommon().link === link) ?? null;
  }

  public findSubEntryByPos(pos: number): SubEntry | null {
    if (this.subEntries.length === 0) {
      return null;
    }

    if (pos < 0 || pos > (this.subEntries.length - 1)) {
      return null;
    }

    return this.subEntries[pos];
  }
}

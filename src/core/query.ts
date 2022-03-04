import { Entry } from "./entry.js";
import { Resource } from "./resource.js";

type SubEntry<T> = T extends Entry<any, any, any, any, infer S> ? S : any;

export interface Query<EntryType extends Entry<any, any, any, any, any> = Entry<any, any, any, any, any>> {
  find(link: string): OkQuery<SubEntry<EntryType>> | NotFoundQuery;
  search(...links: string[]): Query;
  fetch(): Promise<Resource<EntryType> | null>;
}

export class OkQuery<
  EntryType extends Entry<any, any, any, any, any>
  > implements Query<EntryType> {
  private entry: EntryType;

  private constructor(entry: EntryType) {
    this.entry = entry;
  }

  public static of<
    EntryType extends Entry<any, any, any, any, any>
  >(entry: EntryType) {
    return new OkQuery<EntryType>(entry);
  }

  public find(link: string): OkQuery<SubEntry<EntryType>> | NotFoundQuery {
    const subEntry = this.entry.findSubEntry(link);
    if (subEntry === null) {
      return new NotFoundQuery();
    }

    return new OkQuery<SubEntry<EntryType>>(subEntry);
  }

  public search(...[link, ...restLinks]: string[]): Query {
    if (link === '') {
      return this;
    }

    const subEntry = this.entry.findSubEntry(link);
    if (subEntry === null) {
      return new NotFoundQuery();
    }

    const subQuery = new OkQuery<SubEntry<EntryType>>(subEntry);
    return subQuery.search(...restLinks);
  }

  public async fetch(): Promise<Resource<EntryType>> {
    return this.entry.fetchResource();
  }
}

export class NotFoundQuery implements Query<never> {
  public find(): NotFoundQuery {
    return this;
  }

  public search(): NotFoundQuery {
    return this;
  }

  public async fetch(): Promise<null> {
    return null;
  }
}
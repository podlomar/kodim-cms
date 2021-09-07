import { Data } from './resource.js';
import { RootNode } from './loaders/root-loader.js';
import { Query } from './tree-index.js';

export interface DataPayload {
  data: Data;
}

export interface ErrorPayload {
  errors: string[];
}

export type Payload = DataPayload | ErrorPayload;

export class ContentIndex {
  private readonly rootNode: RootNode;

  private constructor(rootNode: RootNode) {
    this.rootNode = rootNode;
  }

  public static async load(
    rootFolder: string,
    baseUrl: string,
  ): Promise<ContentIndex> {
    const rootNode = await RootNode.load(rootFolder, baseUrl);
    return new ContentIndex(rootNode);
  }

  public async fetch(query: Query): Promise<Payload> {
    const data = await this.rootNode.fetch(query);

    if (data === null) {
      return {
        errors: ['not-found'],
      } as ErrorPayload;
    }

    return { data } as DataPayload;
  }
}

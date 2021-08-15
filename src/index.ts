import { Resource } from './resource';
import { RootNode, loadRootNode } from './loaders/root-loader.js';

export interface DataPayload {
  resource: Resource;
}

export interface ErrorPayload {
  errors: string[];
}

export type Payload = DataPayload | ErrorPayload;

export class ContentIndex {
  private readonly baseUrl;
  private readonly rootNode: RootNode;

  private constructor(baseUrl: string, rootNode: RootNode) {
    this.baseUrl = baseUrl;
    this.rootNode = rootNode;
  }

  public static async load(
    rootFolder: string,
    baseUrl: string,
  ): Promise<ContentIndex> {
    const rootNode = await loadRootNode(rootFolder);
    return new ContentIndex(baseUrl, rootNode);
  }

  public async query(path: string): Promise<Payload> {
    const links = path.split('/');
    const node = this.rootNode.findNode(links);

    if (node === null) {
      return {
        errors: ['not-found'],
      } as ErrorPayload;
    }

    const resource = await node.loadResource(this.baseUrl);

    return { resource } as DataPayload;
  }
}

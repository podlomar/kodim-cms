import { IndexNode } from './tree-index';
import { Resource } from './resource';

export interface DataPayload {
  resource: Resource;
}

export interface ErrorPayload {
  errors: string[];
}

export type Payload = DataPayload | ErrorPayload;

export class ContentIndex {
  private readonly baseUrl;
  private readonly rootNode;

  constructor(rootNode: IndexNode, baseUrl: string) {
    this.rootNode = rootNode;
    this.baseUrl = baseUrl;
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

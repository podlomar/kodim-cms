import path from 'path';
import {
  ContainerIndex,
  NodeLocation,
  loadYamlFile,
  ResourceIndex,
} from '../tree-index.js';
import { Resource, ResourceRef } from '../resource.js';
import { SectionNode, loadSectionNode } from './section-loader.js';

interface RootIndex extends ResourceIndex {
  sections: string[];
}

export interface RootResource extends Resource {
  sections?: ResourceRef[];
}

export class RootNode extends ContainerIndex<SectionNode> {
  public constructor(
    location: NodeLocation,
    index: RootIndex,
    sections: readonly SectionNode[],
  ) {
    super(location, index, sections);
  }

  async loadResource(baseUrl: string): Promise<RootResource> {
    const base = this.getResourceBase(baseUrl, 'root');

    return {
      ...base,
      sections: this.getChildrenRefs(baseUrl),
    };
  }
}

export const loadRootNode = async (rootFolder: string): Promise<RootNode> => {
  const index = (await loadYamlFile(
    path.join(rootFolder, 'index.yml'),
  )) as RootIndex;

  const location = new NodeLocation(rootFolder, '', [
    {
      title: '',
      path: '/',
    },
  ]);

  const sections = await Promise.all(
    index.sections.map((fileName) => loadSectionNode(location, fileName)),
  );

  return new RootNode(location, index, sections);
};

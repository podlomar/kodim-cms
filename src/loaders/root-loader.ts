import path from 'path';
import {
  NodeLocation,
  IndexNode,
  loadYamlFile,
  ResourceIndex,
} from '../tree-index.js';
import { Resource, ResourceList } from '../resource.js';
import { SectionNode } from './section-loader.js';

interface RootIndex extends ResourceIndex {
  sections: string[];
}

export interface RootResource extends Resource {
  sections: ResourceList;
}

export class RootNode extends IndexNode {
  public static SECTIONS_LIST = 'sections';
  
  private sections: SectionNode[];
  
  public constructor(
    location: NodeLocation,
    index: RootIndex,
    sections: SectionNode[],
  ) {
    super(location, index);

    this.sections = sections;
  }

  public getList(name: string): IndexNode[] | null {
    if (name === RootNode.SECTIONS_LIST) {
      return this.sections;
    }

    return null;
  }

  public async fetchResource(expand: string[]): Promise<RootResource> {
    const base = this.getResourceBase('root');
    const sections = await this.fetchList(RootNode.SECTIONS_LIST, expand) as ResourceList;

    return {
      ...base,
      sections,
    };
  }

  public static load = async (rootFolder: string, baseUrl: string): Promise<RootNode> => {
    const index = (await loadYamlFile(
      path.join(rootFolder, 'index.yml'),
    )) as RootIndex;

    const location = NodeLocation.createRootLocation(rootFolder, baseUrl);

    const sections = await Promise.all(
      index.sections.map((fileName) => SectionNode.load(location, fileName)),
    );

    return new RootNode(location, index, sections);
  }
}

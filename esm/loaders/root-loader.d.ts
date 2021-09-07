import { NodeLocation, IndexNode, ResourceIndex } from '../tree-index.js';
import { Resource, ResourceList } from '../resource.js';
import { SectionNode } from './section-loader.js';
interface RootIndex extends ResourceIndex {
    sections: string[];
}
export interface RootResource extends Resource {
    sections: ResourceList;
}
export declare class RootNode extends IndexNode {
    private sections;
    constructor(location: NodeLocation, index: RootIndex, sections: SectionNode[]);
    getList(name: string): IndexNode[] | null;
    fetchResource(expand: string[]): Promise<RootResource>;
    static load: (rootFolder: string, baseUrl: string) => Promise<RootNode>;
}
export {};

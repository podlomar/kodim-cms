import { ContainerIndex, NodeLocation, ResourceIndex } from '../tree-index.js';
import { Resource, ResourceRef } from '../resource.js';
import { SectionNode } from './section-loader.js';
interface RootIndex extends ResourceIndex {
    sections: string[];
}
export interface RootResource extends Resource {
    sections?: ResourceRef[];
}
export declare class RootNode extends ContainerIndex<SectionNode> {
    constructor(location: NodeLocation, index: RootIndex, sections: readonly SectionNode[]);
    loadResource(baseUrl: string): Promise<RootResource>;
}
export declare const loadRootNode: (rootFolder: string) => Promise<RootNode>;
export {};

import { ContainerIndex, NodeLocation, ResourceIndex } from '../tree-index.js';
import { Resource, ResourceRef } from '../resource';
import { CourseNode } from './course-loader.js';
interface SectionIndex extends ResourceIndex {
    title: string;
    lead: string;
    courses?: string[];
}
export interface SectionResource extends Resource {
    title: string;
    lead: string;
    courses?: ResourceRef[];
}
export declare class SectionNode extends ContainerIndex<CourseNode> {
    constructor(location: NodeLocation, index: SectionIndex, courses: CourseNode[]);
    loadResource(baseUrl: string): Promise<SectionResource>;
}
export declare const loadSectionNode: (parentLocation: NodeLocation, fileName: string) => Promise<SectionNode>;
export {};

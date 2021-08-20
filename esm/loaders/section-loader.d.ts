import { ContainerIndex, NodeLocation, ResourceIndex } from '../tree-index.js';
import { Resource } from '../resource.js';
import { CourseNode, CourseResourceRef } from './course-loader.js';
interface SectionIndex extends ResourceIndex {
    title: string;
    lead: string;
    courses?: string[];
}
export interface SectionResource extends Resource {
    title: string;
    lead: string;
    courses?: CourseResourceRef[];
}
export declare class SectionNode extends ContainerIndex<CourseNode> {
    constructor(location: NodeLocation, index: SectionIndex, courses: CourseNode[]);
    loadResource(baseUrl: string): Promise<SectionResource>;
}
export declare const loadSectionNode: (parentLocation: NodeLocation, fileName: string) => Promise<SectionNode>;
export {};

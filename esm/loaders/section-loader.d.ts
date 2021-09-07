import { IndexNode, NodeLocation, ResourceIndex } from '../tree-index.js';
import { Resource, ResourceList } from '../resource.js';
import { CourseNode } from './course-loader.js';
interface SectionIndex extends ResourceIndex {
    title: string;
    lead: string;
    courses?: string[];
}
export interface SectionResource extends Resource {
    title: string;
    lead: string;
    courses: ResourceList;
}
export declare class SectionNode extends IndexNode {
    static LIST_NAME: string;
    private courses;
    constructor(location: NodeLocation, index: SectionIndex, courses: CourseNode[]);
    getList(name: string): IndexNode[] | null;
    static load: (parentLocation: NodeLocation, fileName: string) => Promise<SectionNode>;
    fetchResource(expand: string[]): Promise<SectionResource>;
}
export {};

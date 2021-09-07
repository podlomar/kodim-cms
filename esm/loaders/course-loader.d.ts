import { IndexNode, NodeLocation, ResourceIndex } from '../tree-index.js';
import { Resource, ResourceList } from '../resource.js';
import { ChapterNode } from './chapter-loader.js';
interface CourseIndex extends ResourceIndex {
    title: string;
    lead: string;
    image: string;
    chapters?: string[];
}
export interface CourseResource extends Resource {
    title: string;
    lead: string;
    image: string;
    chapters: ResourceList;
}
export declare class CourseNode extends IndexNode {
    static CHAPTERS_LIST: string;
    private chapters;
    constructor(location: NodeLocation, index: CourseIndex, chapters: ChapterNode[]);
    getList(name: string): IndexNode[] | null;
    static load: (parentLocation: NodeLocation, fileName: string) => Promise<CourseNode>;
    fetchResource(expand: string[]): Promise<CourseResource>;
}
export {};

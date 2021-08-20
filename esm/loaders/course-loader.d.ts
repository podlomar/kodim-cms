import { ContainerIndex, NodeLocation, ResourceIndex } from '../tree-index.js';
import { Resource, ResourceRef } from '../resource.js';
import { ChapterNode } from './chapter-loader.js';
interface CourseIndex extends ResourceIndex {
    title: string;
    lead: string;
    chapters?: string[];
}
export interface CourseResourceRef extends ResourceRef {
    lead: string;
}
export interface CourseResource extends Resource {
    title: string;
    lead: string;
    chapters?: ResourceRef[];
}
export declare class CourseNode extends ContainerIndex<ChapterNode> {
    constructor(location: NodeLocation, index: CourseIndex, chapters: ChapterNode[]);
    getResourceRef(baseUrl: string): CourseResourceRef;
    loadResource(baseUrl: string): Promise<CourseResource>;
}
export declare const loadCourseNode: (parentLocation: NodeLocation, fileName: string) => Promise<CourseNode>;
export {};

import { ContainerIndex, NodeLocation, ResourceIndex } from '../tree-index.js';
import { Resource, ResourceRef } from '../resource';
import { LessonNode } from './lesson-loader.js';
interface ChapterIndex extends ResourceIndex {
    title: string;
    lead: string;
    lessons: string[];
}
interface ChapterResource extends Resource {
    title: string;
    lead: string;
    lessons?: ResourceRef[];
}
export declare class ChapterNode extends ContainerIndex<LessonNode> {
    constructor(location: NodeLocation, index: ChapterIndex, lessons: LessonNode[]);
    loadResource(baseUrl: string): Promise<ChapterResource>;
}
export declare const loadChapterNode: (parentLocation: NodeLocation, fileName: string) => Promise<ChapterNode>;
export {};

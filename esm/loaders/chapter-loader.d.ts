import { IndexNode, NodeLocation, ResourceIndex } from '../tree-index.js';
import { Resource, ResourceList } from '../resource.js';
import { LessonNode } from './lesson-loader.js';
interface ChapterIndex extends ResourceIndex {
    title: string;
    lead: string;
    lessons: string[];
}
interface ChapterResource extends Resource {
    title: string;
    lead: string;
    lessons: ResourceList;
}
export declare class ChapterNode extends IndexNode {
    static LESSONS_LIST: string;
    private lessons;
    constructor(location: NodeLocation, index: ChapterIndex, lessons: LessonNode[]);
    getList(name: string): IndexNode[] | null;
    static load: (parentLocation: NodeLocation, fileName: string) => Promise<ChapterNode>;
    fetchResource(expand: string[]): Promise<ChapterResource>;
}
export {};

import { IndexNode, NodeLocation, ResourceIndex } from '../tree-index.js';
import { Resource, ResourceRef } from '../resource.js';
interface ArticleSection {
    title: string | null;
    html?: string;
}
interface FrontMatter extends ResourceIndex {
    title: string;
    lead: string;
}
interface LessonResourceRef extends ResourceRef {
    lead: string;
    num: number;
}
interface LessonResource extends Resource {
    title: string;
    lead: string;
    num: number;
    sections?: ArticleSection[];
}
export declare class LessonNode extends IndexNode {
    num: number;
    constructor(location: NodeLocation, frontMatter: FrontMatter, num: number);
    getResourceRef(baseUrl: string): LessonResourceRef;
    loadResource(baseUrl: string): Promise<LessonResource>;
}
export declare const loadLessonNode: (parentLocation: NodeLocation, fileName: string, num: number) => Promise<LessonNode>;
export {};

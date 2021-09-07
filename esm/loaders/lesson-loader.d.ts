import { IndexNode, NodeLocation, ResourceIndex } from '../tree-index.js';
import { Resource } from '../resource.js';
interface ArticleSection {
    title: string | null;
    html?: string;
}
interface FrontMatter extends ResourceIndex {
    title: string;
    lead: string;
}
interface LessonResource extends Resource {
    title: string;
    lead: string;
    num: number;
    sections: ArticleSection[];
}
export declare class LessonNode extends IndexNode {
    num: number;
    constructor(location: NodeLocation, frontMatter: FrontMatter, num: number);
    getList(): IndexNode[] | null;
    static load(parentLocation: NodeLocation, fileName: string, num: number): Promise<LessonNode>;
    fetchResource(): Promise<LessonResource>;
}
export {};

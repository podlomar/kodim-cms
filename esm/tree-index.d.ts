import { Resource, Crumb, Data, ResourceList } from './resource.js';
export declare class NodeLocation {
    readonly fsPath: string;
    readonly listName: string;
    readonly link: string;
    readonly title: string;
    readonly parentUrl: string;
    readonly crumbs: readonly Crumb[];
    private constructor();
    static createRootLocation(fsPath: string, baseUrl: string): NodeLocation;
    get url(): string;
    createChildLocation(fileName: string, index: ResourceIndex, listName: string): NodeLocation;
}
export interface ResourceIndex {
    title: string;
    link?: string;
}
export interface QueryStep {
    list: string;
    link: string | null;
}
export interface Query {
    steps: QueryStep[];
    expand: string[];
}
export declare abstract class IndexNode {
    readonly location: NodeLocation;
    protected readonly index: ResourceIndex;
    protected constructor(location: NodeLocation, index: ResourceIndex);
    abstract getList(name: string): IndexNode[] | null;
    abstract fetchResource(expand: string[]): Promise<Resource>;
    fetchList(name: string, expand: string[]): Promise<ResourceList | null>;
    getResourceBase(type: string): Resource;
    fetch(query: Query): Promise<Data | null>;
}
export declare const loadYamlFile: (filePath: string) => Promise<unknown>;

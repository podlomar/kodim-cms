import { ResourceRef, Resource, Crumb } from './resource.js';
export declare class NodeLocation {
    readonly fsPath: string;
    readonly link: string;
    readonly crumbs: readonly Crumb[];
    constructor(fsPath: string, link: string, crumbs: readonly Crumb[]);
    get path(): string;
    createChildLocation(fileName: string, index: ResourceIndex): NodeLocation;
}
export interface ResourceIndex {
    title: string;
    link?: string;
}
export declare abstract class IndexNode {
    protected readonly location: NodeLocation;
    protected readonly index: ResourceIndex;
    protected constructor(location: NodeLocation, index: ResourceIndex);
    abstract loadResource(baseUrl: string): Promise<Resource>;
    getResourceRef(baseUrl: string): ResourceRef;
    protected getResourceBase(baseUrl: string, type: string): Resource;
    findNode(links: string[]): IndexNode | null;
}
export declare abstract class ContainerIndex<ChildrenType extends IndexNode> extends IndexNode {
    protected children: readonly ChildrenType[];
    protected constructor(location: NodeLocation, index: ResourceIndex, children?: readonly ChildrenType[]);
    protected getChildrenRefs(baseUrl: string): ResourceRef[];
    findNode(links: string[]): IndexNode | null;
}
export declare const loadYamlFile: (filePath: string) => Promise<any>;

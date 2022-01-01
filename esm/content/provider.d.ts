import { Entry } from "./entry.js";
import { ContentResource, Crumbs } from "./resource.js";
export interface ResourceProvider<C extends ResourceProvider<any> = any> {
    fetch(): Promise<ContentResource | null>;
    find(link: string): C | null;
    search(...links: string[]): ResourceProvider | null;
    asset(fileName: string): string;
}
export declare abstract class BaseResourceProvider<P extends ResourceProvider | null, E extends Entry, C extends ResourceProvider> implements ResourceProvider<C> {
    protected readonly entry: E;
    protected readonly parent: P;
    protected readonly position: number;
    protected readonly settings: ProviderSettings;
    protected readonly crumbs: Crumbs;
    constructor(parent: P, entry: E, position: number, crumbs: Crumbs, settings: ProviderSettings);
    search(...[link, ...restLinks]: string[]): ResourceProvider | null;
    asset(fileName: string): string;
    getEntry(): E;
    abstract fetch(): Promise<ContentResource | null>;
    abstract find(link: string): C | null;
}
export interface ProviderSettings {
    baseUrl: string;
}

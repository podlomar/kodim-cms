import { Entry } from "./entry.js";
import { ContentResource, Crumbs, NotFoundResource } from "./resource.js";
export interface ResourceProvider<C extends ResourceProvider<any> = any> {
    fetch(): Promise<ContentResource>;
    find(link: string): C | NotFoundProvider;
    search(...links: string[]): ResourceProvider;
    asset(fileName: string): string | null;
    success(): this | null;
}
export declare class NotFoundProvider implements ResourceProvider<never> {
    fetch(): Promise<NotFoundResource>;
    find(link: string): this;
    search(): this;
    asset(fileName: string): null;
    success(): null;
}
export declare abstract class BaseResourceProvider<P extends ResourceProvider | null, E extends Entry, C extends ResourceProvider> implements ResourceProvider<C> {
    protected readonly entry: E;
    protected readonly parent: P;
    protected readonly position: number;
    protected readonly settings: ProviderSettings;
    protected readonly crumbs: Crumbs;
    constructor(parent: P, entry: E, position: number, crumbs: Crumbs, settings: ProviderSettings);
    search(...[link, ...restLinks]: string[]): ResourceProvider;
    asset(fileName: string): string;
    success(): this;
    getEntry(): E;
    abstract fetch(): Promise<ContentResource>;
    abstract find(link: string): C | NotFoundProvider;
}
export interface ProviderSettings {
    baseUrl: string;
}

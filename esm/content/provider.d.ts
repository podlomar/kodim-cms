import { Access } from "./access.js";
import { Entry } from "./entry.js";
import { Resource, Crumbs, NotFound, ForbiddenResource } from "./resource.js";
export interface ResourceProvider<C extends ResourceProvider<any> = any> {
    fetch(): Promise<Resource | NotFound>;
    find(link: string): C | NotFoundProvider | NoAccessProvider;
    search(...links: string[]): ResourceProvider;
    asset(fileName: string): string | null;
    findRepo(repoUrl: string): ResourceProvider | null;
    success(): this | null;
    reload(): Promise<void>;
}
export declare class NotFoundProvider implements ResourceProvider<never> {
    fetch(): Promise<NotFound>;
    find(link: string): this;
    search(): this;
    findRepo(repoUrl: string): null;
    asset(fileName: string): null;
    success(): null;
    reload(): Promise<void>;
}
export declare class NoAccessProvider<E extends Entry = Entry> implements ResourceProvider<never> {
    protected readonly entry: E;
    protected readonly settings: ProviderSettings;
    constructor(entry: E, settings: ProviderSettings);
    fetch(): Promise<ForbiddenResource>;
    find(link: string): this;
    search(): this;
    findRepo(repoUrl: string): null;
    asset(fileName: string): null;
    success(): this;
    reload(): Promise<void>;
}
export declare abstract class BaseResourceProvider<P extends ResourceProvider | null, E extends Entry, C extends ResourceProvider> implements ResourceProvider<C> {
    protected readonly entry: E;
    protected readonly parent: P;
    protected readonly position: number;
    protected readonly crumbs: Crumbs;
    protected readonly access: Access;
    protected readonly settings: ProviderSettings;
    constructor(parent: P, entry: E, position: number, crumbs: Crumbs, access: Access, settings: ProviderSettings);
    search(...[link, ...restLinks]: string[]): ResourceProvider;
    asset(fileName: string): string;
    success(): this;
    getEntry(): E;
    reload(): Promise<void>;
    abstract fetch(): Promise<Resource | NotFound>;
    abstract findRepo(repoUrl: string): ResourceProvider | null;
    abstract find(link: string): C | NotFoundProvider | NoAccessProvider;
}
export interface ProviderSettings {
    baseUrl: string;
}

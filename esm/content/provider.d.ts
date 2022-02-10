import { AccessCheck } from "./access-check.js";
import { Entry } from "./entry.js";
import { Crumbs, NotFound, Resource } from "./resource.js";
export interface ResourceProvider<C extends ResourceProvider<any> = any> {
    fetch(): Promise<Resource | NotFound>;
    find(link: string): C | NotFoundProvider;
    search(...links: string[]): ResourceProvider;
    asset(fileName: string): string | 'forbidden' | 'not-found';
    findRepo(repoUrl: string): ResourceProvider | null;
    success(): this | null;
    reload(): Promise<void>;
}
export declare class NotFoundProvider implements ResourceProvider<never> {
    fetch(): Promise<NotFound>;
    find(link: string): this;
    search(): this;
    findRepo(repoUrl: string): null;
    asset(fileName: string): 'not-found';
    success(): null;
    reload(): Promise<void>;
}
export declare abstract class BaseResourceProvider<P extends ResourceProvider | null, E extends Entry, C extends ResourceProvider> implements ResourceProvider<C> {
    protected readonly entry: E;
    protected readonly parent: P;
    protected readonly position: number;
    protected readonly crumbs: Crumbs;
    protected readonly accessCheck: AccessCheck;
    protected readonly settings: ProviderSettings;
    constructor(parent: P, entry: E, position: number, crumbs: Crumbs, accessCheck: AccessCheck, settings: ProviderSettings);
    search(...[link, ...restLinks]: string[]): ResourceProvider;
    asset(fileName: string): string;
    success(): this;
    getEntry(): E;
    reload(): Promise<void>;
    abstract fetch(): Promise<Resource | NotFound>;
    abstract findRepo(repoUrl: string): ResourceProvider | null;
    abstract find(link: string): C | NotFoundProvider;
}
export interface ProviderSettings {
    baseUrl: string;
}

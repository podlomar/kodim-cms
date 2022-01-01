import { ResourceProvider } from "./provider";
declare type ChildOf<T> = T extends ResourceProvider<infer C> ? C : never;
export interface Query {
    getProvider(): ResourceProvider | null;
    find(link: string): Query;
    search(...links: string[]): Query;
}
export declare class NotFoundQuery implements Query {
    getProvider(): null;
    find(link: string): this;
    search(...links: string[]): this;
}
export declare class SuccessQuery<P extends ResourceProvider = ResourceProvider> implements Query {
    private readonly provider;
    constructor(provider: P);
    getProvider(): P;
    find(link: string): SuccessQuery<ChildOf<P>> | NotFoundQuery;
    search(...links: string[]): SuccessQuery | NotFoundQuery;
}
export {};

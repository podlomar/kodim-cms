import { Entry } from "./entry.js";
import { Resource } from "./resource.js";
declare type SubEntry<T> = T extends Entry<any, any, any, any, infer S> ? S : any;
export interface Query<EntryType extends Entry<any, any, any, any, any> = Entry<any, any, any, any, any>> {
    find(link: string): OkQuery<SubEntry<EntryType>> | NotFoundQuery;
    search(...links: string[]): Query;
    fetch(): Promise<Resource<EntryType> | null>;
}
export declare class OkQuery<EntryType extends Entry<any, any, any, any, any>> implements Query<EntryType> {
    private entry;
    private constructor();
    static of<EntryType extends Entry<any, any, any, any, any>>(entry: EntryType): OkQuery<EntryType>;
    find(link: string): OkQuery<SubEntry<EntryType>> | NotFoundQuery;
    search(...[link, ...restLinks]: string[]): Query;
    fetch(): Promise<Resource<EntryType>>;
}
export declare class NotFoundQuery implements Query<never> {
    find(): NotFoundQuery;
    search(): NotFoundQuery;
    fetch(): Promise<null>;
}
export {};

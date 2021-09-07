import { Data } from './resource.js';
import { Query } from './tree-index.js';
export interface DataPayload {
    data: Data;
}
export interface ErrorPayload {
    errors: string[];
}
export declare type Payload = DataPayload | ErrorPayload;
export declare class ContentIndex {
    private readonly rootNode;
    private constructor();
    static load(rootFolder: string, baseUrl: string): Promise<ContentIndex>;
    fetch(query: Query): Promise<Payload>;
}

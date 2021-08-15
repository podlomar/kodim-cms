import { Resource } from './resource';
export interface DataPayload {
    resource: Resource;
}
export interface ErrorPayload {
    errors: string[];
}
export declare type Payload = DataPayload | ErrorPayload;
export declare class ContentIndex {
    private readonly baseUrl;
    private readonly rootNode;
    private constructor();
    static load(rootFolder: string, baseUrl: string): Promise<ContentIndex>;
    query(path: string): Promise<Payload>;
}

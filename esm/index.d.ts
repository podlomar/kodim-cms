import { RootEntry } from "./content/root.js";
import { OkQuery } from "./core/query.js";
export declare class KodimCms {
    readonly baseUrl: string;
    private readonly root;
    private constructor();
    static load(contentFolder: string, baseUrl: string): Promise<KodimCms>;
    query(): OkQuery<RootEntry>;
}

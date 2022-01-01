import { CoursesRootProvider } from "./content/content.js";
import { SuccessQuery } from "./content/query.js";
export declare class KodimCms {
    readonly baseUrl: string;
    private readonly coursesRoot;
    private constructor();
    static load(contentFolder: string, baseUrl: string): Promise<KodimCms>;
    query(): SuccessQuery<CoursesRootProvider>;
}

import { CoursesRootProvider } from "./content/content.js";
export declare class KodimCms {
    readonly baseUrl: string;
    private readonly coursesRoot;
    private constructor();
    static load(contentFolder: string, baseUrl: string): Promise<KodimCms>;
    getRoot(): CoursesRootProvider;
}

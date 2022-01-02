import { CoursesRootProvider, loadCoursesRoot } from "./content/content.js";
export class KodimCms {
    constructor(baseUrl, coursesRoot) {
        this.baseUrl = baseUrl;
        this.coursesRoot = coursesRoot;
    }
    static async load(contentFolder, baseUrl) {
        const root = await loadCoursesRoot(contentFolder, "kurzy");
        const cms = new KodimCms(baseUrl, root);
        return cms;
    }
    getRoot() {
        return new CoursesRootProvider(null, this.coursesRoot, 0, [], { baseUrl: this.baseUrl });
    }
}

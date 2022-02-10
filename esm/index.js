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
    getRoot(accessCheck) {
        return new CoursesRootProvider(null, this.coursesRoot, 0, [], accessCheck.step(this.coursesRoot), { baseUrl: this.baseUrl });
    }
}

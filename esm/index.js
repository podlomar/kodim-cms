import { RootLoader } from "./content/root.js";
import { OkQuery } from "./core/query.js";
export class KodimCms {
    constructor(baseUrl, root) {
        this.baseUrl = baseUrl;
        this.root = root;
    }
    static async load(contentFolder, baseUrl) {
        const rootEntry = await new RootLoader(contentFolder).loadOne('kurzy', 0);
        const cms = new KodimCms(baseUrl, rootEntry);
        return cms;
    }
    query() {
        return OkQuery.of(this.root);
    }
}

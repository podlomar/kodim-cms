import { createNotFound } from "./resource.js";
export class NotFoundProvider {
    async fetch() {
        return createNotFound();
    }
    find(link) {
        return this;
    }
    ;
    search() {
        return this;
    }
    findRepo(repoUrl) {
        return null;
    }
    asset(fileName) {
        return 'not-found';
    }
    success() {
        return null;
    }
    async reload() {
        return;
    }
}
export class BaseResourceProvider {
    constructor(parent, entry, position, crumbs, accessCheck, settings) {
        this.entry = entry;
        this.parent = parent;
        this.position = position;
        this.crumbs = crumbs;
        this.accessCheck = accessCheck;
        this.settings = settings;
    }
    search(...[link, ...restLinks]) {
        if (link === '') {
            return this;
        }
        const child = this.find(link);
        if (child.success() === null || restLinks.length === 0) {
            return child;
        }
        return child.search(...restLinks);
    }
    asset(fileName) {
        return `${this.entry.fsPath}/assets/${fileName}`;
    }
    success() {
        return this;
    }
    getEntry() {
        return this.entry;
    }
    async reload() {
        return;
    }
}

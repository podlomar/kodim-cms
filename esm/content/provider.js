import { createNotFound, createForbiddenResource } from "./resource.js";
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
export class NoAccessProvider {
    constructor(entry, allowedAssets, settings) {
        this.entry = entry;
        this.allowedAssets = allowedAssets;
        this.settings = settings;
    }
    async fetch() {
        return createForbiddenResource(this.entry, this.settings.baseUrl);
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
        if (this.allowedAssets.includes(fileName)) {
            return `${this.entry.location.fsPath}/assets/${fileName}`;
        }
        return 'forbidden';
    }
    success() {
        return this;
    }
    async reload() {
        return;
    }
}
export class BaseResourceProvider {
    constructor(parent, entry, position, crumbs, access, settings) {
        this.entry = entry;
        this.parent = parent;
        this.position = position;
        this.crumbs = crumbs;
        this.access = access;
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
        return `${this.entry.location.fsPath}/assets/${fileName}`;
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

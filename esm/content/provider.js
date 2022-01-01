export class BaseResourceProvider {
    constructor(parent, entry, position, crumbs, settings) {
        this.entry = entry;
        this.parent = parent;
        this.position = position;
        this.crumbs = crumbs;
        this.settings = settings;
    }
    search(...[link, ...restLinks]) {
        if (link === '') {
            return this;
        }
        const child = this.find(link);
        if (child === null || restLinks.length === 0) {
            return child;
        }
        return child.search(...restLinks);
    }
    asset(fileName) {
        return `${this.entry.fsPath}/assets/${fileName}`;
    }
    getEntry() {
        return this.entry;
    }
}

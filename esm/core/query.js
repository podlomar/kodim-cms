export class OkQuery {
    constructor(entry) {
        this.entry = entry;
    }
    static of(entry) {
        return new OkQuery(entry);
    }
    find(link) {
        const subEntry = this.entry.findSubEntry(link);
        if (subEntry === null) {
            return new NotFoundQuery();
        }
        return new OkQuery(subEntry);
    }
    search(...[link, ...restLinks]) {
        if (link === '') {
            return this;
        }
        const subEntry = this.entry.findSubEntry(link);
        if (subEntry === null) {
            return new NotFoundQuery();
        }
        const subQuery = new OkQuery(subEntry);
        return subQuery.search(...restLinks);
    }
    async fetch() {
        return this.entry.fetchResource();
    }
}
export class NotFoundQuery {
    find() {
        return this;
    }
    search() {
        return this;
    }
    async fetch() {
        return null;
    }
}

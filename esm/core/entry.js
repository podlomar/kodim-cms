export class Entry {
    constructor(parentEntry, common, index, crumbs) {
        this.parentEntry = parentEntry;
        this.common = common;
        this.index = index;
        this.crumbs = crumbs;
    }
    getCommon() {
        return this.common;
    }
    async fetchResource() {
        var _a;
        if (this.index === null) {
            return {
                status: 'ok',
                link: this.common.link,
                path: this.common.path,
                url: `${this.common.baseUrl}/content${this.common.path}`,
                title: this.common.link,
                crumbs: this.crumbs,
                content: { type: 'broken' },
            };
        }
        const fullAttrs = await this.fetchFullAttrs(this.index);
        return {
            status: 'ok',
            link: this.common.link,
            path: this.common.path,
            url: `${this.common.baseUrl}/content${this.common.path}`,
            title: (_a = this.index.title) !== null && _a !== void 0 ? _a : this.common.link,
            crumbs: this.crumbs,
            content: Object.assign({ type: 'full' }, fullAttrs)
        };
    }
    getRef() {
        var _a;
        if (this.index === null) {
            return {
                status: 'ok',
                link: this.common.link,
                path: this.common.path,
                url: `${this.common.baseUrl}/content${this.common.path}`,
                title: this.common.link,
                publicContent: 'broken',
            };
        }
        return {
            status: 'ok',
            link: this.common.link,
            path: this.common.path,
            url: `${this.common.baseUrl}/content${this.common.path}`,
            title: (_a = this.index.title) !== null && _a !== void 0 ? _a : this.common.link,
            publicContent: this.getPublicAttrs(this.index),
        };
    }
    getNextSibling() {
        if (this.parentEntry === null) {
            return null;
        }
        return this.parentEntry.findSubEntryByPos(this.common.position + 1);
    }
    getPrevSibling() {
        if (this.parentEntry === null) {
            return null;
        }
        return this.parentEntry.findSubEntryByPos(this.common.position - 1);
    }
    getParent() {
        return this.parentEntry;
    }
}
export class LeafEntry extends Entry {
    findSubEntry(link) {
        return null;
    }
}
export class InnerEntry extends Entry {
    constructor(parentEntry, common, index, crumbs) {
        super(parentEntry, common, index, crumbs);
        this.subEntries = [];
    }
    pushSubEntries(...subEntries) {
        this.subEntries.push(...subEntries);
    }
    findSubEntry(link) {
        var _a;
        return (_a = this.subEntries.find((subEntry) => subEntry.getCommon().link === link)) !== null && _a !== void 0 ? _a : null;
    }
    findSubEntryByPos(pos) {
        if (this.subEntries.length === 0) {
            return null;
        }
        if (pos < 0 || pos > (this.subEntries.length - 1)) {
            return null;
        }
        return this.subEntries[pos];
    }
}

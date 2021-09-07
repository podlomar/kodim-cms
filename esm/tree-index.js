import { promises as fs } from 'fs';
import path from 'path';
import yaml from 'yaml';
export class NodeLocation {
    constructor(fsPath, parentUrl, listName, link, title, crumbs) {
        this.link = link;
        this.parentUrl = parentUrl;
        this.listName = listName;
        this.fsPath = fsPath;
        this.title = title;
        this.crumbs = crumbs;
    }
    static createRootLocation(fsPath, baseUrl) {
        return new NodeLocation(fsPath, baseUrl, '', '', '', []);
    }
    get url() {
        if (this.listName === '') {
            return this.parentUrl;
        }
        return `${this.parentUrl}/${this.listName}/${this.link}`;
    }
    createChildLocation(fileName, index, listName) {
        var _a;
        const link = (_a = index.link) !== null && _a !== void 0 ? _a : fileName;
        const crumbs = [
            ...this.crumbs,
            {
                link: this.link,
                title: this.title,
                url: this.url,
            },
        ];
        return new NodeLocation(path.join(this.fsPath, fileName), this.url, listName, link, index.title, crumbs);
    }
}
;
;
export class IndexNode {
    constructor(location, index) {
        this.location = location;
        this.index = index;
    }
    async fetchList(name, expand) {
        const nodes = this.getList(name);
        if (nodes === null) {
            return null;
        }
        if (expand.includes(name)) {
            return Promise.all(nodes.map((node) => node.fetchResource(expand)));
        }
        return nodes.map((node) => node.location.url);
    }
    getResourceBase(type) {
        return {
            type,
            url: this.location.url,
            title: this.index.title,
            link: this.location.link,
            crumbs: this.location.crumbs,
        };
    }
    async fetch(query) {
        if (query.steps.length === 0) {
            const resource = await this.fetchResource(query.expand);
            return resource;
        }
        const step = query.steps[0];
        const list = this.getList(step.list);
        if (list === null) {
            return null;
        }
        if (step.link === null) {
            return this.fetchList(step.list, query.expand);
        }
        if (list === null) {
            return null;
        }
        const node = list.find((n) => n.location.link === step.link);
        if (node === undefined) {
            return null;
        }
        return node.fetch({
            steps: query.steps.slice(1),
            expand: query.expand,
        });
    }
}
export const loadYamlFile = async (filePath) => {
    const indexContent = await fs.readFile(filePath, 'utf-8');
    return yaml.parse(indexContent);
};

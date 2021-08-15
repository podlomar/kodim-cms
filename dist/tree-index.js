var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { promises as fs } from 'fs';
import path from 'path';
import yaml from 'yaml';
import collect from 'collect.js';
export class NodeLocation {
    constructor(fsPath, link, crumbs) {
        this.link = link;
        this.fsPath = fsPath;
        this.crumbs = crumbs;
    }
    get path() {
        return collect(this.crumbs).last().path;
    }
    createChildLocation(fileName, index) {
        var _a;
        const link = (_a = index.link) !== null && _a !== void 0 ? _a : fileName;
        const crumbs = [
            ...this.crumbs,
            {
                path: `${this.path === '/' ? '' : this.path}/${link}`,
                title: index.title,
            },
        ];
        return new NodeLocation(path.join(this.fsPath, fileName), link, crumbs);
    }
}
export class IndexNode {
    constructor(location, index) {
        this.location = location;
        this.index = index;
    }
    getResourceRef(baseUrl) {
        return {
            targetUrl: `${baseUrl}${this.location.path}`,
            path: this.location.path,
            title: this.index.title,
        };
    }
    getResourceBase(baseUrl, type) {
        const ref = this.getResourceRef(baseUrl);
        return {
            type,
            link: this.location.link,
            path: ref.path,
            url: ref.targetUrl,
            title: ref.title,
            crumbs: this.location.crumbs,
        };
    }
    findNode(links) {
        if (links[0] === this.location.link) {
            return this;
        }
        return null;
    }
}
export class ContainerIndex extends IndexNode {
    constructor(location, index, children = []) {
        super(location, index);
        this.children = children;
    }
    getChildrenRefs(baseUrl) {
        return this.children.map((node) => node.getResourceRef(baseUrl));
    }
    findNode(links) {
        const thisNode = super.findNode(links);
        if (links.length === 1) {
            return thisNode;
        }
        if (thisNode === null) {
            return null;
        }
        const subLinks = links.slice(1);
        if (subLinks[0] === '') {
            return thisNode;
        }
        if (this.children.length === 0) {
            return null;
        }
        for (const child of this.children) {
            const node = child.findNode(subLinks);
            if (node !== null) {
                return node;
            }
        }
        return null;
    }
}
export const loadYamlFile = (filePath) => __awaiter(void 0, void 0, void 0, function* () {
    const indexContent = yield fs.readFile(filePath, 'utf-8');
    return yaml.parse(indexContent);
});

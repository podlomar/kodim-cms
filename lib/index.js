"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentIndex = void 0;
const root_loader_js_1 = require("./loaders/root-loader.js");
class ContentIndex {
    constructor(baseUrl, rootNode) {
        this.baseUrl = baseUrl;
        this.rootNode = rootNode;
    }
    static async load(rootFolder, baseUrl) {
        const rootNode = await root_loader_js_1.loadRootNode(rootFolder);
        return new ContentIndex(baseUrl, rootNode);
    }
    async query(path) {
        const links = path.split('/');
        const node = this.rootNode.findNode(links);
        if (node === null) {
            return {
                errors: ['not-found'],
            };
        }
        const resource = await node.loadResource(this.baseUrl);
        return { resource };
    }
}
exports.ContentIndex = ContentIndex;

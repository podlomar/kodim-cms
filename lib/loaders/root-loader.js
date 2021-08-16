"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadRootNode = exports.RootNode = void 0;
const path_1 = require("path");
const tree_index_js_1 = require("../tree-index.js");
const section_loader_js_1 = require("./section-loader.js");
class RootNode extends tree_index_js_1.ContainerIndex {
    constructor(location, index, sections) {
        super(location, index, sections);
    }
    async loadResource(baseUrl) {
        const base = this.getResourceBase(baseUrl, 'root');
        return Object.assign(Object.assign({}, base), { sections: this.getChildrenRefs(baseUrl) });
    }
}
exports.RootNode = RootNode;
const loadRootNode = async (rootFolder) => {
    const index = (await tree_index_js_1.loadYamlFile(path_1.default.join(rootFolder, 'index.yml')));
    const location = new tree_index_js_1.NodeLocation(rootFolder, '', [
        {
            title: '',
            path: '/',
        },
    ]);
    const sections = await Promise.all(index.sections.map((fileName) => section_loader_js_1.loadSectionNode(location, fileName)));
    return new RootNode(location, index, sections);
};
exports.loadRootNode = loadRootNode;

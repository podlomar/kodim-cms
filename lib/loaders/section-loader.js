"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadSectionNode = exports.SectionNode = void 0;
const path_1 = require("path");
const tree_index_js_1 = require("../tree-index.js");
const course_loader_js_1 = require("./course-loader.js");
class SectionNode extends tree_index_js_1.ContainerIndex {
    constructor(location, index, courses) {
        super(location, index, courses);
    }
    async loadResource(baseUrl) {
        const base = this.getResourceBase(baseUrl, 'section');
        const index = this.index;
        return Object.assign(Object.assign({}, base), { lead: index.lead, courses: this.getChildrenRefs(baseUrl) });
    }
}
exports.SectionNode = SectionNode;
const loadSectionNode = async (parentLocation, fileName) => {
    const index = (await tree_index_js_1.loadYamlFile(path_1.default.join(parentLocation.fsPath, fileName, 'index.yml')));
    const location = parentLocation.createChildLocation(fileName, index);
    const courses = index.courses === undefined
        ? []
        : await Promise.all(index.courses.map((fileName) => course_loader_js_1.loadCourseNode(location, fileName)));
    return new SectionNode(location, index, courses);
};
exports.loadSectionNode = loadSectionNode;

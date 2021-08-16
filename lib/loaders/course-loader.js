"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadCourseNode = exports.CourseNode = void 0;
const path_1 = require("path");
const tree_index_js_1 = require("../tree-index.js");
const chapter_loader_js_1 = require("./chapter-loader.js");
class CourseNode extends tree_index_js_1.ContainerIndex {
    constructor(location, index, chapters) {
        super(location, index, chapters);
    }
    async loadResource(baseUrl) {
        const base = this.getResourceBase(baseUrl, 'course');
        const index = this.index;
        return Object.assign(Object.assign({}, base), { lead: index.lead, chapters: this.getChildrenRefs(baseUrl) });
    }
}
exports.CourseNode = CourseNode;
const loadCourseNode = async (parentLocation, fileName) => {
    const index = (await tree_index_js_1.loadYamlFile(path_1.default.join(parentLocation.fsPath, fileName, 'index.yml')));
    const location = parentLocation.createChildLocation(fileName, index);
    const chapters = index.chapters === undefined
        ? []
        : await Promise.all(index.chapters.map((fileName) => chapter_loader_js_1.loadChapterNode(location, fileName)));
    return new CourseNode(location, index, chapters);
};
exports.loadCourseNode = loadCourseNode;

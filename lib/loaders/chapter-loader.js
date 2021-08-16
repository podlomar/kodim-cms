"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadChapterNode = exports.ChapterNode = void 0;
const path_1 = require("path");
const tree_index_js_1 = require("../tree-index.js");
const lesson_loader_js_1 = require("./lesson-loader.js");
class ChapterNode extends tree_index_js_1.ContainerIndex {
    constructor(location, index, lessons) {
        super(location, index, lessons);
    }
    async loadResource(baseUrl) {
        const base = this.getResourceBase(baseUrl, 'chapter');
        const index = this.index;
        return Object.assign(Object.assign({}, base), { lead: index.lead, lessons: this.getChildrenRefs(baseUrl) });
    }
}
exports.ChapterNode = ChapterNode;
const loadChapterNode = async (parentLocation, fileName) => {
    const index = (await tree_index_js_1.loadYamlFile(path_1.default.join(parentLocation.fsPath, fileName, 'index.yml')));
    const location = parentLocation.createChildLocation(fileName, index);
    const lessons = index.lessons === undefined
        ? []
        : await Promise.all(index.lessons.map((fileName, idx) => lesson_loader_js_1.loadLessonNode(location, fileName, idx + 1)));
    return new ChapterNode(location, index, lessons);
};
exports.loadChapterNode = loadChapterNode;

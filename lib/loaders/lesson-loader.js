"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadLessonNode = exports.LessonNode = void 0;
const fs_1 = require("fs");
const unified_1 = require("unified");
const remark_parse_1 = require("remark-parse");
const remark_directive_1 = require("remark-directive");
const remark_frontmatter_1 = require("remark-frontmatter");
const remark_rehype_1 = require("remark-rehype");
const rehype_stringify_1 = require("rehype-stringify");
const mdast_builder_1 = require("mdast-builder");
const line_reader_1 = require("line-reader");
const path_1 = require("path");
const yaml_1 = require("yaml");
const tree_index_js_1 = require("../tree-index.js");
const loadLesson = async (lessonPath) => {
    const processor = unified_1.unified()
        .use(remark_parse_1.default)
        .use(remark_frontmatter_1.default)
        .use(remark_directive_1.default)
        .use(remark_rehype_1.default)
        .use(rehype_stringify_1.default);
    const text = await fs_1.promises.readFile(lessonPath, 'utf-8');
    const tree = processor.parse(text);
    const sections = [];
    let currentTitle = '';
    let currentRoot = mdast_builder_1.default.root();
    for (const child of tree.children) {
        if (child.type === 'heading') {
            const hastRoot = processor.runSync(currentRoot);
            const html = processor.stringify(hastRoot);
            sections.push({
                title: currentTitle,
                html,
            });
            currentTitle = child.children[0].value;
            currentRoot = mdast_builder_1.default.root();
        }
        else {
            currentRoot.children.push(child);
        }
    }
    if (currentRoot.children.length > 0) {
        const hastRoot = processor.runSync(currentRoot);
        const html = processor.stringify(hastRoot);
        sections.push({
            title: currentTitle,
            html,
        });
    }
    console.log('result', sections);
    return Promise.resolve(sections);
};
class LessonNode extends tree_index_js_1.IndexNode {
    constructor(location, frontMatter, num) {
        super(location, frontMatter);
        this.num = num;
    }
    getResourceRef(baseUrl) {
        const baseRef = super.getResourceRef(baseUrl);
        const frontMatter = this.index;
        return Object.assign(Object.assign({}, baseRef), { lead: frontMatter.lead, num: this.num });
    }
    async loadResource(baseUrl) {
        const sections = await loadLesson(path_1.default.join(this.location.fsPath, 'lesson.md'));
        const base = this.getResourceBase(baseUrl, 'lesson');
        const frontMatter = this.index;
        return Object.assign(Object.assign({}, base), { lead: frontMatter.lead, num: this.num, sections });
    }
}
exports.LessonNode = LessonNode;
const loadFrontMatter = async (filePath) => new Promise((resolve) => {
    let inside = false;
    let lines = '';
    line_reader_1.default.eachLine(filePath, (line) => {
        if (inside) {
            if (line.startsWith('---')) {
                resolve(yaml_1.default.parse(lines));
                return false;
            }
            lines += `${line}\n`;
            return true;
        }
        if (line.startsWith('---')) {
            inside = true;
        }
        return true;
    });
});
const loadLessonNode = async (parentLocation, fileName, num) => {
    const frontMatter = await loadFrontMatter(path_1.default.join(parentLocation.fsPath, fileName, 'lesson.md'));
    const location = parentLocation.createChildLocation(fileName, frontMatter);
    return new LessonNode(location, frontMatter, num);
};
exports.loadLessonNode = loadLessonNode;

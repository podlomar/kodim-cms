import { promises as fs } from "fs";
import path from 'path';
import { unified } from "unified";
import markdown from "remark-parse";
import directive from "remark-directive";
import rehype from "remark-rehype";
import stringify from "rehype-stringify";
import { InnerEntry } from '../core/entry.js';
import { EntryLoader } from '../core/loader.js';
import { ExerciseLoader } from "./exercise.js";
import { MarkdownProcessor } from "../markdown.js";
import { buildExcTransform } from "../markdown-transforms.js";
export const processor = unified()
    .use(markdown)
    .use(directive)
    .use(rehype)
    .use(stringify);
export const parseSection = async (file) => {
    const text = await fs.readFile(file, "utf-8");
    const tree = processor.parse(text);
    let title = null;
    let excs = [];
    for (const node of tree.children) {
        if (node.type === "heading" && node.depth === 2) {
            const content = node.children[0];
            if (content.type === "text" && title === null) {
                title = content.value;
            }
        }
        if (node.type === "leafDirective" && node.name === "exc") {
            const content = node.children[0];
            if (content.type === "text") {
                excs.push(content.value.trim());
            }
        }
    }
    if (title === null) {
        title = path.basename(file);
    }
    return { title, excs };
};
export class LessonSectionLoader extends EntryLoader {
    async loadEntry(common, index, position) {
        const sectionEntry = new LessonSectionEntry(this.parentEntry, common, index);
        const exercises = await new ExerciseLoader(sectionEntry).loadMany(index.excs);
        sectionEntry.pushSubEntries(...exercises);
        return sectionEntry;
    }
}
export class LessonSectionEntry extends InnerEntry {
    constructor(parentEntry, common, index) {
        super(parentEntry, common, index, []);
        this.markdownProcessor = new MarkdownProcessor(() => '').useTransform('exc', buildExcTransform(this));
    }
    getPublicAttrs() {
        return {};
    }
    async fetchFullAttrs(index) {
        var _a, _b, _c, _d;
        const jsml = await this.markdownProcessor.process(`${this.common.fsPath}.md`);
        const next = (_b = (_a = this.getNextSibling()) === null || _a === void 0 ? void 0 : _a.getRef()) !== null && _b !== void 0 ? _b : null;
        const prev = (_d = (_c = this.getPrevSibling()) === null || _c === void 0 ? void 0 : _c.getRef()) !== null && _d !== void 0 ? _d : null;
        return { jsml, next, prev };
    }
}

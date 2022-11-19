import { promises as fs } from "fs";
import path from 'path';
import { buildAssetPath, createBaseResource } from "./resource.js";
import { BaseResourceProvider, NotFoundProvider } from "./provider.js";
import { unified } from "unified";
import markdown from "remark-parse";
import directive from "remark-directive";
import rehype from "remark-rehype";
import stringify from "rehype-stringify";
import { toString as mdastToString } from 'mdast-util-to-string';
import { createBaseEntry, createBrokenEntry } from "./entry.js";
import { ExerciseProvider, loadExercise } from "./exercise.js";
import { findChild } from "./content-node.js";
import { MarkdownProcessor } from "../markdown.js";
import { buildExcTransform } from "../markdown-transforms.js";
export const processor = unified()
    .use(markdown)
    .use(directive)
    .use(rehype)
    .use(stringify);
export const parseSection = async (file) => {
    try {
        const text = await fs.readFile(file, "utf-8");
        const tree = processor.parse(text);
        let title = null;
        let excs = [];
        for (const node of tree.children) {
            if (node.type === "heading" && node.depth === 2) {
                title = mdastToString(node);
            }
            else if (node.type === "leafDirective" && node.name === "exc") {
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
    }
    catch (err) {
        const { code } = err;
        if (code === 'ENOENT') {
            return 'not-found';
        }
        else {
            throw err;
        }
    }
};
export const loadLessonSection = async (parentBase, folderName) => {
    const index = await parseSection(`${parentBase.fsPath}/${folderName}.md`);
    if (index === 'not-found') {
        return createBrokenEntry(parentBase, folderName);
    }
    const baseEntry = createBaseEntry(parentBase, index, folderName);
    let excsCount = 0;
    const exercises = await Promise.all(index.excs.map((link, idx) => loadExercise(baseEntry, link, excsCount + idx)));
    return Object.assign(Object.assign({ nodeType: 'inner' }, baseEntry), { props: {}, subEntries: exercises });
};
export class LessonSectionProvider extends BaseResourceProvider {
    constructor(parent, entry, position, crumbs, accessCheck, settings) {
        super(parent, entry, position, crumbs, accessCheck, settings);
        this.buildAssetPath = (fileName) => buildAssetPath(fileName, path.join(this.entry.path, '..'), this.settings.baseUrl);
        this.markdownProcessor = new MarkdownProcessor(this.buildAssetPath).useTransform('exc', buildExcTransform(this));
        ;
    }
    async fetch() {
        const baseResource = createBaseResource(this.entry, this.crumbs, this.settings.baseUrl);
        if (!this.accessCheck.accepts()) {
            return Object.assign(Object.assign({}, baseResource), { status: 'forbidden', content: {
                    type: this.entry.nodeType === 'broken' ? 'broken' : 'public',
                } });
        }
        if (this.entry.nodeType === 'broken') {
            return Object.assign(Object.assign({}, createBaseResource(this.entry, this.crumbs, this.settings.baseUrl)), { status: 'ok', content: {
                    type: 'broken',
                } });
        }
        const next = this.parent.getNextSection(this.position);
        const prev = this.parent.getPrevSection(this.position);
        const jsml = await this.markdownProcessor.process(`${this.entry.fsPath}.md`);
        return Object.assign(Object.assign({}, createBaseResource(this.entry, this.crumbs, this.settings.baseUrl)), { status: 'ok', content: {
                type: 'full',
                jsml,
                next,
                prev,
            } });
    }
    find(link) {
        if (!this.accessCheck.accepts()) {
            return new NotFoundProvider();
        }
        if (this.entry.nodeType === 'broken') {
            return new NotFoundProvider();
        }
        const result = findChild(this.entry.subEntries, link);
        if (result === null) {
            return new NotFoundProvider();
        }
        return new ExerciseProvider(this, result.child, result.pos, [...this.crumbs, {
                title: this.entry.title,
                path: this.entry.path
            }], this.accessCheck.step(result.child), this.settings);
    }
    findProvider(link) {
        if (this.entry.nodeType === 'broken') {
            return null;
        }
        const result = findChild(this.entry.subEntries, link);
        if (result === null) {
            return null;
        }
        return new ExerciseProvider(this, result.child, result.pos, [...this.crumbs, {
                title: this.entry.title,
                path: this.entry.path
            }], this.accessCheck.step(result.child), this.settings);
    }
    findRepo(repoUrl) {
        return null;
    }
}

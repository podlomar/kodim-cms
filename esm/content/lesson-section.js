import { promises as fs } from "fs";
import path from 'path';
import { buildAssetPath, createBaseResource } from "./resource.js";
import { BaseResourceProvider, NotFoundProvider } from "./provider.js";
import { unified } from "unified";
import markdown from "remark-parse";
import directive from "remark-directive";
import rehype from "remark-rehype";
import stringify from "rehype-stringify";
import { createChildLocation, createBaseEntry } from "./entry.js";
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
    const text = await fs.readFile(file, "utf-8");
    const tree = processor.parse(text);
    let title = "";
    let excs = [];
    for (const node of tree.children) {
        if (node.type === "heading" && node.depth === 2) {
            const content = node.children[0];
            if (content.type === "text") {
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
    return { title, excs };
};
export const loadLessonSection = async (parentLocation, folderName) => {
    const index = await parseSection(`${parentLocation.fsPath}/${folderName}.md`);
    const location = createChildLocation(parentLocation, folderName);
    let excsCount = 0;
    const exercises = await Promise.all(index.excs.map((link, idx) => loadExercise(location, link, excsCount + idx)));
    return Object.assign(Object.assign({ nodeType: 'inner' }, createBaseEntry(location, folderName, {})), { subEntries: exercises });
};
export class LessonSectionProvider extends BaseResourceProvider {
    constructor(parent, entry, position, crumbs, access, settings) {
        super(parent, entry, position, crumbs, access, settings);
        this.buildAssetPath = (fileName) => buildAssetPath(fileName, path.join(this.entry.location.path, '..'), this.settings.baseUrl);
        this.markdownProcessor = new MarkdownProcessor(this.buildAssetPath).useTransform('exc', buildExcTransform(this));
        ;
    }
    async fetch() {
        const baseResource = createBaseResource(this.entry, this.crumbs, this.settings.baseUrl);
        if (!this.access.accepts()) {
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
        const jsml = await this.markdownProcessor.process(`${this.entry.location.fsPath}.md`);
        return Object.assign(Object.assign({}, createBaseResource(this.entry, this.crumbs, this.settings.baseUrl)), { status: 'ok', content: {
                type: 'full',
                jsml,
                next,
                prev,
            } });
    }
    find(link) {
        if (!this.access.accepts()) {
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
                path: this.entry.location.path
            }], this.access.step(result.child.link), this.settings);
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
                path: this.entry.location.path
            }], this.access.step(result.child.link), this.settings);
    }
    findRepo(repoUrl) {
        return null;
    }
}

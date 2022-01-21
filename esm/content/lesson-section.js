import { promises as fs } from "fs";
import path from 'path';
import { buildAssetPath, createFailedResource, createSuccessResource } from "./resource.js";
import { BaseResourceProvider, NotFoundProvider } from "./provider.js";
import { unified } from "unified";
import markdown from "remark-parse";
import directive from "remark-directive";
import rehype from "remark-rehype";
import stringify from "rehype-stringify";
import { createSuccessEntry } from "./entry.js";
import { ExerciseProvider, loadExercise } from "./exercise.js";
import { findChild } from "./content-node.js";
import { MarkdownProcessor } from "../markdown.js";
import { buildExcTransform } from "../markdown-transforms.js";
;
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
export const loadLessonSection = async (parentEntry, folderName) => {
    const index = await parseSection(`${parentEntry.fsPath}/${folderName}.md`);
    const baseEntry = createSuccessEntry(parentEntry, folderName, index.title);
    let excsCount = 0;
    const exercises = await Promise.all(index.excs.map((link, idx) => loadExercise(baseEntry, link, excsCount + idx)));
    return Object.assign(Object.assign({}, baseEntry), { exercises });
};
export class LessonSectionProvider extends BaseResourceProvider {
    constructor(parent, entry, position, crumbs, settings) {
        super(parent, entry, position, crumbs, settings);
        this.buildAssetPath = (fileName) => buildAssetPath(fileName, path.join(this.entry.path, '..'), this.settings.baseUrl);
        this.markdownProcessor = new MarkdownProcessor(this.buildAssetPath).useTransform('exc', buildExcTransform(this));
        ;
    }
    async fetch() {
        if (this.entry.type === 'failed') {
            return createFailedResource(this.entry, this.settings.baseUrl);
        }
        const next = this.parent.getNextSection(this.position);
        const prev = this.parent.getPrevSection(this.position);
        const jsml = await this.markdownProcessor.process(`${this.entry.fsPath}.md`);
        return Object.assign(Object.assign({}, createSuccessResource(this.entry, this.crumbs, this.settings.baseUrl)), { jsml,
            next,
            prev });
    }
    find(link) {
        if (this.entry.type === 'failed') {
            return new NotFoundProvider();
        }
        const result = findChild(this.entry.exercises, link);
        if (result === null) {
            return new NotFoundProvider();
        }
        return new ExerciseProvider(this, result.child, result.pos, [...this.crumbs, {
                title: this.entry.title,
                path: this.entry.path
            }], this.settings);
    }
    findRepo(repoUrl) {
        return null;
    }
}

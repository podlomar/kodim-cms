import path from "path";
import { existsSync } from "fs";
import yaml from "yaml";
import lineReader from "line-reader";
import { el, getChildren, getTag, isElement } from "../jsml.js";
import { createFailedEntry, createSuccessEntry } from "./entry.js";
import { BaseResourceProvider, NotFoundProvider } from "./provider.js";
import { MarkdownProcessor } from "../markdown.js";
import { createFailedResource, createSuccessResource } from "./resource.js";
;
;
const loadFrontMatter = async (filePath) => new Promise((resolve, reject) => {
    let inside = false;
    let lines = "";
    lineReader.eachLine(filePath, (line) => {
        if (inside) {
            if (line.startsWith("---")) {
                resolve(yaml.parse(lines));
                return false;
            }
            lines += `${line}\n`;
            return true;
        }
        if (line.startsWith("---")) {
            inside = true;
        }
        return true;
    }, reject);
});
const loadAssign = async (filePath) => new Promise((resolve, reject) => {
    let opened = 0;
    let lines = "";
    lineReader.eachLine(filePath, (line, last) => {
        lines += `${line}\n`;
        if (last) {
            resolve(lines);
        }
        const trimmed = line.trim();
        if (trimmed === ":::") {
            opened -= 1;
            if (opened === 0) {
                resolve(lines);
                return false;
            }
            return true;
        }
        if (trimmed.startsWith(":::")) {
            opened += 1;
        }
        return true;
    }, reject);
});
const getAssignFilePath = (fsPath) => {
    const standalone = `${fsPath}.md`;
    if (existsSync(standalone)) {
        return standalone;
    }
    const inFolder = `${fsPath}/assign.md`;
    if (existsSync(inFolder)) {
        return inFolder;
    }
    return null;
};
export const loadExercise = async (parentEntry, entryPath, pos) => {
    const fsPath = path.join(parentEntry.fsPath, '..', entryPath);
    const link = entryPath.replace('/', ':');
    const assignPath = getAssignFilePath(fsPath);
    if (assignPath === null) {
        return createFailedEntry(parentEntry, link, fsPath);
    }
    const frontMatter = await loadFrontMatter(assignPath);
    const baseEntry = createSuccessEntry(parentEntry, link, frontMatter.title, fsPath);
    return Object.assign(Object.assign({}, baseEntry), { demand: frontMatter.demand, num: pos + 1 });
};
export class ExerciseProvider extends BaseResourceProvider {
    constructor(parent, entry, position, crumbs, settings) {
        super(parent, entry, position, crumbs, settings);
        this.buildAssetPath = (fileName) => {
            const baseUrl = this.settings.baseUrl;
            return `${baseUrl}/assets${this.entry.path}/${fileName}`;
        };
        this.markdownProcessor = new MarkdownProcessor(this.buildAssetPath);
    }
    find(link) {
        return new NotFoundProvider();
    }
    async fetch() {
        var _a;
        if (this.entry.type === 'failed') {
            return createFailedResource(this.entry, this.settings.baseUrl);
        }
        const assignPath = getAssignFilePath(this.entry.fsPath);
        if (assignPath === null) {
            throw new Error('no assign file found');
        }
        const jsml = await this.markdownProcessor.process(assignPath);
        console.log(jsml);
        const firstNode = jsml[0];
        const secondNode = (_a = jsml[1]) !== null && _a !== void 0 ? _a : '';
        const assignJsml = isElement(firstNode) && getTag(firstNode) === 'assign'
            ? getChildren(firstNode)
            : jsml;
        const solutionJsml = isElement(secondNode) && getTag(secondNode) === 'solution'
            ? getChildren(secondNode)
            : [];
        return Object.assign(Object.assign({}, createSuccessResource(this.entry, this.crumbs, this.settings.baseUrl)), { demand: this.entry.demand, title: this.entry.title, num: this.entry.num, assignJsml,
            solutionJsml });
    }
    async fetchAssign() {
        const assignPath = getAssignFilePath(this.entry.fsPath);
        if (assignPath === null) {
            throw new Error('no assign file found');
        }
        if (this.entry.type === 'failed') {
            return ['error'];
        }
        const assignText = await loadAssign(assignPath);
        const jsml = await this.markdownProcessor.processString(assignText);
        const attrs = {
            num: this.entry.num,
            title: this.entry.title,
            path: this.entry.path,
            demand: this.entry.demand
        };
        const firstNode = jsml[0];
        const content = isElement(firstNode) && getTag(firstNode) === 'assign'
            ? getChildren(firstNode)
            : jsml;
        return el('exc', attrs, ...content);
    }
    findRepo(repoUrl) {
        return null;
    }
}

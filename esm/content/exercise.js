import path from "path";
import { existsSync } from "fs";
import yaml from "yaml";
import lineReader from "line-reader";
import { el, getChildren, getTag, isElement } from "../jsml.js";
import { createFailedEntry, createSuccessEntry } from "./entry.js";
import { BaseResourceProvider, NotFoundProvider } from "./provider.js";
import { MarkdownProcessor } from "../markdown.js";
import { createNotFound } from "./resource.js";
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
        console.log('line', line);
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
    console.log('assingPath', assignPath);
    const frontMatter = await loadFrontMatter(assignPath);
    console.log('frontMatter', frontMatter);
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
    async fetch() {
        return createNotFound();
    }
    find(link) {
        return new NotFoundProvider();
    }
    async fetchEntry() {
        // const filePath = path.join(
        //   this.parent.location.fsPath,
        //   'assign.md',
        // );
        // const assignHtml = await readAssignFile(`${filePath}/assign.md`);
        // return {
        //   ...createBaseEntry(this.location),
        //   demand: this.frontMatter.demand,
        //   assignHtml,
        //   solutionHtml: "<p>solution</p>",
        // };
        // @ts-ignore
        return null;
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

import path from "path";
import { existsSync } from "fs";
import yaml from "yaml";
import lineReader from "line-reader";
import { el, getChildren, getTag, isElement } from "../jsml.js";
import { createBaseEntry, createBrokenEntry } from "./entry.js";
import { BaseResourceProvider, NotFoundProvider } from "./provider.js";
import { MarkdownProcessor } from "../markdown.js";
import { createBaseResource } from "./resource.js";
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
const getExcFilePath = (fsPath) => {
    const standalone = `${fsPath}.md`;
    if (existsSync(standalone)) {
        return standalone;
    }
    const inFolder = `${fsPath}/exercise.md`;
    if (existsSync(inFolder)) {
        return inFolder;
    }
    return null;
};
export const loadExercise = async (parentBase, link, pos) => {
    const fsPath = path.join(parentBase.fsPath, '..', link.replace('>', '/'));
    const assignPath = getExcFilePath(fsPath);
    if (assignPath === null) {
        return createBrokenEntry(parentBase, link);
    }
    const frontMatter = await loadFrontMatter(assignPath);
    return Object.assign(Object.assign({ nodeType: 'leaf' }, createBaseEntry(parentBase, frontMatter, link, fsPath)), { props: {
            demand: frontMatter.demand,
            num: pos + 1,
            offerSolution: frontMatter.offerSolution || false,
        } });
};
export class ExerciseProvider extends BaseResourceProvider {
    constructor(parent, entry, position, crumbs, accessCheck, settings) {
        super(parent, entry, position, crumbs, accessCheck, settings);
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
        const baseResource = createBaseResource(this.entry, this.crumbs, this.settings.baseUrl);
        if (!this.accessCheck.accepts()) {
            return Object.assign(Object.assign({}, baseResource), { status: 'forbidden', content: {
                    type: this.entry.nodeType === 'broken' ? 'broken' : 'public',
                } });
        }
        if (this.entry.nodeType === 'broken') {
            return Object.assign(Object.assign({}, baseResource), { status: 'ok', content: {
                    type: 'broken',
                } });
        }
        const assignPath = getExcFilePath(this.entry.fsPath);
        if (assignPath === null) {
            return Object.assign(Object.assign({}, baseResource), { status: 'ok', content: {
                    type: 'broken',
                } });
        }
        const jsml = await this.markdownProcessor.process(assignPath);
        const firstNode = jsml[0];
        const secondNode = (_a = jsml[1]) !== null && _a !== void 0 ? _a : '';
        const assignJsml = isElement(firstNode) && getTag(firstNode) === 'assign'
            ? getChildren(firstNode)
            : jsml;
        const solutionJsml = isElement(secondNode) && getTag(secondNode) === 'solution'
            ? getChildren(secondNode)
            : [];
        return Object.assign(Object.assign({}, baseResource), { status: 'ok', content: {
                type: 'full',
                demand: this.entry.props.demand,
                num: this.entry.props.num,
                offerSolution: this.entry.props.offerSolution,
                assignJsml,
                solutionJsml,
            } });
    }
    async fetchAssign() {
        const excPath = getExcFilePath(this.entry.fsPath);
        if (excPath === null || this.entry.nodeType === 'broken') {
            return el('excerr', { link: this.entry.link });
        }
        const assignText = await loadAssign(excPath);
        const jsml = await this.markdownProcessor.processString(assignText);
        const attrs = {
            num: this.entry.props.num,
            title: this.entry.title,
            link: this.entry.link,
            path: this.accessCheck.accepts() ? this.entry.path : 'forbidden',
            demand: this.entry.props.demand,
            offerSolution: this.entry.props.offerSolution,
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

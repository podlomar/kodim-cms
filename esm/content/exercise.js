import path from "path";
import { existsSync } from "fs";
import yaml from "yaml";
import lineReader from "line-reader";
import { el, getChildren, getTag, isElement } from "../jsml.js";
import { createBaseEntry, createBrokenEntry } from "./entry.js";
import { BaseResourceProvider, NotFoundProvider } from "./provider.js";
import { MarkdownProcessor } from "../markdown.js";
import { createBaseResource } from "./resource.js";
const loadFrontMatter = async (filePath) => new Promise((resolve, reject) => {
    let inside = false;
    let lines = "";
    lineReader.eachLine(filePath, (line) => {
        if (inside) {
            if (line.trim().startsWith("---")) {
                resolve(yaml.parse(lines));
                return false;
            }
            lines += `${line}\n`;
            return true;
        }
        if (line.trim().startsWith("---")) {
            inside = true;
        }
        return true;
    }, reject);
});
const loadExerciseParts = async (filePath) => new Promise((resolve, reject) => {
    const parts = {
        assign: '',
        solution: null,
    };
    lineReader.eachLine(filePath, (line, last) => {
        var _a;
        if (line.trim() === "---solution") {
            if (last) {
                resolve(parts);
            }
            else {
                parts.solution = '';
            }
            return true;
        }
        if (parts.solution === null) {
            parts.assign += `${line}\n`;
        }
        else {
            parts.solution += `${line}\n`;
        }
        if (last) {
            if (((_a = parts.solution) === null || _a === void 0 ? void 0 : _a.trim()) === '') {
                parts.solution = null;
            }
            resolve(parts);
            return true;
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
    return Object.assign(Object.assign({ nodeType: 'leaf' }, createBaseEntry(parentBase, frontMatter, link, null, fsPath)), { props: {
            demand: frontMatter.demand,
            num: pos + 1,
            draftSolution: frontMatter.draftSolution || false,
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
        const excPath = getExcFilePath(this.entry.fsPath);
        if (excPath === null) {
            return Object.assign(Object.assign({}, baseResource), { status: 'ok', content: {
                    type: 'broken',
                } });
        }
        const parts = await loadExerciseParts(excPath);
        const assignJsml = await this.markdownProcessor.processString(parts.assign);
        const solutionJsml = parts.solution === null
            ? []
            : await this.markdownProcessor.processString(parts.solution);
        return Object.assign(Object.assign({}, baseResource), { status: 'ok', content: {
                type: 'full',
                demand: this.entry.props.demand,
                num: this.entry.props.num,
                assignJsml,
                solutionJsml,
            } });
    }
    async fetchAssign() {
        const excPath = getExcFilePath(this.entry.fsPath);
        if (excPath === null || this.entry.nodeType === 'broken') {
            return el('excerr', { link: this.entry.link });
        }
        const parts = await loadExerciseParts(excPath);
        const jsml = await this.markdownProcessor.processString(parts.assign);
        const attrs = {
            num: this.entry.props.num,
            title: this.entry.title,
            link: this.entry.link,
            path: this.accessCheck.accepts() ? this.entry.path : 'forbidden',
            demand: this.entry.props.demand,
            hasSolution: parts.solution !== null && !this.entry.props.draftSolution,
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

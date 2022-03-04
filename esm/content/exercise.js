import path from 'path';
import { existsSync } from "fs";
import yaml from "yaml";
import lineReader from "line-reader";
import { LeafEntry } from '../core/entry.js';
import { EntryLoader } from '../core/loader.js';
import { el, getChildren, getTag, isElement } from '../jsml.js';
import { MarkdownProcessor } from '../markdown.js';
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
const markdownProcessor = new MarkdownProcessor(() => '');
export class ExerciseEntry extends LeafEntry {
    getPublicAttrs(frontMatter) {
        var _a;
        return {
            demand: frontMatter.demand,
            num: this.common.position + 1,
            showSolution: (_a = frontMatter.showSolution) !== null && _a !== void 0 ? _a : false,
        };
    }
    async fetchFullAttrs(frontMatter) {
        var _a;
        const assignPath = getExcFilePath(this.common.fsPath);
        if (assignPath === null) {
            throw new Error('no assign file found');
        }
        const jsml = await markdownProcessor.process(assignPath);
        const firstNode = jsml[0];
        const secondNode = (_a = jsml[1]) !== null && _a !== void 0 ? _a : '';
        const assignJsml = isElement(firstNode) && getTag(firstNode) === 'assign'
            ? getChildren(firstNode)
            : jsml;
        const solutionJsml = isElement(secondNode) && getTag(secondNode) === 'solution'
            ? getChildren(secondNode)
            : [];
        return Object.assign(Object.assign({}, this.getPublicAttrs(frontMatter)), { assignJsml,
            solutionJsml });
    }
    async fetchAssign() {
        var _a, _b, _c;
        const excPath = getExcFilePath(this.common.fsPath);
        if (excPath === null) {
            throw new Error('no assign file found');
        }
        const assignText = await loadAssign(excPath);
        const jsml = await markdownProcessor.processString(assignText);
        const attrs = {
            num: this.common.position + 1,
            title: (_a = this.index.title) !== null && _a !== void 0 ? _a : this.common.link,
            path: this.common.path,
            demand: this.index.demand,
            showSolution: (_c = (_b = this.index) === null || _b === void 0 ? void 0 : _b.showSolution) !== null && _c !== void 0 ? _c : false,
        };
        const firstNode = jsml[0];
        const content = isElement(firstNode) && getTag(firstNode) === 'assign'
            ? getChildren(firstNode)
            : jsml;
        return el('exc', attrs, ...content);
    }
}
export class ExerciseLoader extends EntryLoader {
    buildFsPath(fileName) {
        return path.join(this.parentEntry.getCommon().fsPath, '..', fileName.replace('>', '/'));
    }
    async loadIndex(fsPath) {
        const assignPath = getExcFilePath(fsPath);
        if (assignPath === null) {
            return 'not-found';
        }
        return loadFrontMatter(assignPath);
    }
    async loadEntry(common, frontMatter, position) {
        return new ExerciseEntry(this.parentEntry, common, frontMatter, []);
    }
}

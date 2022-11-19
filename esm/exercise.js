import path from 'path';
import yaml from "yaml";
import lineReader from "line-reader";
import { LeafEntry } from '@filefish/core/dist/entry.js';
import { EntryLoader } from '@filefish/core/dist/loader.js';
import { createBaseContent, createCrumbs } from './content.js';
import { el, getChildren, getTag, isElement } from './jsml.js';
import { MarkdownProcessor } from './markdown.js';
;
export class ExerciseEntry extends LeafEntry {
    constructor(base, frontMatter, mardownProcessor) {
        super(base);
        this.frontMatter = frontMatter;
        this.markdownProcessor = mardownProcessor;
    }
    async loadParts() {
        const filePath = this.base.fsType === 'file'
            ? this.base.fsPath
            : path.join(this.base.fsPath, 'exercise.md');
        return new Promise((resolve, reject) => {
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
    }
    async fetchAssign() {
        const parts = await this.loadParts();
        const jsml = await this.markdownProcessor.processString(parts.assign);
        const attrs = {
            num: this.index + 1,
            title: this.frontMatter.title,
            link: this.base.link,
            path: this.base.contentPath,
            //path: this.accessCheck.accepts() ? this.entry.path : 'forbidden',
            demand: this.frontMatter.demand,
            hasSolution: parts.solution !== null && !this.frontMatter.draftSolution,
        };
        const firstNode = jsml[0];
        const content = isElement(firstNode) && getTag(firstNode) === 'assign'
            ? getChildren(firstNode)
            : jsml;
        return el('exc', attrs, ...content);
    }
    async fetch() {
        const parts = await this.loadParts();
        const assignJsml = await this.markdownProcessor.processString(parts.assign);
        const solutionJsml = parts.solution === null
            ? []
            : await this.markdownProcessor.processString(parts.solution);
        return {
            ...createBaseContent(this.base),
            crumbs: createCrumbs(this),
            demand: this.frontMatter.demand,
            num: this.index + 1,
            title: this.frontMatter.title,
            assignJsml,
            solutionJsml,
        };
    }
}
export class ExerciseLoader extends EntryLoader {
    constructor() {
        super();
        this.markdownProcessor = new MarkdownProcessor(() => '');
    }
    async loadFrontMatter(filePath) {
        return new Promise((resolve, reject) => {
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
    }
    async loadEntry(base) {
        const filePath = base.fsType === 'file'
            ? base.fsPath
            : path.join(base.fsPath, 'exercise.md');
        const frontMatter = await this.loadFrontMatter(filePath);
        return new ExerciseEntry(base, frontMatter, this.markdownProcessor);
    }
}

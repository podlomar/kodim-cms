import { existsSync, promises as fs } from "fs";
import path from 'path';
import { EntryLoader } from '@filefish/core/dist/loader.js';
import { createBaseContent } from './content.js';
import { unified } from "unified";
import markdown from "remark-parse";
import directive from "remark-directive";
import rehype from "remark-rehype";
import stringify from "rehype-stringify";
import { MarkdownProcessor } from "./markdown.js";
import { ExerciseLoader } from "./exercise.js";
import { buildExcTransform } from "./markdown-transforms.js";
export const processor = unified()
    .use(markdown)
    .use(directive)
    .use(rehype)
    .use(stringify);
export const parseSection = async (filePath) => {
    const text = await fs.readFile(filePath, "utf-8");
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
    return { title, excs };
};
export class LessonSectionEntry extends ParentEntry {
    constructor(base, subEntries) {
        super(base, subEntries);
        this.markdownProcessor = this.markdownProcessor = new MarkdownProcessor(() => '').useTransform('exc', buildExcTransform(this));
    }
    getContentRef() {
        return {
            status: 'ok',
            ...createBaseContent(this.base),
            publicContent: {},
        };
    }
    async fetch() {
        var _a, _b, _c, _d, _e, _f;
        return {
            ...createBaseContent(this.base),
            jsml: await this.markdownProcessor.process(this.base.fsPath),
            prev: (_c = (_b = (_a = this.parent) === null || _a === void 0 ? void 0 : _a.getPrevSibling(this.index)) === null || _b === void 0 ? void 0 : _b.getContentRef()) !== null && _c !== void 0 ? _c : null,
            next: (_f = (_e = (_d = this.parent) === null || _d === void 0 ? void 0 : _d.getNextSibling(this.index)) === null || _e === void 0 ? void 0 : _e.getContentRef()) !== null && _f !== void 0 ? _f : null,
        };
    }
}
export class LessonSectionLoader extends EntryLoader {
    async loadEntry(base) {
        const index = await parseSection(base.fsPath);
        const nodes = await Promise.all(index.excs.map(async (exc) => {
            const subPath = exc.replace('>', '/');
            const filePath = path.join(base.fsPath, '..', `${subPath}.md`);
            if (existsSync(filePath)) {
                return {
                    type: 'file',
                    fsPath: filePath,
                    contentPath: `${base.contentPath}/${exc}`,
                    name: exc,
                    title: null,
                    extension: 'md',
                    extra: null,
                };
            }
            const folderPath = path.join(base.fsPath, '..', `${subPath}`);
            try {
                const stat = await fs.stat(folderPath);
                if (stat.isDirectory()) {
                    return {
                        type: 'folder',
                        fsPath: folderPath,
                        contentPath: `${base.contentPath}/${exc}`,
                        name: exc,
                        title: null,
                        extra: null,
                    };
                }
                return {
                    type: 'failed',
                    problems: [`Exercise with link '${exc}' is neither a markdown file nor a directory`],
                };
            }
            catch (e) {
                return {
                    type: 'failed',
                    problems: [`Could not find exercise with link '${exc}'`],
                };
            }
        }));
        const okNodes = nodes.filter((node) => node.type !== 'failed');
        const failedNodes = nodes.filter((node) => node.type === 'failed');
        const problems = failedNodes.flatMap((node) => node.problems);
        const subEntries = await new ExerciseLoader().loadMany(okNodes);
        return new LessonSectionEntry({
            ...base,
            title: index.title,
            problems: [...base.problems, ...problems],
        }, subEntries);
    }
}

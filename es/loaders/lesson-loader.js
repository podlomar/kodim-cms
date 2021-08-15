import { promises as fs } from 'fs';
import { unified } from 'unified';
import markdown from 'remark-parse';
import directive from 'remark-directive';
import frontmatter from 'remark-frontmatter';
import rehype from 'remark-rehype';
import stringify from 'rehype-stringify';
import mdast from 'mdast-builder';
import lineReader from 'line-reader';
import path from 'path';
import yaml from 'yaml';
import { IndexNode } from '../tree-index.js';
const loadLesson = async (lessonPath) => {
    const processor = unified()
        .use(markdown)
        .use(frontmatter)
        .use(directive)
        .use(rehype)
        .use(stringify);
    const text = await fs.readFile(lessonPath, 'utf-8');
    const tree = processor.parse(text);
    const sections = [];
    let currentTitle = '';
    let currentRoot = mdast.root();
    for (const child of tree.children) {
        if (child.type === 'heading') {
            const hastRoot = processor.runSync(currentRoot);
            const html = processor.stringify(hastRoot);
            sections.push({
                title: currentTitle,
                html,
            });
            currentTitle = child.children[0].value;
            currentRoot = mdast.root();
        }
        else {
            currentRoot.children.push(child);
        }
    }
    if (currentRoot.children.length > 0) {
        const hastRoot = processor.runSync(currentRoot);
        const html = processor.stringify(hastRoot);
        sections.push({
            title: currentTitle,
            html,
        });
    }
    console.log('result', sections);
    return Promise.resolve(sections);
};
export class LessonNode extends IndexNode {
    constructor(location, frontMatter, num) {
        super(location, frontMatter);
        this.num = num;
    }
    getResourceRef(baseUrl) {
        const baseRef = super.getResourceRef(baseUrl);
        const frontMatter = this.index;
        return Object.assign(Object.assign({}, baseRef), { lead: frontMatter.lead, num: this.num });
    }
    async loadResource(baseUrl) {
        const sections = await loadLesson(path.join(this.location.fsPath, 'lesson.md'));
        const base = this.getResourceBase(baseUrl, 'lesson');
        const frontMatter = this.index;
        return Object.assign(Object.assign({}, base), { lead: frontMatter.lead, num: this.num, sections });
    }
}
const loadFrontMatter = async (filePath) => new Promise((resolve) => {
    let inside = false;
    let lines = '';
    lineReader.eachLine(filePath, (line) => {
        if (inside) {
            if (line.startsWith('---')) {
                resolve(yaml.parse(lines));
                return false;
            }
            lines += `${line}\n`;
            return true;
        }
        if (line.startsWith('---')) {
            inside = true;
        }
        return true;
    });
});
export const loadLessonNode = async (parentLocation, fileName, num) => {
    const frontMatter = await loadFrontMatter(path.join(parentLocation.fsPath, fileName, 'lesson.md'));
    const location = parentLocation.createChildLocation(fileName, frontMatter);
    return new LessonNode(location, frontMatter, num);
};

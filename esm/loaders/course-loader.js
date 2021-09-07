import path from 'path';
import { IndexNode, loadYamlFile, } from '../tree-index.js';
import { SectionNode } from './section-loader.js';
import { ChapterNode } from './chapter-loader.js';
export class CourseNode extends IndexNode {
    constructor(location, index, chapters) {
        super(location, index);
        this.chapters = chapters;
    }
    getList(name) {
        if (name === CourseNode.CHAPTERS_LIST) {
            return this.chapters;
        }
        return null;
    }
    async fetchResource(expand) {
        const base = this.getResourceBase('course');
        const index = this.index;
        const chapters = await this.fetchList(CourseNode.CHAPTERS_LIST, expand);
        return Object.assign(Object.assign({}, base), { lead: index.lead, image: index.image, chapters });
    }
}
CourseNode.CHAPTERS_LIST = 'chapters';
CourseNode.load = async (parentLocation, fileName) => {
    const index = (await loadYamlFile(path.join(parentLocation.fsPath, fileName, 'index.yml')));
    const location = parentLocation.createChildLocation(fileName, index, SectionNode.COURSES_LIST);
    const chapters = index.chapters === undefined
        ? []
        : await Promise.all(index.chapters.map((name) => ChapterNode.load(location, name)));
    return new CourseNode(location, index, chapters);
};

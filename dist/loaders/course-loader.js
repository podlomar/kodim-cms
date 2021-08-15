import path from 'path';
import { ContainerIndex, loadYamlFile, } from '../tree-index.js';
import { loadChapterNode } from './chapter-loader.js';
export class CourseNode extends ContainerIndex {
    constructor(location, index, chapters) {
        super(location, index, chapters);
    }
    async loadResource(baseUrl) {
        const base = this.getResourceBase(baseUrl, 'course');
        const index = this.index;
        return Object.assign(Object.assign({}, base), { lead: index.lead, chapters: this.getChildrenRefs(baseUrl) });
    }
}
export const loadCourseNode = async (parentLocation, fileName) => {
    const index = (await loadYamlFile(path.join(parentLocation.fsPath, fileName, 'index.yml')));
    const location = parentLocation.createChildLocation(fileName, index);
    const chapters = index.chapters === undefined
        ? []
        : await Promise.all(index.chapters.map((fileName) => loadChapterNode(location, fileName)));
    return new CourseNode(location, index, chapters);
};

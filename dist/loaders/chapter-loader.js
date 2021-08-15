import path from 'path';
import { ContainerIndex, loadYamlFile, } from '../tree-index.js';
import { loadLessonNode } from './lesson-loader.js';
export class ChapterNode extends ContainerIndex {
    constructor(location, index, lessons) {
        super(location, index, lessons);
    }
    async loadResource(baseUrl) {
        const base = this.getResourceBase(baseUrl, 'chapter');
        const index = this.index;
        return Object.assign(Object.assign({}, base), { lead: index.lead, lessons: this.getChildrenRefs(baseUrl) });
    }
}
export const loadChapterNode = async (parentLocation, fileName) => {
    const index = (await loadYamlFile(path.join(parentLocation.fsPath, fileName, 'index.yml')));
    const location = parentLocation.createChildLocation(fileName, index);
    const lessons = index.lessons === undefined
        ? []
        : await Promise.all(index.lessons.map((fileName, idx) => loadLessonNode(location, fileName, idx + 1)));
    return new ChapterNode(location, index, lessons);
};

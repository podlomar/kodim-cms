import path from 'path';
import { IndexNode, loadYamlFile, } from '../tree-index.js';
import { LessonNode } from './lesson-loader.js';
export class ChapterNode extends IndexNode {
    constructor(location, index, lessons) {
        super(location, index);
        this.lessons = lessons;
    }
    getList(name) {
        if (name === LessonNode.LIST_NAME) {
            return this.lessons;
        }
        return null;
    }
    async fetchResource(expand) {
        const base = this.getResourceBase('chapter');
        const index = this.index;
        const lessons = await this.fetchList(ChapterNode.LIST_NAME, expand);
        return Object.assign(Object.assign({}, base), { lead: index.lead, lessons });
    }
}
ChapterNode.LIST_NAME = 'chapters';
ChapterNode.load = async (parentLocation, fileName) => {
    const index = (await loadYamlFile(path.join(parentLocation.fsPath, fileName, 'index.yml')));
    const location = parentLocation.createChildLocation(fileName, index, ChapterNode.LIST_NAME);
    const lessons = index.lessons === undefined
        ? []
        : await Promise.all(index.lessons.map((name, idx) => LessonNode.load(location, name, idx + 1)));
    return new ChapterNode(location, index, lessons);
};

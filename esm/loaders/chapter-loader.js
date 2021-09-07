import path from 'path';
import { IndexNode, loadYamlFile, } from '../tree-index.js';
import { CourseNode } from './course-loader.js';
import { LessonNode } from './lesson-loader.js';
export class ChapterNode extends IndexNode {
    constructor(location, index, lessons) {
        super(location, index);
        this.lessons = lessons;
    }
    getList(name) {
        if (name === ChapterNode.LESSONS_LIST) {
            return this.lessons;
        }
        return null;
    }
    async fetchResource(expand) {
        const base = this.getResourceBase('chapter');
        const index = this.index;
        const lessons = await this.fetchList(ChapterNode.LESSONS_LIST, expand);
        return Object.assign(Object.assign({}, base), { lead: index.lead, lessons });
    }
}
ChapterNode.LESSONS_LIST = 'lessons';
ChapterNode.load = async (parentLocation, fileName) => {
    const index = (await loadYamlFile(path.join(parentLocation.fsPath, fileName, 'index.yml')));
    const location = parentLocation.createChildLocation(fileName, index, CourseNode.CHAPTERS_LIST);
    const lessons = index.lessons === undefined
        ? []
        : await Promise.all(index.lessons.map((name, idx) => LessonNode.load(location, name, idx + 1)));
    return new ChapterNode(location, index, lessons);
};

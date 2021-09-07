import path from 'path';
import { IndexNode, loadYamlFile, } from '../tree-index.js';
import { RootNode } from './root-loader.js';
import { CourseNode } from './course-loader.js';
export class SectionNode extends IndexNode {
    constructor(location, index, courses) {
        super(location, index);
        this.courses = courses;
    }
    getList(name) {
        if (name === SectionNode.COURSES_LIST) {
            return this.courses;
        }
        return null;
    }
    async fetchResource(expand) {
        const base = this.getResourceBase('section');
        const index = this.index;
        const courses = await this.fetchList(SectionNode.COURSES_LIST, expand);
        return Object.assign(Object.assign({}, base), { lead: index.lead, courses });
    }
}
SectionNode.COURSES_LIST = 'courses';
SectionNode.load = async (parentLocation, fileName) => {
    const index = (await loadYamlFile(path.join(parentLocation.fsPath, fileName, 'index.yml')));
    const location = parentLocation.createChildLocation(fileName, index, RootNode.SECTIONS_LIST);
    const courses = index.courses === undefined
        ? []
        : await Promise.all(index.courses.map((name) => CourseNode.load(location, name)));
    return new SectionNode(location, index, courses);
};

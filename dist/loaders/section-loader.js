import path from 'path';
import { ContainerIndex, loadYamlFile, } from '../tree-index.js';
import { loadCourseNode } from './course-loader.js';
export class SectionNode extends ContainerIndex {
    constructor(location, index, courses) {
        super(location, index, courses);
    }
    async loadResource(baseUrl) {
        const base = this.getResourceBase(baseUrl, 'section');
        const index = this.index;
        return Object.assign(Object.assign({}, base), { lead: index.lead, courses: this.getChildrenRefs(baseUrl) });
    }
}
export const loadSectionNode = async (parentLocation, fileName) => {
    const index = (await loadYamlFile(path.join(parentLocation.fsPath, fileName, 'index.yml')));
    const location = parentLocation.createChildLocation(fileName, index);
    const courses = index.courses === undefined
        ? []
        : await Promise.all(index.courses.map((fileName) => loadCourseNode(location, fileName)));
    return new SectionNode(location, index, courses);
};

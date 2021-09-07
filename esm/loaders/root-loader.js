import path from 'path';
import { NodeLocation, IndexNode, loadYamlFile, } from '../tree-index.js';
import { SectionNode } from './section-loader.js';
export class RootNode extends IndexNode {
    constructor(location, index, sections) {
        super(location, index);
        this.sections = sections;
    }
    getList(name) {
        if (name === SectionNode.LIST_NAME) {
            return this.sections;
        }
        return null;
    }
    async fetchResource(expand) {
        const base = this.getResourceBase('root');
        const sections = await this.fetchList(SectionNode.LIST_NAME, expand);
        return Object.assign(Object.assign({}, base), { sections });
    }
}
RootNode.load = async (rootFolder, baseUrl) => {
    const index = (await loadYamlFile(path.join(rootFolder, 'index.yml')));
    const location = NodeLocation.createRootLocation(rootFolder, baseUrl);
    const sections = await Promise.all(index.sections.map((fileName) => SectionNode.load(location, fileName)));
    return new RootNode(location, index, sections);
};

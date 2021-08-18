import path from 'path';
import { ContainerIndex, NodeLocation, loadYamlFile, } from '../tree-index.js';
import { loadSectionNode } from './section-loader.js';
export class RootNode extends ContainerIndex {
    constructor(location, index, sections) {
        super(location, index, sections);
    }
    async loadResource(baseUrl) {
        const base = this.getResourceBase(baseUrl, 'root');
        return Object.assign(Object.assign({}, base), { sections: this.getChildrenRefs(baseUrl) });
    }
}
export const loadRootNode = async (rootFolder) => {
    const index = (await loadYamlFile(path.join(rootFolder, 'index.yml')));
    const location = new NodeLocation(rootFolder, '', [
        {
            title: '',
            path: '/',
        },
    ]);
    const sections = await Promise.all(index.sections.map((fileName) => loadSectionNode(location, fileName)));
    return new RootNode(location, index, sections);
};

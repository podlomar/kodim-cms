var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import path from 'path';
import { ContainerIndex, NodeLocation, loadYamlFile, } from '../tree-index.js';
import { loadSectionNode } from './section-loader.js';
export class RootNode extends ContainerIndex {
    constructor(location, index, sections) {
        super(location, index, sections);
    }
    loadResource(baseUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            const base = this.getResourceBase(baseUrl, 'chapter');
            return Object.assign(Object.assign({}, base), { sections: this.getChildrenRefs(baseUrl) });
        });
    }
}
export const loadRootNode = (rootFolder) => __awaiter(void 0, void 0, void 0, function* () {
    const index = (yield loadYamlFile(path.join(rootFolder, 'index.yml')));
    const location = new NodeLocation(rootFolder, '', [
        {
            title: '',
            path: '/',
        },
    ]);
    const sections = yield Promise.all(index.sections.map((fileName) => loadSectionNode(location, fileName)));
    return new RootNode(location, index, sections);
});

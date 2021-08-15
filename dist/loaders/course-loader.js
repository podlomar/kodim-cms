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
import { ContainerIndex, loadYamlFile, } from '../tree-index.js';
import { loadChapterNode } from './chapter-loader.js';
export class CourseNode extends ContainerIndex {
    constructor(location, index, chapters) {
        super(location, index, chapters);
    }
    loadResource(baseUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            const base = this.getResourceBase(baseUrl, 'course');
            const index = this.index;
            return Object.assign(Object.assign({}, base), { lead: index.lead, chapters: this.getChildrenRefs(baseUrl) });
        });
    }
}
export const loadCourseNode = (parentLocation, fileName) => __awaiter(void 0, void 0, void 0, function* () {
    const index = (yield loadYamlFile(path.join(parentLocation.fsPath, fileName, 'index.yml')));
    const location = parentLocation.createChildLocation(fileName, index);
    const chapters = index.chapters === undefined
        ? []
        : yield Promise.all(index.chapters.map((fileName) => loadChapterNode(location, fileName)));
    return new CourseNode(location, index, chapters);
});

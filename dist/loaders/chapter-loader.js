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
import { loadLessonNode } from './lesson-loader.js';
export class ChapterNode extends ContainerIndex {
    constructor(location, index, lessons) {
        super(location, index, lessons);
    }
    loadResource(baseUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            const base = this.getResourceBase(baseUrl, 'chapter');
            const index = this.index;
            return Object.assign(Object.assign({}, base), { lead: index.lead, lessons: this.getChildrenRefs(baseUrl) });
        });
    }
}
export const loadChapterNode = (parentLocation, fileName) => __awaiter(void 0, void 0, void 0, function* () {
    const index = (yield loadYamlFile(path.join(parentLocation.fsPath, fileName, 'index.yml')));
    const location = parentLocation.createChildLocation(fileName, index);
    const lessons = index.lessons === undefined
        ? []
        : yield Promise.all(index.lessons.map((fileName, idx) => loadLessonNode(location, fileName, idx + 1)));
    return new ChapterNode(location, index, lessons);
});

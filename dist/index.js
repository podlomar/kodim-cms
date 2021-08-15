var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { loadRootNode } from './loaders/root-loader.js';
export class ContentIndex {
    constructor(baseUrl, rootNode) {
        this.baseUrl = baseUrl;
        this.rootNode = rootNode;
    }
    static load(rootFolder, baseUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            const rootNode = yield loadRootNode(rootFolder);
            return new ContentIndex(baseUrl, rootNode);
        });
    }
    query(path) {
        return __awaiter(this, void 0, void 0, function* () {
            const links = path.split('/');
            const node = this.rootNode.findNode(links);
            if (node === null) {
                return {
                    errors: ['not-found'],
                };
            }
            const resource = yield node.loadResource(this.baseUrl);
            return { resource };
        });
    }
}

import { loadRootNode } from './loaders/root-loader.js';
export class ContentIndex {
    constructor(baseUrl, rootNode) {
        this.baseUrl = baseUrl;
        this.rootNode = rootNode;
    }
    static async load(rootFolder, baseUrl) {
        const rootNode = await loadRootNode(rootFolder);
        return new ContentIndex(baseUrl, rootNode);
    }
    async query(path) {
        const links = path.split('/');
        const node = this.rootNode.findNode(links);
        if (node === null) {
            return {
                errors: ['not-found'],
            };
        }
        const resource = await node.loadResource(this.baseUrl);
        return { resource };
    }
}

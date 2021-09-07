import { RootNode } from './loaders/root-loader.js';
export class ContentIndex {
    constructor(rootNode) {
        this.rootNode = rootNode;
    }
    static async load(rootFolder, baseUrl) {
        const rootNode = await RootNode.load(rootFolder, baseUrl);
        return new ContentIndex(rootNode);
    }
    async fetch(query) {
        const data = await this.rootNode.fetch(query);
        if (data === null) {
            return {
                errors: ['not-found'],
            };
        }
        return { data };
    }
}

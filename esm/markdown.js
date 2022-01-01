import { readFile } from "fs/promises";
import { unified } from "unified";
import parse from "remark-parse";
import directive from "remark-directive";
import frontmatter from 'remark-frontmatter';
import gfm from 'remark-gfm';
import rehype from "remark-rehype";
import directiveRehype from "remark-directive-rehype";
import stringify from "rehype-stringify";
import { rootToJsml } from "./hast-to-jsml.js";
import { buildAssetTransform, buildFigTransform, codeTransform } from "./markdown-transforms.js";
const unifiedProcessor = unified()
    .use(parse)
    .use(frontmatter)
    .use(gfm)
    .use(directive)
    .use(directiveRehype)
    .use(rehype)
    .use(stringify);
export class MarkdownProcessor {
    constructor(buildAssetPath, elementTransform = {}) {
        this.process = async (file) => {
            const text = await readFile(file, "utf-8");
            const mdastTree = unifiedProcessor.parse(text);
            // @ts-ignore
            const hastTree = await unifiedProcessor.run(mdastTree);
            // @ts-ignore
            return rootToJsml(hastTree, this.elementTransform);
        };
        const assetTransform = buildAssetTransform(buildAssetPath);
        const figTransform = buildFigTransform(buildAssetPath);
        this.buildAssetPath = buildAssetPath;
        this.elementTransform = Object.assign({ a: assetTransform, img: assetTransform, fig: figTransform, code: codeTransform }, elementTransform);
    }
    useTransform(tagName, transformFunc) {
        return new MarkdownProcessor(this.buildAssetPath, Object.assign(Object.assign({}, this.elementTransform), { [tagName]: transformFunc }));
    }
}

import { Jsml } from "./jsml.js";
import { ElementTransform, TransformFunc } from "./hast-to-jsml.js";
export declare class MarkdownProcessor {
    private buildAssetPath;
    private elementTransform;
    constructor(buildAssetPath: (path: string) => string, elementTransform?: ElementTransform);
    useTransform(tagName: string, transformFunc: TransformFunc): MarkdownProcessor;
    process: (file: string) => Promise<Jsml>;
    processString: (text: string) => Promise<Jsml>;
}

import { readFile } from "fs/promises";
import { unified } from "unified";
import parse from "remark-parse";
import directive from "remark-directive";
import frontmatter from 'remark-frontmatter';
import gfm from 'remark-gfm';
import rehype from "remark-rehype";
import directiveRehype from "remark-directive-rehype";
import stringify from "rehype-stringify";
import rehypeHighlight from "rehype-highlight";
import { Jsml } from "./jsml.js";
import { ElementTransform, rootToJsml, TransformFunc } from "./hast-to-jsml.js";
import { buildAssetTransform, buildFigTransform } from "./markdown-transforms.js";

const unifiedProcessor = unified()
  .use(parse)
  .use(frontmatter)
  .use(gfm)
  .use(directive)
  .use(directiveRehype)
  .use(rehype)
  .use(rehypeHighlight, { ignoreMissing: true })
  .use(stringify);

export class MarkdownProcessor {
  private buildAssetPath: (path: string) => string;
  private elementTransform: ElementTransform;

  constructor(buildAssetPath: (path: string) => string, elementTransform: ElementTransform = {}) {
    const assetTransform = buildAssetTransform(buildAssetPath);
    const figTransform = buildFigTransform(buildAssetPath);
    this.buildAssetPath = buildAssetPath;

    this.elementTransform = {
      a: assetTransform,
      img: assetTransform,
      fig: figTransform,
      ...elementTransform,
    };
  }

  public useTransform(tagName: string, transformFunc: TransformFunc): MarkdownProcessor {
    return new MarkdownProcessor(
      this.buildAssetPath,
      {
        ...this.elementTransform,
        [tagName]: transformFunc,
      }
    )
  }

  public process = async (file: string): Promise<Jsml> => {
    const text = await readFile(file, "utf-8");
    return this.processString(text);
  };

  public processString = async (text: string): Promise<Jsml> => {
    const mdastTree = unifiedProcessor.parse(text);
    // @ts-ignore
    const hastTree = await unifiedProcessor.run(mdastTree);
    // @ts-ignore
    return rootToJsml(hastTree, this.elementTransform);
  };
}

import fs from 'node:fs/promises';
import yaml from 'yaml';
import { unified } from "unified";
import parse from "remark-parse";
import frontmatter from 'remark-frontmatter';
import directive from "remark-directive";
import gfm from 'remark-gfm';
import rehype from "remark-rehype";
import rehypeHighlight from "rehype-highlight";
import directiveRehype from "remark-directive-rehype";
import stringify from "rehype-stringify";
import { selectAll } from "unist-util-select";
import { selectAll as hastSelectAll } from 'hast-util-select';
import { Root, Content } from "mdast";
import { Root as HastRoot, Element } from "hast";
import { OkCursor } from 'filefish/dist/cursor.js';
import { LoadingContext } from 'filefish/dist/content-types.js';

const unifiedProcessor = unified()
  .use(parse)
  .use(frontmatter)
  .use(gfm)
  .use(directive)
  .use(directiveRehype)
  .use(rehype)
  .use(rehypeHighlight, { ignoreMissing: true })
  .use(stringify);

export class MarkdownSource {
  private root: Root;
  private frontMatter: Record<string, any>;

  public constructor(root: Root) {
    this.root = root;

    const frontMatterContent = this.root.children[0];

    if (frontMatterContent.type === 'yaml') {
      this.frontMatter = yaml.parse(frontMatterContent.value);
    } else {
      this.frontMatter = {};
    }
  }

  public static async fromFile(file: string): Promise<MarkdownSource> {
    const text = await fs.readFile(file, "utf-8");
    return MarkdownSource.fromText(text);
  }

  public static async fromText(text: string): Promise<MarkdownSource> {
    const tree = unifiedProcessor.parse(text);
    return new MarkdownSource(tree);
  }

  public getRoot(): Root {
    return this.root;
  }

  public getFrontMatter(): Record<string, any> {
    return this.frontMatter;
  }

  public collectAssets(): string[] {
    const assets = [] as string[];
    const nodes = selectAll('image, link, leafDirective[name=fig]', this.root) as Content[];

    for (const content of nodes) {
      let url: string | null = null;
      if (content.type === 'image' || content.type === 'link') {
        if (content.url.startsWith('assets/')) {
          url = content.url;
        }
      } else if (content.type === 'leafDirective') {
        const src = content.attributes?.src ?? '';
        if (src.startsWith('assets/')) {
          url = src;
        }
      }
      
      if (url !== null) {
        assets.push(url.slice(7));
      }
    }
  
    return assets;
  }

  public async process(cursor: OkCursor, context: LoadingContext): Promise<HastRoot> {
    const hast = await unifiedProcessor.run(this.root);
    const assetLinks = hast.children
      .filter((node): node is Element => node.type === 'element')
      // FIXME: This is some weirdness with the hast types
      // @ts-ignore
      .flatMap((node) => hastSelectAll('fig, a, img', node));

    for (const link of assetLinks) {
      const url = link.properties!.href ?? link.properties!.src;
      if (typeof url !== 'string') {
        continue;
      }

      if (!url.startsWith('assets/')) {
        continue;
      }

      const assetPath = context.buildAssetPath(cursor, url.slice(7));
      
      if (link.properties!.src !== undefined) {
        link.properties!.src = assetPath;
      } else if (link.properties!.href !== undefined) {
        link.properties!.href = assetPath;
      }
    }
    
    return hast;
  }
}

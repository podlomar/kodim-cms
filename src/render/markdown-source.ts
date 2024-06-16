import fs from 'node:fs/promises';
import yaml from 'yaml';
import { unified } from "unified";
import parse from "remark-parse";
import math from 'remark-math';
import supersub from 'remark-supersub';
import frontmatter from 'remark-frontmatter';
import directive from "remark-directive";
import gfm from 'remark-gfm';
import rehype from "remark-rehype";
import rehypeHighlight from "rehype-highlight";
import rehypeMathjax from 'rehype-mathjax';
import directiveRehype from "remark-directive-rehype";
import { selectAll } from "unist-util-select";
import { selectAll as hastSelectAll } from 'hast-util-select';
import { Root, Content } from "mdast";
import {
  Root as HastRoot,
  Element,
  Content as HastContent,
  ElementContent,
  RootContent,
  Text,
} from "hast";
import { Cursor } from 'filefish/cursor';
import { Loader } from 'filefish/loader';

const unifiedProcessor = unified()
  .use(parse)
  .use(math)
  .use(supersub)
  .use(frontmatter)
  .use(gfm)
  .use(directive)
  .use(directiveRehype)
  .use(rehype)
  .use(rehypeHighlight, {
    subset: false,
    ignoreMissing: true,
  })
  .use(rehypeMathjax, {
    svg: {
      scale: 1.05,
    }
  });

interface ProcessedContent<T> {
  content: T,
  styles: string[],
}

const extractContentStyles = <T extends HastContent>(
  content: T
): ProcessedContent<T> | string => {
  if (content.type === 'element') {
    if (content.tagName === 'style') {
      return content.children.map((text) => (text as Text).value).join('\n');
    }
    
    const styles: string[] = [];
    const newChildren: ElementContent[] = [];

    for(const child of content.children) {
      const extracted = extractContentStyles(child);
      if (typeof extracted === 'string') {
        styles.push(extracted);
      } else {
        styles.push(...extracted.styles);
        newChildren.push(extracted.content);
      }
    }

    return {
      content: {
        ...content,
        children: newChildren,
      },
      styles,
    };
  }

  return {
    content,
    styles: [],
  };
}

const extractStyles = (root: HastRoot): [HastRoot, string[]] => {
  const styles: string[] = [];
  const newChildren: RootContent[] = [];

  for(const child of root.children) {
    const extracted = extractContentStyles(child);
    if (typeof extracted === 'string') {
      styles.push(extracted);
    } else {
      styles.push(...extracted.styles);
      newChildren.push(extracted.content);
    }
  }

  return [{
    ...root,
    children: newChildren,
  }, styles];
}

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

  public async process(cursor: Cursor, loader: Loader): Promise<ProcessedContent<HastRoot>> {
    const hast = await unifiedProcessor.run(this.root);
    const [processedHast, styles] = extractStyles(hast);

    console.log('processedHast', styles);
    const assetLinks = hast.children
      .filter((node): node is Element => node.type === 'element')
      // FIXME: This is some weirdness with the hast types
      // @ts-ignore
      .flatMap((node) => hastSelectAll('fig, a, img', node));

    for (const link of assetLinks) {
      if (link.tagName === 'fig') {
        console.log('fig', link);
      }
      
      const url = link.properties!.href ?? link.properties!.src;
      if (typeof url !== 'string' || !url.startsWith('assets/')) {
        continue;
      }

      const assetUrlPath = loader.buildAssetUrlPath(cursor, url.slice(7));
      
      if (link.properties!.src !== undefined) {
        link.properties!.src = assetUrlPath;
      } else if (link.properties!.href !== undefined) {
        link.properties!.href = assetUrlPath;
      }
    }
    
    return {
      content: processedHast,
      styles,
    }
  }
}

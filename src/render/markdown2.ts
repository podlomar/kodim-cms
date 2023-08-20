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
import { RootContent } from "hast";
import { OkCursor } from "filefish/dist/cursor.js";
import { Exercise, ExerciseContentType, ExerciseEntry } from "../content/exercise.js";
import { FsNode } from "fs-inquire";

const unifiedProcessor = unified()
  .use(parse)
  .use(frontmatter)
  .use(gfm)
  .use(directive)
  .use(directiveRehype)
  .use(rehype)
  .use(rehypeHighlight, { ignoreMissing: true })
  .use(stringify);

export class ExerciseProcessor {
  // private buildAssetPath: (path: string) => string;
  // private elementTransform: ElementTransform;

  // constructor(buildAssetPath: (path: string) => string, elementTransform: ElementTransform = {}) {
  //  const assetTransform = buildAssetTransform(buildAssetPath);
  //   const figTransform = buildFigTransform(buildAssetPath);
  //   this.buildAssetPath = buildAssetPath;

  //   this.elementTransform = {
  //     a: assetTransform,
  //     img: assetTransform,
  //     fig: figTransform,
  //     ...elementTransform,
  //   };
  // }

  // public useTransform(tagName: string, transformFunc: TransformFn): MarkdownProcessor {
  //   return new MarkdownProcessor(
  //     this.buildAssetPath,
  //     {
  //       ...this.elementTransform,
  //       [tagName]: transformFunc,
  //     }
  //   )
  // }

  public process = async (
    fsNode: FsNode, cursor: OkCursor,
  ): Promise<Exercise> => {
    const filePath = fsNode.type === 'file'
      ? fsNode.path
      : fsNode.path + '/exercise.md';

    const text = await readFile(filePath, "utf-8");
    return this.processString(text, cursor);
  };

  public processString = async (text: string, cursor: OkCursor): Promise<Exercise> => {
    const entry = cursor.entry() as ExerciseEntry;
    const mdastTree = unifiedProcessor.parse(text);
    const root = await unifiedProcessor.run(mdastTree);
    
    const rootChildren: RootContent[] = [];
    let solution: RootContent | null = null;
    
    for(const node of root.children) {
      if (node.type === 'doctype' || node.type === 'comment') {
        continue;
      }
      
      if (node.type === 'text' && node.value.trim() === '') {
        continue;
      }

      if (node.type === 'element' && node.tagName === 'solution') {
        solution = node;
        continue;
      }

      rootChildren.push(node);
    }
    
    return {
      path: cursor.contentPath(),
      name: entry.name,
      lead: entry.lead,
      title: entry.title,
      demand: entry.demand,
      num: cursor.pos() + 1,
      assign: {
        ...root,
        children: rootChildren,
      },
      solution: {
        type: 'root',
        children: solution === null ? [] : solution.children,
      },
    };
  };
}

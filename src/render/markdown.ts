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
import { SectionBlock } from "../content/section.js";
import { Text } from "hast";
import { LoadingContext } from "filefish/dist/content-types.js";
import { OkCursor } from "filefish/dist/cursor.js";
import { ExerciseContentType } from "../content/exercise.js";

const unifiedProcessor = unified()
  .use(parse)
  .use(frontmatter)
  .use(gfm)
  .use(directive)
  .use(directiveRehype)
  .use(rehype)
  .use(rehypeHighlight, { ignoreMissing: true })
  .use(stringify);

export class SectionProcessor {
  public process = async (
    file: string, cursor: OkCursor, context: LoadingContext
  ): Promise<SectionBlock[]> => {
    const text = await readFile(file, "utf-8");
    return this.processString(text, cursor, context);
  };

  public processString = async (
    text: string, cursor: OkCursor, context: LoadingContext,
  ): Promise<SectionBlock[]> => {
    const mdastTree = unifiedProcessor.parse(text);
    const root = await unifiedProcessor.run(mdastTree);
    const blocks: SectionBlock[] = [];

    for(const node of root.children) {
      if (node.type === 'doctype' || node.type === 'comment') {
        continue;
      }
      
      if (node.type === 'text' && node.value.trim() === '') {
        continue;
      }

      let lastBlock = blocks.at(-1);
      if (node.type === 'element' && node.tagName === 'exc') {
        const content = (node.children[0] as Text).value as string;
        const name = content.trim().split('/').at(-1)!;
        const exc = await context.loadShallow(cursor.navigate(name) as OkCursor, ExerciseContentType);
        
        if (exc === 'mismatch') {
          continue;
        }

        if (lastBlock === undefined || lastBlock.type !== 'excs') {
          blocks.push({ type: 'excs', excs: [exc] });
        } else {
          lastBlock.excs.push(exc);
        }
        continue;
      }

      if (node.type === 'element' && node.tagName === 'fig') {
        const assetName = (node.properties!.src as string).split('/')[1];
        node.properties!.src = context.buildAssetPath(cursor, assetName);
      }

      if (lastBlock === undefined || lastBlock.type !== 'hast') {
        blocks.push({
          type: 'hast',
          root: {
            type: 'root',
            children: [node],
          }
        });
      } else {
        lastBlock.root.children.push(node);
      } 
    }
    
    return blocks;
  };
}

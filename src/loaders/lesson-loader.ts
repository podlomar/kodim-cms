import { promises as fs } from 'fs';
import { unified } from 'unified';
import { Root, Text } from 'mdast';
import markdown from 'remark-parse';
import directive from 'remark-directive';
import frontmatter from 'remark-frontmatter';
import rehype from 'remark-rehype';
import stringify from 'rehype-stringify';
import mdast from 'mdast-builder';
import lineReader from 'line-reader';
import path from 'path';
import yaml from 'yaml';
import { IndexNode, NodeLocation, ResourceIndex } from '../tree-index.js';
import { Resource } from '../resource.js';
import { ChapterNode } from './chapter-loader.js';

interface ArticleSection {
  title: string | null;
  html?: string;
}

interface FrontMatter extends ResourceIndex {
  title: string;
  lead: string;
}

interface LessonResource extends Resource {
  title: string;
  lead: string;
  num: number;
  sections: ArticleSection[];
}

const loadLesson = async (lessonPath: string): Promise<ArticleSection[]> => {
  const processor = unified()
    .use(markdown)
    .use(frontmatter)
    .use(directive)
    .use(rehype)
    .use(stringify);

  const text = await fs.readFile(lessonPath, 'utf-8');
  const tree = processor.parse(text);

  const sections: ArticleSection[] = [];

  let currentTitle = '';
  let currentRoot = mdast.root() as Root;

  tree.children.forEach((child) => {
    if (child.type === 'heading') {
      const hastRoot = processor.runSync(currentRoot);
      const html = processor.stringify(hastRoot);

      sections.push({
        title: currentTitle,
        html,
      });

      currentTitle = (child.children[0] as Text).value;
      currentRoot = mdast.root() as Root;
    } else {
      currentRoot.children.push(child);
    }
  });

  if (currentRoot.children.length > 0) {
    const hastRoot = processor.runSync(currentRoot);
    const html = processor.stringify(hastRoot);

    sections.push({
      title: currentTitle,
      html,
    });
  }

  return Promise.resolve(sections);
};

const loadFrontMatter = async (filePath: string): Promise<FrontMatter> =>
  new Promise((resolve) => {
    let inside = false;
    let lines = '';

    lineReader.eachLine(filePath, (line: string): boolean => {
      if (inside) {
        if (line.startsWith('---')) {
          resolve(yaml.parse(lines));
          return false;
        }

        lines += `${line}\n`;
        return true;
      }

      if (line.startsWith('---')) {
        inside = true;
      }

      return true;
    });
  });


export class LessonNode extends IndexNode {
  public num: number;

  public constructor(
    location: NodeLocation,
    frontMatter: FrontMatter,
    num: number,
  ) {
    super(location, frontMatter);
    this.num = num;
  }

  // eslint-disable-next-line class-methods-use-this
  public getList(): IndexNode[] | null {
    return null;
  }

  public static async load(
    parentLocation: NodeLocation,
    fileName: string,
    num: number,
  ): Promise<LessonNode> {
    const frontMatter = await loadFrontMatter(
      path.join(parentLocation.fsPath, fileName, 'lesson.md'),
    );
  
    const location = parentLocation.createChildLocation(
      fileName, frontMatter, ChapterNode.LESSONS_LIST,
    );
    return new LessonNode(location, frontMatter, num);
  };

  public async fetchResource(): Promise<LessonResource> {
    const base = this.getResourceBase('lesson');
    const index = this.index as FrontMatter;
    const sections = await loadLesson(
      path.join(this.location.fsPath, 'lesson.md'),
    );

    return {
      ...base,
      lead: index.lead,
      num: this.num,
      sections,
    };
  }
}
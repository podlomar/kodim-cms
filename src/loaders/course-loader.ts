import path from 'path';
import {
  IndexNode,
  loadYamlFile,
  NodeLocation,
  ResourceIndex,
} from '../tree-index.js';
import { Resource, ResourceList } from '../resource.js';
import { SectionNode } from './section-loader.js';
import { ChapterNode } from './chapter-loader.js';

interface CourseIndex extends ResourceIndex {
  title: string;
  lead: string;
  image: string,
  chapters?: string[];
}

export interface CourseResource extends Resource {
  title: string;
  lead: string;
  image: string,
  chapters: ResourceList;
}

export class CourseNode extends IndexNode {
  public static CHAPTERS_LIST = 'chapters';
  
  private chapters: ChapterNode[];
  
  public constructor(
    location: NodeLocation,
    index: CourseIndex,
    chapters: ChapterNode[],
  ) {
    super(location, index);

    this.chapters = chapters;
  }

  public getList(name: string): IndexNode[] | null {
    if (name === CourseNode.CHAPTERS_LIST) {
      return this.chapters;
    }

    return null;
  }
  
  public static load = async (
    parentLocation: NodeLocation,
    fileName: string,
  ): Promise<CourseNode> => {
    const index = (await loadYamlFile(
      path.join(parentLocation.fsPath, fileName, 'index.yml'),
    )) as CourseIndex;
  
    const location = parentLocation.createChildLocation(
      fileName, index, SectionNode.COURSES_LIST
    );
  
    const chapters = index.chapters === undefined
      ? []
      : await Promise.all(
        index.chapters.map((name) => ChapterNode.load(location, name)),
      );

    return new CourseNode(location, index, chapters);
  };

  public async fetchResource(expand: string[]): Promise<CourseResource> {
    const base = this.getResourceBase('course');
    const index = this.index as CourseIndex;
    const chapters = await this.fetchList(CourseNode.CHAPTERS_LIST, expand) as ResourceList;

    return {
      ...base,
      lead: index.lead,
      image: index.image,
      chapters,
    };
  }
}

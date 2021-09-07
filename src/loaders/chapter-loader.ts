import path from 'path';
import {
  IndexNode,
  loadYamlFile,
  NodeLocation,
  ResourceIndex,
} from '../tree-index.js';
import { Resource, ResourceList } from '../resource.js';
import { LessonNode } from './lesson-loader.js';

interface ChapterIndex extends ResourceIndex {
  title: string;
  lead: string;
  lessons: string[];
}

interface ChapterResource extends Resource {
  title: string;
  lead: string;
  lessons: ResourceList;
}

export class ChapterNode extends IndexNode {
  public static LIST_NAME = 'chapters';

  private lessons: LessonNode[];

  public constructor(
    location: NodeLocation,
    index: ChapterIndex,
    lessons: LessonNode[],
  ) {
    super(location, index);

    this.lessons = lessons;
  }
  
  public getList(name: string): IndexNode[] | null {
    if (name === LessonNode.LIST_NAME) {
      return this.lessons;
    }

    return null;
  }
  
  public static load = async (
    parentLocation: NodeLocation,
    fileName: string,
  ): Promise<ChapterNode> => {
    const index = (await loadYamlFile(
      path.join(parentLocation.fsPath, fileName, 'index.yml'),
    )) as ChapterIndex;
  
    const location = parentLocation.createChildLocation(
      fileName, index, ChapterNode.LIST_NAME
    );
  
    const lessons = index.lessons === undefined
      ? []
      : await Promise.all(
        index.lessons.map((name, idx) => LessonNode.load(location, name, idx + 1)),
      );

    return new ChapterNode(location, index, lessons);
  };

  public async fetchResource(expand: string[]): Promise<ChapterResource> {
    const base = this.getResourceBase('chapter');
    const index = this.index as ChapterIndex;
    const lessons = await this.fetchList(ChapterNode.LIST_NAME, expand) as ResourceList;

    return {
      ...base,
      lead: index.lead,
      lessons,
    };
  }
}

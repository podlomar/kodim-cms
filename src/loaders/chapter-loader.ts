import path from 'path';
import {
  ContainerIndex,
  loadYamlFile,
  NodeLocation,
  ResourceIndex,
} from '../tree-index.js';
import { Resource, ResourceRef } from '../resource.js';
import { LessonNode, loadLessonNode } from './lesson-loader.js';

interface ChapterIndex extends ResourceIndex {
  title: string;
  lead: string;
  lessons: string[];
}

interface ChapterResource extends Resource {
  title: string;
  lead: string;
  lessons?: ResourceRef[];
}

export class ChapterNode extends ContainerIndex<LessonNode> {
  public constructor(
    location: NodeLocation,
    index: ChapterIndex,
    lessons: LessonNode[],
  ) {
    super(location, index, lessons);
  }

  async loadResource(baseUrl: string): Promise<ChapterResource> {
    const base = this.getResourceBase(baseUrl, 'chapter');
    const index = this.index as ChapterIndex;

    return {
      ...base,
      lead: index.lead,
      lessons: this.getChildrenRefs(baseUrl),
    };
  }
}

export const loadChapterNode = async (
  parentLocation: NodeLocation,
  fileName: string,
): Promise<ChapterNode> => {
  const index = (await loadYamlFile(
    path.join(parentLocation.fsPath, fileName, 'index.yml'),
  )) as ChapterIndex;

  const location = parentLocation.createChildLocation(fileName, index);

  const lessons =
    index.lessons === undefined
      ? []
      : await Promise.all(
          index.lessons.map((fileName, idx) =>
            loadLessonNode(location, fileName, idx + 1),
          ),
        );

  return new ChapterNode(location, index, lessons);
};

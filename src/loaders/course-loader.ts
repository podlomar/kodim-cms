import path from 'path';
import {
  ContainerIndex,
  loadYamlFile,
  NodeLocation,
  ResourceIndex,
} from '../tree-index.js';
import { Resource, ResourceRef } from '../resource.js';
import { ChapterNode, loadChapterNode } from './chapter-loader.js';

interface CourseIndex extends ResourceIndex {
  title: string;
  lead: string;
  chapters?: string[];
}

interface CourseResource extends Resource {
  title: string;
  lead: string;
  chapters?: ResourceRef[];
}

export class CourseNode extends ContainerIndex<ChapterNode> {
  public constructor(
    location: NodeLocation,
    index: CourseIndex,
    chapters: ChapterNode[],
  ) {
    super(location, index, chapters);
  }

  async loadResource(baseUrl: string): Promise<CourseResource> {
    const base = this.getResourceBase(baseUrl, 'course');
    const index = this.index as CourseIndex;

    return {
      ...base,
      lead: index.lead,
      chapters: this.getChildrenRefs(baseUrl),
    };
  }
}

export const loadCourseNode = async (
  parentLocation: NodeLocation,
  fileName: string,
): Promise<CourseNode> => {
  const index = (await loadYamlFile(
    path.join(parentLocation.fsPath, fileName, 'index.yml'),
  )) as CourseIndex;

  const location = parentLocation.createChildLocation(fileName, index);

  const chapters =
    index.chapters === undefined
      ? []
      : await Promise.all(
          index.chapters.map((fileName) => loadChapterNode(location, fileName)),
        );

  return new CourseNode(location, index, chapters);
};

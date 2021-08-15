import path from 'path';
import {
  ContainerIndex,
  loadYamlFile,
  NodeLocation,
  ResourceIndex,
} from '../tree-index.js';
import { Resource, ResourceRef } from '../resource';
import { CourseNode, loadCourseNode } from './course-loader.js';

interface SectionIndex extends ResourceIndex {
  title: string;
  lead: string;
  courses?: string[];
}

export interface SectionResource extends Resource {
  title: string;
  lead: string;
  courses?: ResourceRef[];
}

export class SectionNode extends ContainerIndex<CourseNode> {
  public constructor(
    location: NodeLocation,
    index: SectionIndex,
    courses: CourseNode[],
  ) {
    super(location, index, courses);
  }

  public async loadResource(baseUrl: string): Promise<SectionResource> {
    const base = this.getResourceBase(baseUrl, 'section');
    const index = this.index as SectionIndex;

    return {
      ...base,
      lead: index.lead,
      courses: this.getChildrenRefs(baseUrl),
    };
  }
}

export const loadSectionNode = async (
  parentLocation: NodeLocation,
  fileName: string,
): Promise<SectionNode> => {
  const index = (await loadYamlFile(
    path.join(parentLocation.fsPath, fileName, 'index.yml'),
  )) as SectionIndex;

  const location = parentLocation.createChildLocation(fileName, index);

  const courses =
    index.courses === undefined
      ? []
      : await Promise.all(
          index.courses.map((fileName) => loadCourseNode(location, fileName)),
        );

  return new SectionNode(location, index, courses);
};

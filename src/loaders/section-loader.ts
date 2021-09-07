import path from 'path';
import {
  IndexNode,
  loadYamlFile,
  NodeLocation,
  ResourceIndex,
} from '../tree-index.js';
import { Resource, ResourceList } from '../resource.js';
import { RootNode } from './root-loader.js';
import { CourseNode } from './course-loader.js';

interface SectionIndex extends ResourceIndex {
  title: string;
  lead: string;
  courses?: string[];
}

export interface SectionResource extends Resource {
  title: string;
  lead: string;
  courses: ResourceList;
}

export class SectionNode extends IndexNode {
  public static COURSES_LIST = 'courses';
  
  private courses: CourseNode[];

  public constructor(
    location: NodeLocation,
    index: SectionIndex,
    courses: CourseNode[],
  ) {
    super(location, index);

    this.courses = courses;
  }

  public getList(name: string): IndexNode[] | null {
    if (name === SectionNode.COURSES_LIST) {
      return this.courses;
    }

    return null;
  }
  
  public static load = async (
    parentLocation: NodeLocation,
    fileName: string,
  ): Promise<SectionNode> => {
    const index = (await loadYamlFile(
      path.join(parentLocation.fsPath, fileName, 'index.yml'),
    )) as SectionIndex;
  
    const location = parentLocation.createChildLocation(
      fileName, index, RootNode.SECTIONS_LIST);
  
    const courses = index.courses === undefined
      ? []
      : await Promise.all(
        index.courses.map((name) => CourseNode.load(location, name)),
      );
  
    return new SectionNode(location, index, courses);
  };
  
  public async fetchResource(expand: string[]): Promise<SectionResource> {
    const base = this.getResourceBase('section');
    const index = this.index as SectionIndex;
    const courses = await this.fetchList(SectionNode.COURSES_LIST, expand) as ResourceList;

    return {
      ...base,
      lead: index.lead,
      courses,
    };
  }
}


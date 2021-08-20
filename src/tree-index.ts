import { promises as fs } from 'fs';
import path from 'path';
import yaml from 'yaml';
import collect from 'collect.js';
import { ResourceRef, Resource, Crumb } from './resource.js';

export class NodeLocation {
  public readonly fsPath: string;
  public readonly link: string;
  public readonly crumbs: readonly Crumb[];

  public constructor(fsPath: string, link: string, crumbs: readonly Crumb[]) {
    this.link = link;
    this.fsPath = fsPath;
    this.crumbs = crumbs;
  }

  get path() {
    return collect(this.crumbs).last().path;
  }

  public createChildLocation(fileName: string, index: ResourceIndex) {
    const link = index.link ?? fileName;
    const crumbs = [
      ...this.crumbs,
      {
        path: `${this.path === '/' ? '' : this.path}/${link}`,
        title: index.title,
      },
    ];

    return new NodeLocation(path.join(this.fsPath, fileName), link, crumbs);
  }
}

export interface ResourceIndex {
  title: string;
  link?: string;
}

export abstract class IndexNode {
  protected readonly location: NodeLocation;
  protected readonly index: ResourceIndex;

  protected constructor(location: NodeLocation, index: ResourceIndex) {
    this.location = location;
    this.index = index;
  }

  abstract loadResource(baseUrl: string): Promise<Resource>;

  public getResourceRef(baseUrl: string): ResourceRef {
    return {
      targetUrl: `${baseUrl}${this.location.path}`,
      title: this.index.title,
      link: this.location.link,
      path: this.location.path,
    };
  }

  protected getResourceBase(baseUrl: string, type: string): Resource {
    const ref = this.getResourceRef(baseUrl);

    return {
      type,
      link: this.location.link,
      path: ref.path,
      url: ref.targetUrl,
      title: ref.title,
      crumbs: this.location.crumbs,
    };
  }

  public findNode(links: string[]): IndexNode | null {
    if (links[0] === this.location.link) {
      return this;
    }

    return null;
  }
}

export abstract class ContainerIndex<
  ChildrenType extends IndexNode,
> extends IndexNode {
  protected children: readonly ChildrenType[];

  protected constructor(
    location: NodeLocation,
    index: ResourceIndex,
    children: readonly ChildrenType[] = [],
  ) {
    super(location, index);
    this.children = children;
  }

  protected getChildrenRefs(baseUrl: string): ResourceRef[] {
    return this.children.map((node) => node.getResourceRef(baseUrl));
  }

  public findNode(links: string[]): IndexNode | null {
    const thisNode = super.findNode(links);

    if (links.length === 1) {
      return thisNode;
    }

    if (thisNode === null) {
      return null;
    }

    const subLinks = links.slice(1);

    if (subLinks[0] === '') {
      return thisNode;
    }

    if (this.children.length === 0) {
      return null;
    }

    for (const child of this.children) {
      const node = child.findNode(subLinks);
      if (node !== null) {
        return node;
      }
    }

    return null;
  }
}

export const loadYamlFile = async (filePath: string): Promise<any> => {
  const indexContent = await fs.readFile(filePath, 'utf-8');
  return yaml.parse(indexContent);
};

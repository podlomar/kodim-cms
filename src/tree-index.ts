import { promises as fs } from 'fs';
import path from 'path';
import yaml from 'yaml';
import { Resource, Crumb, Data, ResourceList } from './resource.js';

export class NodeLocation {
  public readonly fsPath: string;
  public readonly listName: string;
  public readonly link: string;
  public readonly title: string;
  public readonly parentUrl: string;
  public readonly crumbs: readonly Crumb[];

  private constructor(
    fsPath: string,
    parentUrl: string,
    listName: string,
    link: string,
    title: string,
    crumbs: readonly Crumb[]
  ) {
    this.link = link;
    this.parentUrl = parentUrl;
    this.listName = listName;
    this.fsPath = fsPath;
    this.title = title;
    this.crumbs = crumbs;
  }

  public static createRootLocation(fsPath: string, baseUrl: string): NodeLocation {
    return new NodeLocation(fsPath, baseUrl, '', '', '', []);
  }

  public get url(): string {
    if (this.listName === '') {
      return this.parentUrl;
    }

    return `${this.parentUrl}/${this.listName}/${this.link}`
  }

  public createChildLocation(
    fileName: string, 
    index: ResourceIndex, 
    listName: string,
  ): NodeLocation {
    const link = index.link ?? fileName;
    const crumbs = [
      ...this.crumbs,
      {
        link: this.link,
        title: this.title,
        url: this.url,
      },
    ];

    return new NodeLocation(
      path.join(this.fsPath, fileName),
      this.url,
      listName,
      link, 
      index.title,
      crumbs
    );
  }
}

export interface ResourceIndex {
  title: string;
  link?: string;
}

export interface QueryStep {
  list: string,
  link: string | null,
};

export interface Query {
  steps: QueryStep[],
  expand: string[],
};

export abstract class IndexNode {
  public readonly location: NodeLocation;
  protected readonly index: ResourceIndex;
  
  protected constructor(
    location: NodeLocation, 
    index: ResourceIndex,
  ) {
    this.location = location;
    this.index = index;
  }

  public abstract getList(name: string): IndexNode[] | null;
  public abstract fetchResource(expand: string[]): Promise<Resource>;

  public async fetchList(name: string, expand: string[]): Promise<ResourceList | null> {
    const nodes = this.getList(name);

    if (nodes === null) {
      return null;
    }
    
    if (expand.includes(name)) {
      return Promise.all(nodes.map((node) => node.fetchResource(expand)));
    }
    
    return nodes.map((node) => node.location.url);
  }

  public getResourceBase(type: string): Resource {
    return {
      type,
      url: this.location.url,
      title: this.index.title,
      link: this.location.link,
      crumbs: this.location.crumbs,
    };
  }

  public async fetch(query: Query): Promise<Data | null> {
    if (query.steps.length === 0) {
      const resource = await this.fetchResource(query.expand);
      return resource;
    }

    const step = query.steps[0];
    const list = this.getList(step.list);
    
    if (list === null) {
      return null;
    }

    if (step.link === null) {
      return this.fetchList(step.list, query.expand);
    }

    if (list === null) {
      return null;
    }

    const node = list.find((n) => n.location.link === step.link);
    if (node === undefined) {
      return null;
    }

    return node.fetch({
      steps: query.steps.slice(1),
      expand: query.expand,
    });
  }
}

export const loadYamlFile = async (filePath: string): Promise<unknown> => {
  const indexContent = await fs.readFile(filePath, 'utf-8');
  return yaml.parse(indexContent);
};
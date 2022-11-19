import { Cms } from '@filefish/core';
import { EntryBase, ParentEntry } from '@filefish/core/dist/entry.js';
import { FSysNode } from '@filefish/core/dist/fsysnodes';
import { FolderLoader } from '@filefish/core/dist/loader.js';
import { Course, CourseRef, CourseEntry, CourseLoader } from './course.js';

export interface Division {
  name: string,
  courses: CourseRef[],
}

export type Divisions = { [Name: string]: Division };

export interface Root {
  divisions: Divisions;
}

class RootEntry extends ParentEntry<Root, CourseEntry> {
  public constructor(base: EntryBase, subEntries: CourseEntry[]) {
    super(base, subEntries);
  }

  public async fetch(): Promise<Root> {
    const divisions: Divisions = {};

    this.subEntries.forEach((subEntry) => {
      const name = subEntry.division;
      let division = divisions[name];

      if (division === undefined) {
        division = {
          name,
          courses: [],
        };
        divisions[name] = division;
      }

      division.courses.push(subEntry.getContentRef());
    });

    return { divisions };
  }
}

class RootLoader extends FolderLoader<RootEntry> {
  protected async loadFolder(base: EntryBase, subNodes: FSysNode[]): Promise<RootEntry> {
    const subentries = await new CourseLoader().loadMany(subNodes);
    const entry = new RootEntry(base, subentries);
    return entry;
  }
}

export type KodimCms = Cms<RootEntry>;

export const loadCms = async (rootFolder: string, rootPath: string = ''): Promise<KodimCms> => Cms.load(
  new RootLoader(), rootFolder, rootPath,
);

import { RootIndex } from '../entries.js';
import { EntryCommon, InnerEntry } from '../core/entry.js';
import { EntryLoader } from '../core/loader.js';
import { CourseEntry, CourseLoader, CourseRef } from './course.js';
import path from 'path';

export interface Division {
  readonly title: string;
  readonly lead: string;
  readonly courses: CourseRef[],
}

export type FullRootAttrs = {
  divisions: Division[],
};

export class RootLoader extends EntryLoader<RootIndex, null, RootEntry> {
  private contentFolder: string;

  constructor(contentFolder: string) {
    super(null);
    this.contentFolder = contentFolder;
  }

  protected buildFsPath(fileName: string): string {
    return path.join(this.contentFolder, fileName);
  }

  protected async loadEntry(
    common: EntryCommon, index: RootIndex, position: number
  ): Promise<RootEntry> {
    const rootEntry = new RootEntry(null, common, index, []);
    const courseLoader = new CourseLoader(rootEntry);
    const courses = await Promise.all(
      index.divisions.map((divisionIndex) => (
        courseLoader.loadMany(divisionIndex.courses)
      ))
    );
    rootEntry.pushSubEntries(...courses.flat());
    return rootEntry;
  }
}

export class RootEntry extends InnerEntry<
  null, {}, FullRootAttrs, RootIndex, CourseEntry
> {
  public getPublicAttrs(): {} {
    return {};
  }

  public async fetchFullAttrs(index: RootIndex): Promise<FullRootAttrs> {
    let lastIdx = 0;
    const divisions: Division[] = [];

    index.divisions.forEach((divisionIndex) => {
      const courses = this.subEntries.slice(lastIdx, lastIdx + divisionIndex.courses.length);
      divisions.push({
        title: divisionIndex.title ?? 'No Title',
        lead: divisionIndex.lead,
        courses: courses.map((course) => course.getRef()),
      });
      lastIdx += divisionIndex.courses.length;
    });

    return { divisions };
  }
}
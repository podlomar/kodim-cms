import { EntryBase, ParentEntry, RefableEntry } from '@filefish/core/dist/entry.js';
import { FSysNode } from '@filefish/core/dist/fsysnodes';
import { FolderLoader } from '@filefish/core/dist/loader.js';
import { Chapter, ChapterEntry, ChapterLoader } from './chapter.js';
import { BaseContent, ContentRef, createBaseContent } from './content.js';

export type CourseRef = ContentRef<{
  readonly division: string;
  readonly image: string,
  readonly lead: string,
}>;

export interface Course extends BaseContent {
  readonly image: string,
  readonly lead: string,
  readonly chapters: Chapter[],
}

export class CourseEntry extends ParentEntry<Course, ChapterEntry> implements RefableEntry<CourseRef> {
  public constructor(base: EntryBase, subEntries: ChapterEntry[]) {
    super(base, subEntries);
  }

  public get division(): string {
    return (this.extra?.division ?? 'no-division').toString();
  }

  public getContentRef(): CourseRef {
    return {
      status: 'ok',
      ...createBaseContent(this.base),
      publicContent: {
        division: this.division,
        image: (this.extra?.image ?? 'no-image').toString(),
        lead: (this.extra?.lead ?? 'no-lead').toString(),
      },
    }
  }

  public async fetch(): Promise<Course> {
    const chapters = await Promise.all(this.subEntries.map((entry) => entry.fetch()));
    
    return {
      ...createBaseContent(this.base),
      image: (this.extra?.image ?? 'no-image').toString(),
      lead: (this.extra?.lead ?? 'no-lead').toString(),
      chapters: await this.fetchChildren(),
    }
  }
}

export class CourseLoader extends FolderLoader<CourseEntry> {
  protected async loadFolder(base: EntryBase, subNodes: FSysNode[]): Promise<CourseEntry> {
    const subEntries = await new ChapterLoader().loadMany(subNodes);
    return new CourseEntry(base, subEntries);
  }
}

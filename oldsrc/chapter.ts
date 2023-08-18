import { EntryBase, ParentEntry } from '@filefish/core/dist/entry.js';
import { FSysNode } from '@filefish/core/dist/fsysnodes';
import { FolderLoader } from '@filefish/core/dist/loader.js';
import { BaseContent, createBaseContent } from './content.js';
import { LessonEntry, LessonLoader, LessonRef } from './lesson.js';

export interface Chapter extends BaseContent {
  readonly lead: string;
  readonly lessons: LessonRef[];
}

export class ChapterEntry extends ParentEntry<Chapter, LessonEntry> {
  public constructor(base: EntryBase, subEntries: LessonEntry[]) {
    super(base, subEntries);
  }

  public async fetch(): Promise<Chapter> {
    return {
      ...createBaseContent(this.base),
      lead: (this.extra?.lead ?? 'no-lead').toString(),
      lessons: this.subEntries.map((subEntry) => subEntry.getContentRef()),
    }
  }
}

export class ChapterLoader extends FolderLoader<ChapterEntry> {
  protected async loadFolder(base: EntryBase, subNodes: FSysNode[]): Promise<ChapterEntry> {
    const subEntries = await new LessonLoader().loadMany(subNodes);
    return new ChapterEntry(base, subEntries);
  }
}

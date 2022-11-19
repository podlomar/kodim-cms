import { EntryBase, LeafEntry, ParentEntry, RefableEntry } from '@filefish/core/dist/entry.js';
import { FSysNode } from '@filefish/core/dist/fsysnodes';
import { FolderLoader } from '@filefish/core/dist/loader.js';
import { BaseContent, ContentRef, createBaseContent, createCrumbs, Crumbs  } from './content.js';
import { LessonSectionEntry, LessonSectionLoader, LessonSectionRef } from './lesson-section.js';

export type LessonRef = ContentRef<{
  readonly num: number;
  readonly lead: string,
}>;

export interface Lesson extends BaseContent {
  readonly crumbs: Crumbs,
  readonly num: number;
  readonly lead: string,
  readonly sections: LessonSectionRef[],
  readonly next: LessonRef | null,
  readonly prev: LessonRef | null,
}

export class LessonEntry 
  extends ParentEntry<Lesson, LessonSectionEntry> 
  implements RefableEntry<LessonRef> 
{
  public constructor(base: EntryBase, subEntries: LessonSectionEntry[]) {
    super(base, subEntries);
  }

  public getContentRef(): LessonRef {
    return {
      status: 'ok',
      ...createBaseContent(this.base),
      publicContent: {
        num: this.index + 1,
        lead: (this.extra?.lead ?? 'no-lead').toString(),
      },
    }
  }

  public async fetch(): Promise<Lesson> {
    return {
      ...createBaseContent(this.base),
      crumbs: createCrumbs(this)!,
      lead: (this.extra?.lead ?? 'no-lead').toString(),
      num: this.index + 1,
      sections: this.subEntries.map((subEntry) => subEntry.getContentRef()),
      prev: this.parent?.getPrevSibling(this.index)?.getContentRef() ?? null,
      next: this.parent?.getNextSibling(this.index)?.getContentRef() ?? null,
    }
  }
}

export class LessonLoader extends FolderLoader<LessonEntry> {
  protected async loadFolder(base: EntryBase, subNodes: FSysNode[]): Promise<LessonEntry> {
    const subEntries = await new LessonSectionLoader().loadMany(subNodes);
    return new LessonEntry(base, subEntries);
  }
}

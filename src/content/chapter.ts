import type { CourseEntry } from './course.js';
import { ChapterIndex } from '../entries.js';
import { EntryCommon, InnerEntry, LeafEntry } from '../core/entry.js';
import { EntryLoader } from '../core/loader.js';
import { ResourceRef } from '../core/resource.js';
import { LessonEntry } from './lesson.js';

export interface PublicChapterAttrs {
  readonly lead: string;
}

export interface FullChapterAttrs extends PublicChapterAttrs {
  lessons: string[];
}

export type ChapterRef = ResourceRef<PublicChapterAttrs>;

export class ChapterLoader extends EntryLoader<ChapterIndex, CourseEntry, ChapterEntry> {
  protected async loadEntry(
    common: EntryCommon, index: ChapterIndex, position: number
  ): Promise<ChapterEntry> {
    return new ChapterEntry(this.parentEntry, common, index, []);
  }
}

export class ChapterEntry extends InnerEntry<
  CourseEntry, PublicChapterAttrs, FullChapterAttrs, ChapterIndex, LessonEntry
> {
  public getPublicAttrs(index: ChapterIndex): PublicChapterAttrs {
    return {
      lead: index.lead,
    }
  }

  public async fetchFullAttrs(index: ChapterIndex): Promise<FullChapterAttrs> {
    const nextChapter = this.parentEntry.findSubEntryByPos(0);

    return {
      ...this.getPublicAttrs(index),
      lessons: [],
    }
  }
}

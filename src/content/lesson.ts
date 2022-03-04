import { LessonIndex } from '../entries.js';
import type { ChapterEntry } from './chapter.js';
import { EntryCommon, InnerEntry } from '../core/entry.js';
import { EntryLoader } from '../core/loader.js';
import { LessonSectionEntry, LessonSectionRef } from './lesson-section.js';
import { ResourceRef } from '../core/resource.js';
import { LessonSectionLoader } from './lesson-section.js';

export interface PublicLessonAttrs {
  readonly num: number,
  readonly lead: string,
}

export interface FullLessonAttrs extends PublicLessonAttrs {
  sections: LessonSectionRef[],
  next: LessonRef | null,
  prev: LessonRef | null,
}

export type LessonRef = ResourceRef<PublicLessonAttrs>;

export class LessonLoader extends EntryLoader<LessonIndex, ChapterEntry, LessonEntry> {
  protected async loadEntry(
    common: EntryCommon, index: LessonIndex, position: number
  ): Promise<LessonEntry> {
    const lessonEntry = new LessonEntry(this.parentEntry, common, index, []);
    const sections = await new LessonSectionLoader(lessonEntry).loadMany(index.sections);
    lessonEntry.pushSubEntries(...sections);
    return lessonEntry;
  }
}

export class LessonEntry extends InnerEntry<
  ChapterEntry, PublicLessonAttrs, FullLessonAttrs, LessonIndex, LessonSectionEntry
> {
  public getPublicAttrs(index: LessonIndex): PublicLessonAttrs {
    return {
      num: this.common.position + 1,
      lead: index.lead,
    }
  }

  public async fetchFullAttrs(index: LessonIndex): Promise<FullLessonAttrs> {
    const next = this.getNextSibling()?.getRef() ?? null;
    const prev = this.getPrevSibling()?.getRef() ?? null;

    return {
      ...this.getPublicAttrs(index),
      sections: this.subEntries.map((entry) => entry.getRef()),
      next,
      prev,
    }
  }
}
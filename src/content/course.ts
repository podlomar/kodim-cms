import { CourseIndex } from '../entries.js';
import { ChapterEntry, ChapterLoader, ChapterRef } from './chapter.js';
import { EntryCommon, InnerEntry } from '../core/entry.js';
import { EntryLoader } from '../core/loader.js';
import { ResourceRef } from '../core/resource.js';
import type { RootEntry } from './root.js';

export interface PublicCourseAttrs {
  readonly image: string;
  readonly lead: string;
}

export interface FullCourseAttrs extends PublicCourseAttrs {
  chapters: ChapterRef[];
}

export type CourseRef = ResourceRef<PublicCourseAttrs>;

export class CourseLoader extends EntryLoader<CourseIndex, RootEntry, CourseEntry> {
  protected async loadEntry(
    common: EntryCommon, index: CourseIndex | null, position: number
  ): Promise<CourseEntry> {
    const courseEntry = new CourseEntry(this.parentEntry, common, index, []);
    if (index === null) {
      return courseEntry;
    }

    const chapters = await new ChapterLoader(courseEntry).loadMany(index.chapters);
    courseEntry.pushSubEntries(...chapters);
    return courseEntry;
  }
}

export class CourseEntry extends InnerEntry<
  RootEntry, PublicCourseAttrs, FullCourseAttrs, CourseIndex, ChapterEntry
> {
  public getPublicAttrs(index: CourseIndex): PublicCourseAttrs {
    return {
      image: index.image,
      lead: index.lead,
    }
  }

  public async fetchFullAttrs(index: CourseIndex): Promise<FullCourseAttrs> {
    return {
      ...this.getPublicAttrs(index),
      chapters: this.subEntries.map((entry) => entry.getRef()),
    }
  }
}
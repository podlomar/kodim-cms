import { ChapterIndex } from "../entries";
import { BaseEntry, createBaseEntry, createBrokenEntry, InnerEntry } from "./entry.js";
import { Resource, createBaseResource, createBaseRef, ResourceRef } from './resource.js';
import { findChild, readIndexFile } from "./content-node.js";
import type { CourseProvider } from "./course";
import { createLessonRef, LessonEntry, LessonProvider, LessonRef, loadLesson } from "./lesson.js";
import { BaseResourceProvider, NotFoundProvider } from "./provider.js";

export type ChapterEntry = InnerEntry<{
  lead: string,
}, LessonEntry>;

export type ChapterResource = Resource<{
  lead: string,
  lessons: LessonRef[],
}, {
  lead: string,
}>;

export type ChapterRef = ResourceRef<{
  lead: string,
}>;

export const loadChapter = async (
  parentBase: BaseEntry,
  folderName: string,
): Promise<ChapterEntry> => {
  const index = await readIndexFile<ChapterIndex>(
    `${parentBase.fsPath}/${folderName}`
  );

  if (index === 'not-found') {
    return createBrokenEntry(parentBase, folderName);
  }

  const baseEntry = createBaseEntry(parentBase, index, folderName);

  const lessons = await Promise.all(
    (index.lessons ?? []).map((lessonLink: string, idx: number) => loadLesson(
      baseEntry, lessonLink, idx,
    ))
  );

  return {
    nodeType: 'inner',
    ...baseEntry,
    props: {
      lead: index.lead,
    },
    subEntries: lessons,
  };
}

export const createChapterRef = (
  chapter: ChapterEntry,
  accessAllowed: boolean,
  baseUrl: string
): ChapterRef => ({
  ...createBaseRef(
    accessAllowed ? 'ok' : 'forbidden',
    chapter,
    baseUrl
  ),
  publicContent: chapter.nodeType === 'broken'
    ? 'broken'
    : {
      lead: chapter.props.lead,
    }
});

export class ChapterProvider extends BaseResourceProvider<
  CourseProvider, ChapterEntry, LessonProvider
> {
  public async fetch(): Promise<ChapterResource> {
    const baseResource = createBaseResource(this.entry,
      this.crumbs,
      this.settings.baseUrl
    );

    if (!this.accessCheck.accepts()) {
      return {
        ...baseResource,
        status: 'forbidden',
        content: this.entry.nodeType === 'broken'
          ? {
            type: 'broken',
          } : {
            type: 'public',
            lead: this.entry.props.lead,
          }
      };
    }

    if (this.entry.nodeType === 'broken') {
      return {
        ...baseResource,
        status: 'ok',
        content: {
          type: 'broken',
        }
      };
    }

    const lessons = this.entry.subEntries.map(
      (lesson) => {
        const accessCheck = this.accessCheck.step(lesson);
        return createLessonRef(lesson, accessCheck.accepts(), this.settings.baseUrl);
      }
    );

    return {
      ...baseResource,
      status: 'ok',
      content: {
        type: 'full',
        lead: this.entry.props.lead,
        lessons,
      }
    }
  }

  public find(link: string): LessonProvider | NotFoundProvider {
    if (!this.accessCheck.accepts()) {
      return new NotFoundProvider();
    }

    if (this.entry.nodeType === 'broken') {
      return new NotFoundProvider();
    }

    const result = findChild(this.entry.subEntries, link);
    if (result === null) {
      return new NotFoundProvider();
    }

    return new LessonProvider(
      this,
      result.child,
      result.pos,
      [...this.crumbs, {
        title: this.entry.title,
        path: this.entry.path
      }],
      this.accessCheck.step(result.child),
      this.settings
    );
  }

  public getNextLesson(pos: number): LessonRef | null {
    if (this.entry.nodeType === 'broken') {
      return null;
    }

    const lesson = this.entry.subEntries[pos + 1];
    if (lesson === undefined) {
      return null;
    }

    const childAccess = this.accessCheck.step(lesson);
    return createLessonRef(lesson, childAccess.accepts(), this.settings.baseUrl);
  }

  public getPrevLesson(pos: number): LessonRef | null {
    if (this.entry.nodeType === 'broken') {
      return null;
    }

    const lesson = this.entry.subEntries[pos - 1];
    if (lesson === undefined) {
      return null;
    }

    const childAccess = this.accessCheck.step(lesson);
    return createLessonRef(lesson, childAccess.accepts(), this.settings.baseUrl);
  }

  public findRepo(repoUrl: string): null {
    return null;
  }
}
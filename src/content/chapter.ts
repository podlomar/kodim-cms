import { ChapterIndex } from "../entries";
import { createBaseEntry, createChildLocation, EntryLocation, InnerEntry } from "./entry.js";
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
  parentLocation: EntryLocation,
  folderName: string,
): Promise<ChapterEntry> => {
  const index = await readIndexFile<ChapterIndex>(
    `${parentLocation.fsPath}/${folderName}`
  );
  
  const location = createChildLocation(parentLocation, folderName);

  if (index === 'not-found') {
    return {
      nodeType: 'broken',
      ...createBaseEntry(location, folderName, {}),
    }
  }
  
  const lessons = await Promise.all(
    index.lessons.map((lessonLink: string, idx: number) => loadLesson(
      location, lessonLink, idx,
    ))
  );

  return {
    nodeType: 'inner',
    ...createBaseEntry(
      location,
      folderName,
      {
        lead: index.lead,
      }
    ),
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
    
    if (!this.access.accepts()) {
      return {
        ...baseResource,
        status: 'forbidden',
        content: this.entry.nodeType === 'broken' 
          ? {
            type:  'broken',
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
        const access = this.access.step(lesson.link);
        return createLessonRef(lesson, access.accepts(), this.settings.baseUrl);
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
    if (!this.access.accepts()) {
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
        path: this.entry.location.path
      }],
      this.access.step(result.child.link),
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

    const childAccess = this.access.step(lesson.link);
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

    const childAccess = this.access.step(lesson.link);
    return createLessonRef(lesson, childAccess.accepts(), this.settings.baseUrl);
  }

  public findRepo(repoUrl: string): null {
    return null;
  }
}
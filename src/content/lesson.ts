import { LessonIndex } from "../entries";
import { createBaseEntry, InnerEntry, BaseEntry, createBrokenEntry } from "./entry.js";
import { ResourceRef, createBaseResource, createBaseRef, Resource } from './resource.js';
import { findChild, readIndexFile } from "./content-node.js";
import { BaseResourceProvider, NotFoundProvider } from "./provider.js";
import type { ChapterProvider } from "./chapter.js";
import { LessonSectionEntry, LessonSectionProvider, LessonSectionRef, LessonSectionResource, loadLessonSection } from "./lesson-section.js";

export type LessonEntry = InnerEntry<{
  num: number,
  lead: string,
}, LessonSectionEntry>;

export type LessonResource = Resource<{
  num: number,
  lead: string,
  sections: LessonSectionRef[],
  next: LessonRef | null,
  prev: LessonRef | null,
}, {
  num: number,
  lead: string,
}>;

export type LessonRef = ResourceRef<{
  num: number,
  lead: string,
}>;

export const loadLesson = async (
  parentBase: BaseEntry,
  folderName: string,
  position: number,
): Promise<LessonEntry> => {
  const index = await readIndexFile<LessonIndex>(
    `${parentBase.fsPath}/${folderName}`
  );

  if (index === 'not-found') {
    return createBrokenEntry(parentBase, folderName);
  }

  const baseEntry = createBaseEntry(parentBase, index, folderName);

  const sections = await Promise.all(
    (index.sections ?? []).map((sectionLink: string) => loadLessonSection(
      baseEntry, sectionLink,
    ))
  );

  return {
    nodeType: 'inner',
    ...baseEntry,
    props: {
      num: position + 1,
      lead: index.lead,
    },
    subEntries: sections,
  };
}

export const createLessonRef = (
  lesson: LessonEntry,
  accessAllowed: boolean,
  baseUrl: string
): LessonRef => ({
  ...createBaseRef(
    accessAllowed ? 'ok' : 'forbidden',
    lesson,
    baseUrl
  ),
  publicContent: lesson.nodeType === 'broken'
    ? 'broken'
    : {
      num: lesson.props.num,
      lead: lesson.props.lead,
    }
});

export class LessonProvider extends BaseResourceProvider<
  ChapterProvider, LessonEntry, LessonSectionProvider
> {
  public getFirstSectionLink(): string | null {
    if (this.entry.nodeType === 'broken') {
      return null;
    }

    if (this.entry.subEntries.length === 0) {
      return null;
    }

    return this.entry.subEntries[0].link;
  }

  public async fetch(): Promise<LessonResource> {
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
            num: this.entry.props.num,
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

    const sections = this.entry.subEntries.map(
      (section) => {
        const sectionAccess = this.accessCheck.step(section);
        return {
          ...createBaseRef(
            sectionAccess.accepts() ? 'ok' : 'forbidden',
            section,
            this.settings.baseUrl,
          ),
          publicContent: section.nodeType === 'broken' ? 'broken' : {},
        }
      }
    );

    const next = this.parent.getNextLesson(this.position);
    const prev = this.parent.getPrevLesson(this.position);

    return {
      ...baseResource,
      status: 'ok',
      content: {
        type: 'full',
        num: this.entry.props.num,
        lead: this.entry.props.lead,
        sections,
        next,
        prev,
      }
    };
  }

  public find(link: string): LessonSectionProvider | NotFoundProvider {
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

    return new LessonSectionProvider(
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

  public getNextSection(pos: number): LessonSectionRef | null {
    if (this.entry.nodeType === 'broken') {
      return null;
    }

    const section = this.entry.subEntries[pos + 1];
    if (section === undefined) {
      return null;
    }

    const childAccess = this.accessCheck.step(section);
    return {
      ...createBaseRef(
        childAccess.accepts() ? 'ok' : 'forbidden',
        section,
        this.settings.baseUrl,
      ),
      publicContent: section.nodeType === 'broken' ? 'broken' : {},
    }
  }

  public getPrevSection(pos: number): LessonSectionRef | null {
    if (this.entry.nodeType === 'broken') {
      return null;
    }

    const section = this.entry.subEntries[pos - 1];
    if (section === undefined) {
      return null;
    }

    const childAccess = this.accessCheck.step(section);
    return {
      ...createBaseRef(
        childAccess.accepts() ? 'ok' : 'forbidden',
        section,
        this.settings.baseUrl,
      ),
      publicContent: section.nodeType === 'broken' ? 'broken' : {},
    }
  }

  public findRepo(repoUrl: string): null {
    return null;
  }
}
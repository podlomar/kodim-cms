import { existsSync } from "fs";
import simpleGit from 'simple-git';
import { CourseIndex, CourseLink } from "../entries";
import { InnerEntry, createBaseEntry, BaseEntry, createBrokenEntry } from "./entry.js";
import { createBaseResource, ResourceRef, buildAssetPath, Resource, createBaseRef } from './resource.js';
import { ChapterEntry, ChapterProvider, ChapterRef, createChapterRef, loadChapter } from "./chapter.js";
import type { CoursesRootProvider } from "./content";
import { findChild, readIndexFile, readYamlFile } from "./content-node.js";
import { BaseResourceProvider, NotFoundProvider, ResourceProvider } from "./provider.js";
import { create } from "domain";

export type CourseEntry = InnerEntry<{
  image: string,
  lead: string,
  repo: {
    url: string,
    branch: string,
    secret: string,
  } | null,
}, ChapterEntry>;

export type CourseResource = Resource<{
  image: string,
  lead: string,
  chapters: ChapterRef[]
}, {
  image: string,
  lead: string,
}>;

export type CourseRef = ResourceRef<{
  image: string,
  lead: string,
}>;

export const loadCourse = async (
  parentBase: BaseEntry,
  courseLink: CourseLink,
): Promise<CourseEntry> => {
  const index = await readIndexFile<CourseIndex>(
    `${parentBase.fsPath}/${courseLink.link}`
  );

  if (index === 'not-found') {
    return createBrokenEntry(parentBase, courseLink.link);
  }

  const isGitRepo = existsSync(`${parentBase.fsPath}/${courseLink.link}/.git`);
  let repo = null;

  if (isGitRepo) {
    const git = simpleGit({
      baseDir: `${parentBase.fsPath}/${courseLink.link}`,
      binary: 'git',
    });

    const url = await git.remote(['get-url', 'origin']) as string;
    repo = {
      url: url.trim(),
      branch: courseLink.branch,
      secret: courseLink.secret,
    }

    console.log('git repo', index.title, repo);
  }

  const baseEntry = createBaseEntry(parentBase, index, courseLink.link);

  const chapters = await Promise.all(
    (index.chapters ?? []).map((chapterLink: string) => loadChapter(
      baseEntry, chapterLink
    ))
  );

  return {
    nodeType: 'inner',
    ...baseEntry,
    props: {
      image: index.image,
      lead: index.lead,
      repo,
    },
    subEntries: chapters,
  };
}

export const createCourseRef = (
  courseEntry: CourseEntry,
  accessAllowed: boolean,
  baseUrl: string,
): CourseRef => ({
  ...createBaseRef(
    accessAllowed ? 'ok' : 'forbidden',
    courseEntry,
    baseUrl,
  ),
  publicContent: courseEntry.nodeType === 'broken'
    ? 'broken'
    : {
      image: buildAssetPath(courseEntry.props.image, courseEntry.path, baseUrl),
      lead: courseEntry.props.lead,
    }
});

export class CourseProvider extends BaseResourceProvider<
  CoursesRootProvider, CourseEntry, ChapterProvider
> {
  public async reload(): Promise<void> {
    const git = simpleGit({
      baseDir: this.entry.fsPath,
      binary: 'git',
    });

    const pullResult = await git.pull();
    console.log('pullResult', pullResult);

    const index = await readIndexFile<CourseIndex>(
      this.entry.fsPath,
    );

    if (index === 'not-found') {
      return;
    }

    if (this.entry.nodeType === 'broken') {
      return;
    }

    const chapters = await Promise.all(
      index.chapters === undefined ? [] :
        index.chapters.map((chapterLink: string) => loadChapter(
          this.entry, chapterLink
        ))
    );

    this.entry.props.image = index.image;
    this.entry.props.lead = index.lead;
    this.entry.subEntries = chapters;
  }

  public async fetch(): Promise<CourseResource> {
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
            image: buildAssetPath(
              this.entry.props.image, this.entry.path, this.settings.baseUrl
            ),
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

    const chapters = this.entry.subEntries.map(
      (chapter) => {
        const accessCheck = this.accessCheck.step(chapter);
        return createChapterRef(chapter, accessCheck.accepts(), this.settings.baseUrl);
      }
    );

    return {
      ...baseResource,
      status: 'ok',
      content: {
        type: 'full',
        image: buildAssetPath(
          this.entry.props.image, this.entry.path, this.settings.baseUrl
        ),
        lead: this.entry.props.lead,
        chapters,
      }
    };
  }

  public find(link: string): ChapterProvider | NotFoundProvider {
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

    return new ChapterProvider(
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

  public findRepo(repoUrl: string): null {
    return null;
  }
}
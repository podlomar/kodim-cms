import { existsSync, readFileSync } from "fs";
import simpleGit from 'simple-git';
import yaml from 'yaml';
import { CourseIndex } from "../entries";
import { InnerEntry, createBaseEntry, BaseEntry, createBrokenEntry, BrokenEntry } from "./entry.js";
import { createBaseResource, ResourceRef, buildAssetPath, Resource, createBaseRef } from './resource.js';
import { ChapterEntry, ChapterLoader, ChapterProvider, ChapterRef, createChapterRef, loadChapter } from "./chapter.js";
import type { CoursesRootProvider } from "./content";
import { findChild } from "./content-node.js";
import { BaseResourceProvider, NotFoundProvider, ResourceProvider } from "./provider.js";
import { EntryLoader } from "./loader";
import { LessonLoader } from "./lesson";

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

export class CourseLoader extends EntryLoader<CourseIndex, CourseEntry> {
  protected async loadEntry(
    baseEntry: BaseEntry, index: CourseIndex, position: number
  ): Promise<CourseEntry> {
    const isGitRepo = existsSync(`${baseEntry.fsPath}/.git`);
    let repo = null;

    if (isGitRepo) {
      const git = simpleGit({
        baseDir: `${baseEntry.fsPath}`,
        binary: 'git',
      });

      const url = await git.remote(['get-url', 'origin']) as string;

      try {
        const repoParams = yaml.parse(
          readFileSync(`${baseEntry.fsPath}/repo.yml`, 'utf-8')
        ) as { branch: string, secret: string } | ;

        repo = {
          url: url.trim(),
          ...repoParams,
        }
      } catch {
        repo = {
          url: url.trim(),
          branch: 'not-found',
          secret: 'not-found',
        }
      }

      console.log('git repo', index.title, repo);

      const chapters = await new ChapterLoader().loadMany(baseEntry, index.chapters);
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
    };
  }
}

export const createCourseRef = (
  courseEntry: CourseEntry | BrokenEntry,
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
  public async reload(links: string[]): Promise<CourseEntry> {
    if (link)

      const git = simpleGit({
        baseDir: this.entry.fsPath,
        binary: 'git',
      });

    const pullResult = await git.pull();
    console.log('pullResult', pullResult);

    this.entry = new CourseLoader().loadOne(
      this.parent.getEntry(), this.entry.link, 0
    );

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
import { existsSync } from "fs";
import simpleGit from 'simple-git';
import { CourseIndex } from "../entries";
import { InnerEntry, createBaseEntry, EntryLocation, createChildLocation } from "./entry.js";
import { createBaseResource, ResourceRef, buildAssetPath, Resource, createBaseRef } from './resource.js';
import { ChapterEntry, ChapterProvider, ChapterRef, createChapterRef, loadChapter } from "./chapter.js";
import type { CoursesRootProvider } from "./content";
import { findChild, readIndexFile, readYamlFile } from "./content-node.js";
import { BaseResourceProvider, NotFoundProvider, ResourceProvider } from "./provider.js";

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
  parentLocation: EntryLocation,
  folderName: string,
): Promise<CourseEntry> => {
  const index = await readIndexFile<CourseIndex>(
    `${parentLocation.fsPath}/${folderName}`
  );

  const location = createChildLocation(parentLocation, folderName);

  if (index === 'not-found') {
    return {
      nodeType: 'broken',
      ...createBaseEntry(location, folderName, {}),
    };
  }

  const isGitRepo = existsSync(`${parentLocation.fsPath}/${folderName}/.git`);
  let repo = null;

  if (isGitRepo) {
    const git = simpleGit({
      baseDir: `${parentLocation.fsPath}/${folderName}`,
      binary: 'git',
    });
    
    const url = await git.remote(['get-url', 'origin']) as string;
    const repoParams = await readYamlFile<{branch: string, secret: string}>(
      `${parentLocation.fsPath}/${folderName}/repo.yml`
    );
    
    if (repoParams === 'not-found') {
      repo = {
        url: url.trim(),
        branch: 'not-found',
        secret: 'not-found',
      }
    } else {
      repo = {
        url: url.trim(),
        ...repoParams,
      }
    }
    
    console.log('git repo', index.title, repo);
  }

  const chapters = await Promise.all(
    index.chapters === undefined ? [] : 
    index.chapters.map((chapterLink: string) => loadChapter(
      location, chapterLink
    ))
  );

  return {
    nodeType: 'inner',
    ...createBaseEntry(
      location,
      folderName,
      {
        image: index.image,
        lead: index.lead,
        repo,
      },
      index.title,
    ),
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
      image: buildAssetPath(courseEntry.props.image, courseEntry.location.path, baseUrl),
      lead: courseEntry.props.lead,
    }
});

export class CourseProvider extends BaseResourceProvider<
  CoursesRootProvider, CourseEntry, ChapterProvider
> {
  public async reload(): Promise<void> {
    const git = simpleGit({
      baseDir: this.entry.location.fsPath,
      binary: 'git',
    });
    
    const pullResult = await git.pull();
    console.log('pullResult', pullResult);

    const index = await readIndexFile<CourseIndex>(
      this.entry.location.fsPath,
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
        this.entry.location, chapterLink
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
    
    if (!this.access.accepts()) {
      return {
        ...baseResource,
        status: 'forbidden',
        content: this.entry.nodeType === 'broken' 
          ? {
            type:  'broken',
          } : {
            type: 'public',
            image: buildAssetPath(
              this.entry.props.image, this.entry.location.path, this.settings.baseUrl
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
        const access = this.access.step(chapter.link);
        return createChapterRef(chapter, access.accepts(), this.settings.baseUrl);
      }
    );

    return {
      ...baseResource,
      status: 'ok',
      content: {
        type: 'full',
        image: buildAssetPath(
          this.entry.props.image, this.entry.location.path, this.settings.baseUrl
        ),
        lead: this.entry.props.lead,
        chapters,
      }
    };
  }

  public find(link: string): ChapterProvider | NotFoundProvider  {
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

    return new ChapterProvider(
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

  public findRepo(repoUrl: string): null {
    return null;
  }
}
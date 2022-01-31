import { existsSync } from "fs";
import simpleGit from 'simple-git';
import { CourseIndex } from "../entries";
import { FailedEntry, SuccessEntry, createSuccessEntry, createFailedEntry } from "./entry.js";
import { createSuccessResource, ResourceRef, createFailedResource, buildAssetPath, createFailedRef, createSuccessRef, Resource, createForbiddenResource, createForbiddenRef } from './resource.js';
import { Chapter, ChapterProvider, ChapterResource, loadChapter } from "./chapter.js";
import type { CoursesRootProvider } from "./content";
import { findChild, readIndexFile, readYamlFile } from "./content-node.js";
import { BaseResourceProvider, NoAccessProvider, NotFoundProvider, ResourceProvider } from "./provider.js";
import { createLessonRef } from "./lesson.js";

export type CourseRef = ResourceRef<{
  image: string,
  lead: string,
}>;

export interface SuccessCourse extends SuccessEntry {
  image: string,
  lead: string,
  repo: {
    url: string,
    branch: string,
    secret: string,
  } | null,
  chapters: Chapter[],
}

export type Course = SuccessCourse | FailedEntry;

export type CourseResource = Resource<{
  image: string,
  lead: string,
  chapters: ChapterResource[],
}>;


export const loadCourse = async (
  parentEntry: SuccessEntry,
  folderName: string,
): Promise<Course> => {
  const index = await readIndexFile<CourseIndex>(
    `${parentEntry.fsPath}/${folderName}`
  );

  if (index === 'not-found') {
    return createFailedEntry(parentEntry, folderName);
  }

  const isGitRepo = existsSync(`${parentEntry.fsPath}/${folderName}/.git`);
  let repo = null;

  if (isGitRepo) {
    const git = simpleGit({
      baseDir: `${parentEntry.fsPath}/${folderName}`,
      binary: 'git',
    });
    
    const url = await git.remote(['get-url', 'origin']) as string;
    const repoParams = await readYamlFile<{branch: string, secret: string}>(
      `${parentEntry.fsPath}/${folderName}/repo.yml`
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

  const baseEntry = createSuccessEntry(parentEntry, folderName, index.title);

  const chapters = await Promise.all(
    index.chapters === undefined ? [] : 
    index.chapters.map((chapterLink: string) => loadChapter(
      baseEntry, chapterLink
    ))
  );

  return {
    ...baseEntry,
    image: index.image,
    lead: index.lead,
    repo,
    chapters,
  }
}

export const createCourseRef = (course: Course, baseUrl: string): CourseRef => {
  if (course.type === 'failed') {
    return createFailedRef(course, baseUrl);
  }

  return {
    ...createSuccessRef(course, baseUrl),
    image: buildAssetPath(course.image, course.path, baseUrl),
    lead: course.lead,
  }
}

export class CourseProvider extends BaseResourceProvider<
  CoursesRootProvider, Course, ChapterProvider
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
  
    if (this.entry.type === 'failed') {
      return;
    }

    const chapters = await Promise.all(
      index.chapters === undefined ? [] : 
      index.chapters.map((chapterLink: string) => loadChapter(
        this.entry as SuccessEntry, chapterLink
      ))
    );
  
    this.entry.image = index.image;
    this.entry.lead = index.lead;
    this.entry.chapters = chapters;
  }

  public async fetch(): Promise<CourseResource> {
    if (this.entry.type === 'failed') {
      return createFailedResource(this.entry, this.settings.baseUrl);
    }
    
    return {
      ...createSuccessResource(this.entry, this.crumbs, this.settings.baseUrl),
      image: buildAssetPath(this.entry.image, this.entry.path, this.settings.baseUrl),
      lead: this.entry.lead,
      chapters: this.entry.chapters.map((chapter) => {
        if (chapter.type === 'failed') {
          return createFailedResource(chapter, this.settings.baseUrl);
        }

        const childAccess = this.access.step(chapter.link);
        if (!childAccess.accepts()) {
          return createForbiddenResource(chapter, this.settings.baseUrl);
        }

        return {
          ...createSuccessResource(chapter, this.crumbs, this.settings.baseUrl),
          lead: chapter.lead,
          lessons: chapter.lessons.map(
            (lesson) => {
              const lessonAccess = childAccess.step(lesson.link);
              if (lessonAccess.accepts()) {
                return createLessonRef(lesson, this.settings.baseUrl);
              }
              
              return createForbiddenRef(lesson, this.settings.baseUrl);
            }
          )
        }
      })
    }
  }

  public find(link: string): ChapterProvider | NotFoundProvider | NoAccessProvider {
    if (this.entry.type === 'failed') {
      return new NotFoundProvider();
    }

    const result = findChild(this.entry.chapters, link);
    if (result === null) {
      return new NotFoundProvider();
    }
    
    const childAccess = this.access.step(result.child.link);
    if (!childAccess.accepts()) {
      return new NoAccessProvider(result.child, this.settings);
    }

    return new ChapterProvider(
      this, 
      result.child, 
      result.pos,
      [...this.crumbs, { 
        title: this.entry.title, 
        path: this.entry.path
      }],
      childAccess,
      this.settings
    );
  }

  public findRepo(repoUrl: string): null {
    return null;
  }
}
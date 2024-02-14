import { Filefish, Asset } from "filefish";
import { simpleGit, ResetMode, FetchResult } from "simple-git";
import { Chapter, ChapterContentType } from "./content/chapter.js";
import { Course, CourseContentType, CourseEntry } from "./content/course.js";
import { Exercise, ExerciseContentType } from "./content/exercise.js";
import { Lesson, LessonContentType } from "./content/lesson.js";
import { RootEntry, Root, RootContentType, RootSource } from "./content/root.js";
import { Section, SectionContentType } from "./content/section.js";
import { DivisionContentType, CoursesDivision } from "./content/division.js";
import { KodimCmsIndexer, RepoRegistry } from "./cms-indexer.js";
import { Indexer } from "filefish/indexer";
import { Agent, Cursor, agnosticAgent } from "filefish/cursor";

interface ReindexResult {
  fetch: FetchResult;
  head: string;
  statuses: string[];
}

export class KodimCms {
  private readonly ff: Filefish<RootEntry>;
  private readonly repoRegistry: RepoRegistry;

  private constructor(ff: Filefish<RootEntry>, repoRegistry: RepoRegistry) {
    this.ff = ff;
    this.repoRegistry = repoRegistry;
  }

  public static async load(rootSource: RootSource): Promise<KodimCms> {
    const repoRegistry: RepoRegistry = {};
    const ff = await Filefish.create(rootSource, RootContentType, {
      assetsBasePath: '/cms/assets',
      createIndexer(contentId: string, parentContentPath: string[]): Indexer {
        return new KodimCmsIndexer(contentId, parentContentPath, repoRegistry);
      },
    });
    return new KodimCms(ff!, repoRegistry);
  }

  public root(): RootEntry {
    return this.ff.root();
  }

  public rootCursor(agent: Agent): Cursor<RootEntry> {
    return this.ff.rootCursor(agent);
  }

  public async loadAsset(agent: Agent, assetPath: string[]): Promise<Asset | null> {
    const entryPath = assetPath.slice(0, -1);
    const cursor = this.ff.rootCursor(agent).navigate(...entryPath);
    if (cursor === null) {
      return null;
    }
    const asset = await this.ff.loadAsset(cursor, assetPath.at(-1)!);
    if (asset === 'not-found') {
      return null;
    }

    return asset;
  }

  public async loadRoot(agent: Agent): Promise<Root | null> {
    const root = await this.ff.loadContent(this.ff.rootCursor(agent), RootContentType);
    return root.getOrElse(null);
  }

  public async loadDivision(agent: Agent, divisionId: string): Promise<CoursesDivision | null> {
    const divisionCursor = this.ff.rootCursor(agent).navigate(divisionId);
    if (divisionCursor === null) {
      return null;
    }

    const division = await this.ff.loadContent(divisionCursor, DivisionContentType);
    return division.getOrElse(null);
  }

  public async loadCourse(agent: Agent, topicId: string, courseId: string): Promise<Course | null> {
    const courseCursor = this.ff.rootCursor(agent).navigate(topicId, courseId);
    if (courseCursor === null) {
      return null;
    }

    const course = await this.ff.loadContent(courseCursor, CourseContentType);
    return course.getOrElse(null);
  }

  public async loadChapter(
    agent: Agent, topicId: string, courseId: string, chapterId: string
  ): Promise<Chapter | null> {
    const chapterCursor = this.ff.rootCursor(agent).navigate(topicId, courseId, chapterId);
    if (chapterCursor === null) {
      return null;
    }

    const chapter = await this.ff.loadContent(chapterCursor, ChapterContentType);
    return chapter.getOrElse(null);
  }

  public async loadLesson(
    agent: Agent, topicId: string, courseId: string, chapterId: string, lessonId: string
  ): Promise<Lesson | null> {
    const lessonCursor = this.ff.rootCursor(agent).navigate(topicId, courseId, chapterId, lessonId);
    if (lessonCursor === null) {
      return null;
    }
    const lesson = await this.ff.loadContent(lessonCursor, LessonContentType);
    return lesson.getOrElse(null);
  }

  public async loadSection(
    agent: Agent,
    topicId: string,
    courseId: string,
    chapterId: string,
    lessonId: string,
    sectionId: string,
  ): Promise<Section | null> {
    const sectionCursor = this.ff.rootCursor(agent).navigate(
      topicId, courseId, chapterId, lessonId, sectionId
    );
    
    if (sectionCursor === null) {
      return null;
    }

    const section = await this.ff.loadContent(sectionCursor, SectionContentType);
    return section.getOrElse(null);
  }

  public async loadExercise(
    agent: Agent,
    topicId: string,
    courseId: string,
    chapterId: string,
    lessonId: string,
    sectionId: string,
    exerciseId: string,
  ): Promise<Exercise | null> {
    const exerciseCursor = this.ff.rootCursor(agent).navigate(
      topicId, courseId, chapterId, lessonId, sectionId, exerciseId,
    );

    if (exerciseCursor === null) {
      return null;
    }

    const exercise = await this.ff.loadContent(exerciseCursor, ExerciseContentType);
    return exercise.getOrElse(null);
  }

  public async reindexFromRepo(
    repoUrl: string, branchName: string
  ): Promise<ReindexResult | 'not-found' | 'no-such-repo'> {
    const normlizedUrl = repoUrl.endsWith('.git') ? repoUrl : repoUrl + '.git';
    
    const repoRecords = this.repoRegistry[normlizedUrl];
    if (repoRecords === undefined) {
      return 'no-such-repo';
    }
    
    const git = simpleGit({
      baseDir: repoRecords[0].repoPath,
      binary: 'git',
    });

    const fetchResult = await git.fetch('origin', branchName);
    const resetResult = await git.reset(ResetMode.HARD, [`origin/${branchName}`]);
    
    const statuses = await Promise.all(
      repoRecords.map(async (repoRecord) => {
        const cursor = this.ff.rootCursor(agnosticAgent).navigate(...repoRecord.contentPath);
        if (cursor === null) {
          return 'not-found';
        }

        const result = await this.ff.reindex(cursor, repoRecord.contentType);
        if (result === 'not-found' || result === 'wrong-content-type') {
          return 'not-found';
        }
        
        return 'ok';
      })
    );

    return {
      fetch: fetchResult,
      head: resetResult,
      statuses,
    };
  }
}

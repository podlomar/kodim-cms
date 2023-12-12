import { Filefish, filefish, Asset, FilefishOptions } from "filefish/dist/index.js";
import { simpleGit, ResetMode, FetchResult } from "simple-git";
import { Chapter, ChapterContentType } from "./content/chapter.js";
import { Course, CourseContentType, CourseEntry } from "./content/course.js";
import { Exercise, ExerciseContentType } from "./content/exercise.js";
import { Lesson, LessonContentType } from "./content/lesson.js";
import { RootEntry, Root, RootContentType } from "./content/root.js";
import { Section, SectionContentType } from "./content/section.js";
import { Topic, TopicContentType } from "./content/topic.js";
import { IndexingContext } from "filefish/dist/content-types.js";
import { KodimCmsIndexingContext, RepoRegistry } from "./indexing-context.js";

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

  public static async load(contentPath: string): Promise<KodimCms> {
    const repoRegistry: RepoRegistry = {};
    const ff = await filefish<RootEntry>(contentPath, RootContentType, {
      assetsBasePath: '/cms/assets',
      createIndexingContext(contentId: string): IndexingContext {
        return new KodimCmsIndexingContext(contentId, [], repoRegistry);
      }
    });
    return new KodimCms(ff!, repoRegistry);
  }

  public root(): RootEntry {
    return this.ff.root();
  }

  public async loadAsset(assetPath: string[]): Promise<Asset | null> {
    const entryPath = assetPath.slice(0, -1);
    const cursor = this.ff.rootCursor().navigate(...entryPath);
    const asset = await this.ff.loadAsset(cursor, assetPath.at(-1)!);

    if (asset === 'not-found') {
      return null;
    }

    return asset;
  }

  public async loadRoot(): Promise<Root | null> {
    const root = await this.ff.loadContent(this.ff.rootCursor(), RootContentType);
    return root.getOrElse(null);
  }

  public async loadTopic(topicId: string): Promise<Topic | null> {
    const topic = await this.ff.loadContent(
      this.ff.rootCursor().navigate(topicId), TopicContentType
    );
    return topic.getOrElse(null);
  }

  public async loadCourse(topicId: string, courseId: string): Promise<Course | null> {
    const course = await this.ff.loadContent(
      this.ff.rootCursor().navigate(topicId, courseId), CourseContentType,
    );
    return course.getOrElse(null);
  }

  public async loadChapter(
    topicId: string, courseId: string, chapterId: string
  ): Promise<Chapter | null> {
    const chapter = await this.ff.loadContent(
      this.ff.rootCursor().navigate(topicId, courseId, chapterId), ChapterContentType,
    );

    return chapter.getOrElse(null);
  }

  public async loadLesson(
    topicId: string, courseId: string, chapterId: string, lessonId: string
  ): Promise<Lesson | null> {
    const lesson = await this.ff.loadContent(
      this.ff.rootCursor().navigate(topicId, courseId, chapterId, lessonId), LessonContentType,
    );
    return lesson.getOrElse(null);
  }

  public async loadSection(
    topicId: string, courseId: string, chapterId: string, lessonId: string, sectionId: string,
  ): Promise<Section | null> {
    const section = await this.ff.loadContent(
      this.ff.rootCursor().navigate(topicId, courseId, chapterId, lessonId, sectionId),
      SectionContentType,
    );
    return section.getOrElse(null);
  }

  public async loadExercise(
    topicId: string,
    courseId: string,
    chapterId: string,
    lessonId: string,
    sectionId: string,
    exerciseId: string,
  ): Promise<Exercise | null> {
    const exercise = await this.ff.loadContent(
      this.ff.rootCursor().navigate(topicId, courseId, chapterId, lessonId, sectionId, exerciseId),
      ExerciseContentType,
    );
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
        const cursor = this.ff.rootCursor().navigate(...repoRecord.contentPath);
        if (!cursor.isOk()) {
          return 'not-found';
        }

        const result = await this.ff.reindex(cursor, repoRecord.contentType);
        if (result === 'not-found' || result === 'mismatch') {
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

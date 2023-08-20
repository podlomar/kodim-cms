import { Filefish, filefish, Asset, FilefishOptions } from "filefish/dist/index.js";
import { simpleGit, ResetMode, FetchResult } from "simple-git";
import { Chapter, ChapterContentType } from "./content/chapter.js";
import { Course, CourseContentType, CourseEntry } from "./content/course.js";
import { Exercise, ExerciseContentType } from "./content/exercise.js";
import { Lesson, LessonContentType } from "./content/lesson.js";
import { RootEntry, Root, RootContentType } from "./content/root.js";
import { Section, SectionContentType } from "./content/section.js";
import { Topic, TopicContentType } from "./content/topic.js";

interface ReindexResult {
  fetch: FetchResult;
  head: string;
}

export class KodimCms {
  private readonly ff: Filefish<RootEntry>;

  private constructor(ff: Filefish<RootEntry>) {
    this.ff = ff;
  }

  public static async load(
    contentPath: string,
    options: Partial<FilefishOptions> = {}
  ): Promise<KodimCms> {
    const ff = await filefish<RootEntry>(contentPath, RootContentType, options);
    return new KodimCms(ff!);
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
    if (root === 'forbidden' || root === 'not-found' || root === 'mismatch') {
      return null;
    }

    return root;
  }

  public async loadTopic(topicId: string): Promise<Topic | null> {
    const topic = await this.ff.loadContent(
      this.ff.rootCursor().navigate(topicId), TopicContentType
    );
    
    if (topic === 'forbidden' || topic === 'not-found' || topic === 'mismatch') {
      return null;
    }

    return topic;
  }

  public async loadCourse(topicId: string, courseId: string): Promise<Course | null> {
    const course = await this.ff.loadContent(
      this.ff.rootCursor().navigate(topicId, courseId), CourseContentType,
    );

    if (course === 'forbidden' || course === 'not-found' || course === 'mismatch') {
      return null;
    }

    return course;
  }

  public async loadChapter(
    topicId: string, courseId: string, chapterId: string
  ): Promise<Chapter | null> {
    const chapter = await this.ff.loadContent(
      this.ff.rootCursor().navigate(topicId, courseId, chapterId),
      ChapterContentType,
    );

    if (chapter === 'forbidden' || chapter === 'not-found' || chapter === 'mismatch') {
      return null;
    }

    return chapter;
  }

  public async loadLesson(
    topicId: string, courseId: string, chapterId: string, lessonId: string
  ): Promise<Lesson | null> {
    const lesson = await this.ff.loadContent(
      this.ff.rootCursor().navigate(topicId, courseId, chapterId, lessonId),
      LessonContentType,
    );

    if (lesson === 'forbidden' || lesson === 'not-found' || lesson === 'mismatch') {
      return null;
    }

    return lesson;
  }

  public async loadSection(
    topicId: string, courseId: string, chapterId: string, lessonId: string, sectionId: string,
  ): Promise<Section | null> {
    const lesson = await this.ff.loadContent(
      this.ff.rootCursor().navigate(topicId, courseId, chapterId, lessonId, sectionId),
      SectionContentType,
    );

    if (lesson === 'forbidden' || lesson === 'not-found' || lesson === 'mismatch') {
      return null;
    }

    return lesson;
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

    if (exercise === 'forbidden' || exercise === 'not-found' || exercise === 'mismatch') {
      return null;
    }

    return exercise;
  }

  public async reindexCourseFromRepo(
    repoUrl: string, branchName: string
  ): Promise<ReindexResult | 'not-found'> {
    const cursor = this.ff.rootCursor().search(
      (entry) => CourseContentType.fits(entry) && entry.repoUrl === repoUrl,
    );

    if (!cursor.isOk()) {
      return 'not-found';
    }

    const courseEntry = cursor.entry() as CourseEntry;

    const git = simpleGit({
      baseDir: courseEntry.fsNode.path,
      binary: 'git',
    });

    const fetchResult = await git.fetch('origin', branchName);
    const resetResult = await git.reset(ResetMode.HARD, [`origin/${branchName}`]);
    const result = await this.ff.reindex(cursor, CourseContentType);

    if (result === 'not-found' || result === 'mismatch') {
      return 'not-found';
    }

    return {
      fetch: fetchResult,
      head: resetResult,
    };
  }
}

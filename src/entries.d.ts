import { EntryAccess } from "./content/entry";

export interface EntryIndex {
  title?: string;
  access?: EntryAccess;
  draft?: boolean;
  author?: string | string[];
}

export interface ExerciseFrontMatter extends EntryIndex {
  demand: 1 | 2 | 3 | 4 | 5;
  offerSolution?: boolean;
}

export interface LessonSectionIndex extends EntryIndex {
  excs: string[];
}

export interface LessonIndex extends EntryIndex {
  lead: string;
  sections: string[];
}

export interface ChapterIndex extends EntryIndex {
  lead: string;
  lessons: string[];
}

export interface CourseIndex extends EntryIndex {
  lead: string;
  image: string;
  chapters: string[];
}

export interface CourseLink {
  link: string;
  branch: string;
  secret: string;
}

export interface DivisionIndex extends EntryIndex {
  lead: string;
  courses: CourseLink[];
}

export interface CoursesRootIndex extends EntryIndex {
  divisions: DivisionIndex[];
}

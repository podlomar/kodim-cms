export interface ExerciseFrontMatter {
  title: string;
  demand: 1 | 2 | 3 | 4 | 5;
}

export interface ExcsIndex {
  title: string;
  excs: string[];
}

export interface LessonIndex {
  title: string;
  lead: string;
  sections: string[];
}

export interface ChapterIndex {
  title: string;
  lead: string;
  lessons: string[];
}

export interface CourseIndex {
  title: string;
  lead: string;
  image: string;
  chapters: string[];
}

export interface DivisionIndex {
  title: string;
  lead: string;
  courses: string[];
}

export interface CoursesRootIndex {
  divisions: DivisionIndex[];
}

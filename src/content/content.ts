import { CoursesRootIndex, DivisionIndex } from "../entries";
import { ContentResource, createFailedRef, createFailedResource, createSuccessResource } from "./resource.js";
import { readIndexFile } from "./content-node.js";
import { Course, CourseProvider, CourseRef, createCourseRef, loadCourse } from "./course.js";
import { FailedEntry, SuccessEntry } from "./entry.js";
import { BaseResourceProvider, NotFoundProvider } from "./provider.js";

export interface Division<T extends Course | CourseRef = Course> {
  readonly title: string;
  readonly lead: string;
  readonly courses: T[],
}

export interface SuccessCoursesRoot extends SuccessEntry {
  divisions: Division[];
};

export type CoursesRoot = SuccessCoursesRoot | FailedEntry;

export type CoursesRootResource = ContentResource<{
  divisions: Division<CourseRef>[],
}>;

export const loadCoursesRoot = async (
  contentFolder: string,
  coursesFolder: string
): Promise<CoursesRoot> => {
  const index = await readIndexFile<CoursesRootIndex>(
    `${contentFolder}/${coursesFolder}`
  );

  if (index === 'not-found') {
    return { 
      type: 'failed', 
      link: coursesFolder,
      path: '/kurzy',
      fsPath: `${contentFolder}/kurzy`,
    };
  }
  

  const baseEntry: SuccessEntry = {
    type: 'success',
    fsPath: `${contentFolder}/kurzy`,
    path: '/kurzy',
    link: '',
    title: '',
  };

  let pos = 0;
  const divisions: (Division)[] = await Promise.all(
    index.divisions.map(async (divisionIndex: DivisionIndex) => ({
      title: divisionIndex.title,
      lead: divisionIndex.lead,
      courses: await Promise.all(
        divisionIndex.courses.map((courseFolder) => loadCourse(
          baseEntry, courseFolder)
        )
      )
    })
  ))

  return {
    ...baseEntry,
    divisions,
  }
}

export class CoursesRootProvider extends BaseResourceProvider<
  null, CoursesRoot, CourseProvider
> {
  public async fetch(): Promise<CoursesRootResource> {
    if (this.entry.type === 'failed') {
      return createFailedResource(this.entry, this.settings.baseUrl);
    }

    return {
      ...createSuccessResource(this.entry, this.crumbs, this.settings.baseUrl),
      divisions: this.entry.divisions.map(
        (division): Division<CourseRef> => ({
          ...division,
          courses: division.courses.map((course): CourseRef => {
            if (course.type === 'failed') {
              return createFailedRef(course, this.settings.baseUrl);
            }

            return createCourseRef(course, this.settings.baseUrl);
          })
        })
      )
    }
  }

  public find(link: string): CourseProvider | NotFoundProvider {
    if (this.entry.type === 'failed') {
      return new NotFoundProvider();
    }

    const courses = this.entry.divisions.flatMap(
      (division) => division.courses
    );
  
    const pos = courses.findIndex((c) => c.link === link);
    
    if (pos < 0) {
      return new NotFoundProvider();
    } 

    return new CourseProvider(
      this, 
      courses[pos], 
      pos, 
      [],
      this.settings
    );
  }
}
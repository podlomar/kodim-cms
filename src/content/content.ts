import { CoursesRootIndex, DivisionIndex } from "../entries";
import { Resource, createBrokenRef, createBrokenResource, createOkResource, createForbiddenRef } from "./resource.js";
import { readIndexFile } from "./content-node.js";
import { Course, CourseProvider, CourseRef, createCourseRef, loadCourse } from "./course.js";
import { BrokenEntry, createBaseEntry, SuccessEntry } from "./entry.js";
import { BaseResourceProvider, NoAccessProvider, NotFoundProvider, ResourceProvider } from "./provider.js";

export interface Division<T extends Course | CourseRef = Course> {
  readonly title: string;
  readonly lead: string;
  readonly courses: T[],
}

export interface SuccessCoursesRoot extends SuccessEntry {
  divisions: Division[];
};

export type CoursesRoot = SuccessCoursesRoot | BrokenEntry;

export type CoursesRootResource = Resource<{
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
      type: 'broken',
      ...createBaseEntry({ path: '/', fsPath: contentFolder }, coursesFolder),
      link: coursesFolder,
    };
  }
  
  const location = {
    fsPath: `${contentFolder}/kurzy`,
    path: '/kurzy',
  };

  let pos = 0;
  const divisions: (Division)[] = await Promise.all(
    index.divisions.map(async (divisionIndex: DivisionIndex) => ({
      title: divisionIndex.title,
      lead: divisionIndex.lead,
      courses: await Promise.all(
        divisionIndex.courses.map((courseFolder) => loadCourse(
          location, courseFolder)
        )
      )
    })
  ))

  return {
    type: 'success',
    location,
    link: '',
    title: '',
    divisions,
  }
}

export class CoursesRootProvider extends BaseResourceProvider<
  null, CoursesRoot, CourseProvider
> {
  public async fetch(): Promise<CoursesRootResource> {
    if (this.entry.type === 'broken') {
      return createBrokenResource(this.entry, this.crumbs, this.settings.baseUrl);
    }

    return {
      ...createOkResource(this.entry, this.crumbs, this.settings.baseUrl),
      divisions: this.entry.divisions.map(
        (division): Division<CourseRef> => ({
          ...division,
          courses: division.courses.map((course): CourseRef => {
            if (course.type === 'broken') {
              return createBrokenRef(course, this.settings.baseUrl);
            }

            const childAccess = this.access.step(course.link);
            if (!childAccess.accepts()) {
              return createForbiddenRef(course, this.settings.baseUrl);
            }
        
            return createCourseRef(course, this.settings.baseUrl);
          })
        })
      )
    }
  }

  public find(link: string): CourseProvider | NotFoundProvider | NoAccessProvider {
    if (this.entry.type === 'broken') {
      return new NotFoundProvider();
    }

    const courses = this.entry.divisions.flatMap(
      (division) => division.courses
    );
  
    const pos = courses.findIndex((c) => c.link === link);
    
    if (pos < 0) {
      return new NotFoundProvider();
    } 

    const childAccess = this.access.step(courses[pos].link);
    if (!childAccess.accepts()) {
      return new NoAccessProvider(courses[pos], this.settings);
    }

    return new CourseProvider(
      this,
      courses[pos], 
      pos, 
      [],
      childAccess,
      this.settings
    );
  }

  public findRepo(repoUrl: string): ResourceProvider | null {
    if (this.entry.type === 'broken') {
      return null;
    }

    const courses = this.entry.divisions.flatMap(
      (division) => division.courses
    );

    for(let i = 0; i < courses.length; i += 1) {
      const course = courses[i];
      if (course.type === 'success') {
        if (course.repo?.url === repoUrl) {
          return new CourseProvider(
            this,
            course,
            i,
            [],
            this.access.step(course.link),
            this.settings
          );
        }
      }
    }

    return null;
  }
}
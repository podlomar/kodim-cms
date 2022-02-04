import { CoursesRootIndex, DivisionIndex } from "../entries.js";
import { Resource, createBaseResource, createBaseRef } from "./resource.js";
import { readIndexFile } from "./content-node.js";
import { CourseEntry, CourseProvider, CourseRef, createCourseRef, loadCourse } from "./course.js";
import { createBaseEntry, Entry } from "./entry.js";
import { BaseResourceProvider, NotFoundProvider, ResourceProvider } from "./provider.js";

export interface Division<T extends CourseEntry | CourseRef = CourseEntry> {
  readonly title: string;
  readonly lead: string;
  readonly courses: T[],
}

export type CoursesRootEntry = Entry<{
  divisions: Division[];
}>;

export type CoursesRootResource = Resource<{
  divisions: Division<CourseRef>[],
}>;

export const loadCoursesRoot = async (
  contentFolder: string,
  coursesFolder: string
): Promise<CoursesRootEntry> => {
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
  null, CoursesRootEntry, CourseProvider
> {
  public async fetch(): Promise<CoursesRootResource> {
    const baseResource = createBaseResource(this.entry,
      this.crumbs,
      this.settings.baseUrl
    );
    
    if (!this.access.accepts()) {
      return {
        ...baseResource,
        status: 'forbidden',
        content: this.entry.type === 'broken' 
          ? { type: 'broken' } 
          : { type: 'public' }
      };
    }
    
    if (this.entry.type === 'broken') {
      return {
        ...baseResource,
        status: 'ok',
        content: {
          type: 'broken',
        }
      };
    }

    return {
      ...baseResource,
      status: 'ok',
      content: {
        type: 'full',
        divisions: this.entry.divisions.map(
          (division): Division<CourseRef> => ({
            ...division,
            courses: division.courses.map((course): CourseRef => {
              const childAccess = this.access.step(course.link);
              return createCourseRef(course, childAccess.accepts(), this.settings.baseUrl);
            })
          })
        )
      }
    }
  }

  public find(link: string): CourseProvider | NotFoundProvider {
    if (!this.access.accepts()) {
      return new NotFoundProvider();
    }
    
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

    const course = courses[pos];
    const allowedAssets = course.type === 'broken' ? [] : [course.image];

    return new CourseProvider(
      this,
      courses[pos], 
      pos, 
      [],
      this.access.step(courses[pos].link),
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
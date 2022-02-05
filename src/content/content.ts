import { CoursesRootIndex, DivisionIndex } from "../entries.js";
import { Resource, createBaseResource, createBaseRef } from "./resource.js";
import { readIndexFile } from "./content-node.js";
import { CourseEntry, CourseProvider, CourseRef, createCourseRef, loadCourse } from "./course.js";
import { createBaseEntry, createChildLocation, InnerEntry } from "./entry.js";
import { BaseResourceProvider, NotFoundProvider, ResourceProvider } from "./provider.js";

export interface Division<T extends CourseEntry | CourseRef = CourseEntry> {
  readonly title: string;
  readonly lead: string;
  readonly courses: T[],
}

export type CoursesRootEntry = InnerEntry<{ 
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

  const location = createChildLocation({ path: '', fsPath: contentFolder }, coursesFolder);

  if (index === 'not-found') {
    return { 
      nodeType: 'broken',
      ...createBaseEntry(location, coursesFolder, {}),
    };
  }

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
    nodeType: 'inner',
    ...createBaseEntry(
      location,
      '',
      {
        divisions,
      },
      '',
    ),
    subEntries: [],
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
        content: this.entry.nodeType === 'broken' 
          ? { type: 'broken' } 
          : { type: 'public' }
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

    return {
      ...baseResource,
      status: 'ok',
      content: {
        type: 'full',
        divisions: this.entry.props.divisions.map(
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
    
    if (this.entry.nodeType === 'broken') {
      return new NotFoundProvider();
    }

    const courses = this.entry.props.divisions.flatMap(
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
      this.access.step(courses[pos].link),
      this.settings
    );
  }

  public findRepo(repoUrl: string): ResourceProvider | null {
    if (this.entry.nodeType === 'broken') {
      return null;
    }

    const courses = this.entry.props.divisions.flatMap(
      (division) => division.courses
    );

    for(let i = 0; i < courses.length; i += 1) {
      const course = courses[i];
      if (course.nodeType === 'inner') {
        if (course.props.repo?.url === repoUrl) {
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
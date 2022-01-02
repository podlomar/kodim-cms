import { createFailedRef, createFailedResource, createSuccessResource } from "./resource.js";
import { readIndexFile } from "./content-node.js";
import { CourseProvider, createCourseRef, loadCourse } from "./course.js";
import { BaseResourceProvider, NotFoundProvider } from "./provider.js";
;
export const loadCoursesRoot = async (contentFolder, coursesFolder) => {
    const index = await readIndexFile(`${contentFolder}/${coursesFolder}`);
    if (index === 'not-found') {
        return {
            type: 'failed',
            link: coursesFolder,
            path: '/kurzy',
            fsPath: `${contentFolder}/kurzy`,
        };
    }
    const baseEntry = {
        type: 'success',
        fsPath: `${contentFolder}/kurzy`,
        path: '/kurzy',
        link: '',
        title: '',
    };
    let pos = 0;
    const divisions = await Promise.all(index.divisions.map(async (divisionIndex) => ({
        title: divisionIndex.title,
        lead: divisionIndex.lead,
        courses: await Promise.all(divisionIndex.courses.map((courseFolder) => loadCourse(baseEntry, courseFolder)))
    })));
    return Object.assign(Object.assign({}, baseEntry), { divisions });
};
export class CoursesRootProvider extends BaseResourceProvider {
    async fetch() {
        if (this.entry.type === 'failed') {
            return createFailedResource(this.entry, this.settings.baseUrl);
        }
        return Object.assign(Object.assign({}, createSuccessResource(this.entry, this.crumbs, this.settings.baseUrl)), { divisions: this.entry.divisions.map((division) => (Object.assign(Object.assign({}, division), { courses: division.courses.map((course) => {
                    if (course.type === 'failed') {
                        return createFailedRef(course, this.settings.baseUrl);
                    }
                    return createCourseRef(course, this.settings.baseUrl);
                }) }))) });
    }
    find(link) {
        if (this.entry.type === 'failed') {
            return new NotFoundProvider();
        }
        const courses = this.entry.divisions.flatMap((division) => division.courses);
        const pos = courses.findIndex((c) => c.link === link);
        if (pos < 0) {
            return new NotFoundProvider();
        }
        return new CourseProvider(this, courses[pos], pos, [], this.settings);
    }
}

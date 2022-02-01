import { createBrokenRef, createBrokenResource, createOkResource, createForbiddenRef } from "./resource.js";
import { readIndexFile } from "./content-node.js";
import { CourseProvider, createCourseRef, loadCourse } from "./course.js";
import { createBaseEntry } from "./entry.js";
import { BaseResourceProvider, NoAccessProvider, NotFoundProvider } from "./provider.js";
;
export const loadCoursesRoot = async (contentFolder, coursesFolder) => {
    const index = await readIndexFile(`${contentFolder}/${coursesFolder}`);
    if (index === 'not-found') {
        return Object.assign(Object.assign({ type: 'broken' }, createBaseEntry({ path: '/', fsPath: contentFolder }, coursesFolder)), { link: coursesFolder });
    }
    const location = {
        fsPath: `${contentFolder}/kurzy`,
        path: '/kurzy',
    };
    let pos = 0;
    const divisions = await Promise.all(index.divisions.map(async (divisionIndex) => ({
        title: divisionIndex.title,
        lead: divisionIndex.lead,
        courses: await Promise.all(divisionIndex.courses.map((courseFolder) => loadCourse(location, courseFolder)))
    })));
    return {
        type: 'success',
        location,
        link: '',
        title: '',
        divisions,
    };
};
export class CoursesRootProvider extends BaseResourceProvider {
    async fetch() {
        if (this.entry.type === 'broken') {
            return createBrokenResource(this.entry, this.crumbs, this.settings.baseUrl);
        }
        return Object.assign(Object.assign({}, createOkResource(this.entry, this.crumbs, this.settings.baseUrl)), { divisions: this.entry.divisions.map((division) => (Object.assign(Object.assign({}, division), { courses: division.courses.map((course) => {
                    if (course.type === 'broken') {
                        return createBrokenRef(course, this.settings.baseUrl);
                    }
                    const childAccess = this.access.step(course.link);
                    if (!childAccess.accepts()) {
                        return Object.assign(Object.assign({}, createForbiddenRef(course, this.settings.baseUrl)), { image: course.image, lead: course.lead });
                    }
                    return createCourseRef(course, this.settings.baseUrl);
                }) }))) });
    }
    find(link) {
        if (this.entry.type === 'broken') {
            return new NotFoundProvider();
        }
        const courses = this.entry.divisions.flatMap((division) => division.courses);
        const pos = courses.findIndex((c) => c.link === link);
        if (pos < 0) {
            return new NotFoundProvider();
        }
        const childAccess = this.access.step(courses[pos].link);
        if (!childAccess.accepts()) {
            return new NoAccessProvider(courses[pos], this.settings);
        }
        return new CourseProvider(this, courses[pos], pos, [], childAccess, this.settings);
    }
    findRepo(repoUrl) {
        var _a;
        if (this.entry.type === 'broken') {
            return null;
        }
        const courses = this.entry.divisions.flatMap((division) => division.courses);
        for (let i = 0; i < courses.length; i += 1) {
            const course = courses[i];
            if (course.type === 'success') {
                if (((_a = course.repo) === null || _a === void 0 ? void 0 : _a.url) === repoUrl) {
                    return new CourseProvider(this, course, i, [], this.access.step(course.link), this.settings);
                }
            }
        }
        return null;
    }
}

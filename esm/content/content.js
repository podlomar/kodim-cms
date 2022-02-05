import { createBaseResource } from "./resource.js";
import { readIndexFile } from "./content-node.js";
import { CourseProvider, createCourseRef, loadCourse } from "./course.js";
import { createBaseEntry, createChildLocation } from "./entry.js";
import { BaseResourceProvider, NotFoundProvider } from "./provider.js";
export const loadCoursesRoot = async (contentFolder, coursesFolder) => {
    const index = await readIndexFile(`${contentFolder}/${coursesFolder}`);
    const location = createChildLocation({ path: '', fsPath: contentFolder }, coursesFolder);
    if (index === 'not-found') {
        return Object.assign({ nodeType: 'broken' }, createBaseEntry(location, coursesFolder, {}));
    }
    let pos = 0;
    const divisions = await Promise.all(index.divisions.map(async (divisionIndex) => ({
        title: divisionIndex.title,
        lead: divisionIndex.lead,
        courses: await Promise.all(divisionIndex.courses.map((courseFolder) => loadCourse(location, courseFolder)))
    })));
    return Object.assign(Object.assign({ nodeType: 'inner' }, createBaseEntry(location, '', {
        divisions,
    }, '')), { subEntries: [] });
};
export class CoursesRootProvider extends BaseResourceProvider {
    async fetch() {
        const baseResource = createBaseResource(this.entry, this.crumbs, this.settings.baseUrl);
        if (!this.access.accepts()) {
            return Object.assign(Object.assign({}, baseResource), { status: 'forbidden', content: this.entry.nodeType === 'broken'
                    ? { type: 'broken' }
                    : { type: 'public' } });
        }
        if (this.entry.nodeType === 'broken') {
            return Object.assign(Object.assign({}, baseResource), { status: 'ok', content: {
                    type: 'broken',
                } });
        }
        return Object.assign(Object.assign({}, baseResource), { status: 'ok', content: {
                type: 'full',
                divisions: this.entry.props.divisions.map((division) => (Object.assign(Object.assign({}, division), { courses: division.courses.map((course) => {
                        const childAccess = this.access.step(course.link);
                        return createCourseRef(course, childAccess.accepts(), this.settings.baseUrl);
                    }) })))
            } });
    }
    find(link) {
        if (!this.access.accepts()) {
            return new NotFoundProvider();
        }
        if (this.entry.nodeType === 'broken') {
            return new NotFoundProvider();
        }
        const courses = this.entry.props.divisions.flatMap((division) => division.courses);
        const pos = courses.findIndex((c) => c.link === link);
        if (pos < 0) {
            return new NotFoundProvider();
        }
        return new CourseProvider(this, courses[pos], pos, [], this.access.step(courses[pos].link), this.settings);
    }
    findRepo(repoUrl) {
        var _a;
        if (this.entry.nodeType === 'broken') {
            return null;
        }
        const courses = this.entry.props.divisions.flatMap((division) => division.courses);
        for (let i = 0; i < courses.length; i += 1) {
            const course = courses[i];
            if (course.nodeType === 'inner') {
                if (((_a = course.props.repo) === null || _a === void 0 ? void 0 : _a.url) === repoUrl) {
                    return new CourseProvider(this, course, i, [], this.access.step(course.link), this.settings);
                }
            }
        }
        return null;
    }
}

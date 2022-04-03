import { createBaseResource } from "./resource.js";
import { readIndexFile } from "./content-node.js";
import { CourseProvider, createCourseRef, loadCourse } from "./course.js";
import { createBaseEntry, createBrokenEntry } from "./entry.js";
import { BaseResourceProvider, NotFoundProvider } from "./provider.js";
export const loadCoursesRoot = async (contentFolder, coursesFolder) => {
    const index = await readIndexFile(`${contentFolder}/${coursesFolder}`);
    const parentBase = {
        link: coursesFolder,
        title: '',
        path: '',
        fsPath: contentFolder,
        authors: [],
        access: 'public',
        draft: false,
    };
    if (index === 'not-found') {
        return createBrokenEntry(parentBase, coursesFolder);
    }
    const baseEntry = createBaseEntry(parentBase, index, coursesFolder);
    let pos = 0;
    const divisions = await Promise.all(index.divisions.map(async (divisionIndex) => {
        var _a;
        return ({
            title: (_a = divisionIndex.title) !== null && _a !== void 0 ? _a : 'Missing title!',
            lead: divisionIndex.lead,
            courses: await Promise.all(divisionIndex.courses.map((courseLink) => loadCourse(baseEntry, courseLink)))
        });
    }));
    return Object.assign(Object.assign({ nodeType: 'inner' }, baseEntry), { props: {
            divisions,
        }, subEntries: [] });
};
export class CoursesRootProvider extends BaseResourceProvider {
    async fetch() {
        const baseResource = createBaseResource(this.entry, this.crumbs, this.settings.baseUrl);
        if (!this.accessCheck.accepts()) {
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
                        const childAccess = this.accessCheck.step(course);
                        return createCourseRef(course, childAccess.accepts(), this.settings.baseUrl);
                    }) })))
            } });
    }
    find(link) {
        if (!this.accessCheck.accepts()) {
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
        return new CourseProvider(this, courses[pos], pos, [], this.accessCheck.step(courses[pos]), this.settings);
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
                    return new CourseProvider(this, course, i, [], this.accessCheck.step(course), this.settings);
                }
            }
        }
        return null;
    }
}

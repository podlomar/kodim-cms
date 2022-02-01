import { createBrokenEntry, createSuccessEntry } from "./entry.js";
import { createBrokenResource, createOkResource } from './resource.js';
import { findChild, readIndexFile } from "./content-node.js";
import { createLessonRef, LessonProvider, loadLesson } from "./lesson.js";
import { BaseResourceProvider, NoAccessProvider, NotFoundProvider } from "./provider.js";
export const loadChapter = async (parentLocation, folderName) => {
    const index = await readIndexFile(`${parentLocation.fsPath}/${folderName}`);
    if (index === 'not-found') {
        return createBrokenEntry(parentLocation, folderName);
    }
    const baseEntry = createSuccessEntry(parentLocation, folderName, index.title);
    const lessons = await Promise.all(index.lessons.map((lessonLink, idx) => loadLesson(baseEntry.location, lessonLink, idx)));
    return Object.assign(Object.assign({}, baseEntry), { lead: index.lead, lessons });
};
export class ChapterProvider extends BaseResourceProvider {
    async fetch() {
        if (this.entry.type === 'broken') {
            return createBrokenResource(this.entry, this.crumbs, this.settings.baseUrl);
        }
        return Object.assign(Object.assign({}, createOkResource(this.entry, this.crumbs, this.settings.baseUrl)), { lead: this.entry.lead, lessons: this.entry.lessons.map((lesson) => {
                const lessonAccess = this.access.step(lesson.link);
                return createLessonRef(lesson, lessonAccess.accepts(), this.settings.baseUrl);
            }) });
    }
    find(link) {
        if (this.entry.type === 'broken') {
            return new NotFoundProvider();
        }
        const result = findChild(this.entry.lessons, link);
        if (result === null) {
            return new NotFoundProvider();
        }
        const childAccess = this.access.step(result.child.link);
        if (!childAccess.accepts()) {
            return new NoAccessProvider(result.child, [], this.settings);
        }
        return new LessonProvider(this, result.child, result.pos, [...this.crumbs, {
                title: this.entry.title,
                path: this.entry.location.path
            }], childAccess, this.settings);
    }
    getNextLesson(pos) {
        if (this.entry.type === 'broken') {
            return null;
        }
        const lesson = this.entry.lessons[pos + 1];
        if (lesson === undefined) {
            return null;
        }
        const childAccess = this.access.step(lesson.link);
        return createLessonRef(lesson, childAccess.accepts(), this.settings.baseUrl);
    }
    getPrevLesson(pos) {
        if (this.entry.type === 'broken') {
            return null;
        }
        const lesson = this.entry.lessons[pos - 1];
        if (lesson === undefined) {
            return null;
        }
        const childAccess = this.access.step(lesson.link);
        return createLessonRef(lesson, childAccess.accepts(), this.settings.baseUrl);
    }
    findRepo(repoUrl) {
        return null;
    }
}

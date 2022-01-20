import { createFailedEntry, createSuccessEntry } from "./entry.js";
import { createFailedResource, createSuccessResource } from './resource.js';
import { findChild, readIndexFile } from "./content-node.js";
import { createLessonRef, LessonProvider, loadLesson } from "./lesson.js";
import { BaseResourceProvider, NotFoundProvider } from "./provider.js";
export const loadChapter = async (parentEntry, folderName) => {
    const index = await readIndexFile(`${parentEntry.fsPath}/${folderName}`);
    if (index === 'not-found') {
        return createFailedEntry(parentEntry, folderName);
    }
    const baseEntry = createSuccessEntry(parentEntry, folderName, index.title);
    const lessons = await Promise.all(index.lessons.map((lessonLink, idx) => loadLesson(baseEntry, lessonLink, idx)));
    return Object.assign(Object.assign({}, baseEntry), { lead: index.lead, lessons });
};
export class ChapterProvider extends BaseResourceProvider {
    async fetch() {
        if (this.entry.type === 'failed') {
            return createFailedResource(this.entry, this.settings.baseUrl);
        }
        return Object.assign(Object.assign({}, createSuccessResource(this.entry, this.crumbs, this.settings.baseUrl)), { lead: this.entry.lead, lessons: this.entry.lessons.map((lesson) => createLessonRef(lesson, this.settings.baseUrl)) });
    }
    find(link) {
        if (this.entry.type === 'failed') {
            return new NotFoundProvider();
        }
        const result = findChild(this.entry.lessons, link);
        if (result === null) {
            return new NotFoundProvider();
        }
        return new LessonProvider(this, result.child, result.pos, [...this.crumbs, {
                title: this.entry.title,
                path: this.entry.path
            }], this.settings);
    }
    getNextLesson(pos) {
        if (this.entry.type === 'failed') {
            return null;
        }
        const lesson = this.entry.lessons[pos + 1];
        if (lesson === undefined) {
            return null;
        }
        return createLessonRef(lesson, this.settings.baseUrl);
    }
    getPrevLesson(pos) {
        if (this.entry.type === 'failed') {
            return null;
        }
        const lesson = this.entry.lessons[pos - 1];
        if (lesson === undefined) {
            return null;
        }
        return createLessonRef(lesson, this.settings.baseUrl);
    }
    findRepo(repoUrl) {
        return null;
    }
}

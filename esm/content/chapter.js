import { createBrokenEntry, createSuccessEntry } from "./entry.js";
import { createBaseResource, createBaseRef } from './resource.js';
import { findChild, readIndexFile } from "./content-node.js";
import { createLessonRef, LessonProvider, loadLesson } from "./lesson.js";
import { BaseResourceProvider, NotFoundProvider } from "./provider.js";
export const loadChapter = async (parentLocation, folderName) => {
    const index = await readIndexFile(`${parentLocation.fsPath}/${folderName}`);
    if (index === 'not-found') {
        return createBrokenEntry(parentLocation, folderName);
    }
    const baseEntry = createSuccessEntry(parentLocation, folderName, index.title);
    const lessons = await Promise.all(index.lessons.map((lessonLink, idx) => loadLesson(baseEntry.location, lessonLink, idx)));
    return Object.assign(Object.assign({}, baseEntry), { lead: index.lead, lessons });
};
export const createChapterRef = (chapter, accessAllowed, baseUrl) => (Object.assign(Object.assign({}, createBaseRef(accessAllowed ? 'ok' : 'forbidden', chapter, baseUrl)), { publicContent: chapter.type === 'broken'
        ? 'broken'
        : {
            lead: chapter.lead,
        } }));
export class ChapterProvider extends BaseResourceProvider {
    async fetch() {
        const baseResource = createBaseResource(this.entry, this.crumbs, this.settings.baseUrl);
        if (!this.access.accepts()) {
            return Object.assign(Object.assign({}, baseResource), { status: 'forbidden', content: this.entry.type === 'broken'
                    ? {
                        type: 'broken',
                    } : {
                    type: 'public',
                    lead: this.entry.lead,
                } });
        }
        if (this.entry.type === 'broken') {
            return Object.assign(Object.assign({}, baseResource), { status: 'ok', content: {
                    type: 'broken',
                } });
        }
        const lessons = this.entry.lessons.map((lesson) => {
            const lessonAccess = this.access.step(lesson.link);
            return createLessonRef(lesson, lessonAccess.accepts(), this.settings.baseUrl);
        });
        return Object.assign(Object.assign({}, baseResource), { status: 'ok', content: {
                type: 'full',
                lead: this.entry.lead,
                lessons,
            } });
    }
    find(link) {
        if (!this.access.accepts()) {
            return new NotFoundProvider();
        }
        if (this.entry.type === 'broken') {
            return new NotFoundProvider();
        }
        const result = findChild(this.entry.lessons, link);
        if (result === null) {
            return new NotFoundProvider();
        }
        return new LessonProvider(this, result.child, result.pos, [...this.crumbs, {
                title: this.entry.title,
                path: this.entry.location.path
            }], this.access.step(result.child.link), this.settings);
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

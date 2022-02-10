import { createBaseEntry, createBrokenEntry } from "./entry.js";
import { createBaseResource, createBaseRef } from './resource.js';
import { findChild, readIndexFile } from "./content-node.js";
import { createLessonRef, LessonProvider, loadLesson } from "./lesson.js";
import { BaseResourceProvider, NotFoundProvider } from "./provider.js";
export const loadChapter = async (parentBase, folderName) => {
    const index = await readIndexFile(`${parentBase.fsPath}/${folderName}`);
    if (index === 'not-found') {
        return createBrokenEntry(parentBase, folderName);
    }
    const baseEntry = createBaseEntry(parentBase, index, folderName);
    const lessons = await Promise.all(index.lessons.map((lessonLink, idx) => loadLesson(baseEntry, lessonLink, idx)));
    return Object.assign(Object.assign({ nodeType: 'inner' }, baseEntry), { props: {
            lead: index.lead,
        }, subEntries: lessons });
};
export const createChapterRef = (chapter, accessAllowed, baseUrl) => (Object.assign(Object.assign({}, createBaseRef(accessAllowed ? 'ok' : 'forbidden', chapter, baseUrl)), { publicContent: chapter.nodeType === 'broken'
        ? 'broken'
        : {
            lead: chapter.props.lead,
        } }));
export class ChapterProvider extends BaseResourceProvider {
    async fetch() {
        const baseResource = createBaseResource(this.entry, this.crumbs, this.settings.baseUrl);
        if (!this.accessCheck.accepts()) {
            return Object.assign(Object.assign({}, baseResource), { status: 'forbidden', content: this.entry.nodeType === 'broken'
                    ? {
                        type: 'broken',
                    } : {
                    type: 'public',
                    lead: this.entry.props.lead,
                } });
        }
        if (this.entry.nodeType === 'broken') {
            return Object.assign(Object.assign({}, baseResource), { status: 'ok', content: {
                    type: 'broken',
                } });
        }
        const lessons = this.entry.subEntries.map((lesson) => {
            const accessCheck = this.accessCheck.step(lesson);
            return createLessonRef(lesson, accessCheck.accepts(), this.settings.baseUrl);
        });
        return Object.assign(Object.assign({}, baseResource), { status: 'ok', content: {
                type: 'full',
                lead: this.entry.props.lead,
                lessons,
            } });
    }
    find(link) {
        if (!this.accessCheck.accepts()) {
            return new NotFoundProvider();
        }
        if (this.entry.nodeType === 'broken') {
            return new NotFoundProvider();
        }
        const result = findChild(this.entry.subEntries, link);
        if (result === null) {
            return new NotFoundProvider();
        }
        return new LessonProvider(this, result.child, result.pos, [...this.crumbs, {
                title: this.entry.title,
                path: this.entry.path
            }], this.accessCheck.step(result.child), this.settings);
    }
    getNextLesson(pos) {
        if (this.entry.nodeType === 'broken') {
            return null;
        }
        const lesson = this.entry.subEntries[pos + 1];
        if (lesson === undefined) {
            return null;
        }
        const childAccess = this.accessCheck.step(lesson);
        return createLessonRef(lesson, childAccess.accepts(), this.settings.baseUrl);
    }
    getPrevLesson(pos) {
        if (this.entry.nodeType === 'broken') {
            return null;
        }
        const lesson = this.entry.subEntries[pos - 1];
        if (lesson === undefined) {
            return null;
        }
        const childAccess = this.accessCheck.step(lesson);
        return createLessonRef(lesson, childAccess.accepts(), this.settings.baseUrl);
    }
    findRepo(repoUrl) {
        return null;
    }
}

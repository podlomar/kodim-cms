import { createSuccessEntry, createFailedEntry } from "./entry.js";
import { createSuccessResource, createFailedResource, buildAssetPath, createFailedRef, createSuccessRef } from './resource.js';
import { ChapterProvider, loadChapter } from "./chapter.js";
import { findChild, readIndexFile } from "./content-node.js";
import { BaseResourceProvider } from "./provider.js";
import { createLessonRef } from "./lesson.js";
export const loadCourse = async (parentEntry, folderName) => {
    const index = await readIndexFile(`${parentEntry.fsPath}/${folderName}`);
    if (index === 'not-found') {
        return createFailedEntry(parentEntry, folderName);
    }
    const baseEntry = createSuccessEntry(parentEntry, folderName, index.title);
    const chapters = await Promise.all(index.chapters === undefined ? [] :
        index.chapters.map((chapterLink) => loadChapter(baseEntry, chapterLink)));
    return Object.assign(Object.assign({}, baseEntry), { image: index.image, lead: index.lead, chapters });
};
export const createCourseRef = (course, baseUrl) => {
    if (course.type === 'failed') {
        return createFailedRef(course, baseUrl);
    }
    return Object.assign(Object.assign({}, createSuccessRef(course, baseUrl)), { image: buildAssetPath(course.image, course, baseUrl), lead: course.lead });
};
export class CourseProvider extends BaseResourceProvider {
    async fetch() {
        if (this.entry.type === 'failed') {
            return createFailedResource(this.entry, this.settings.baseUrl);
        }
        return Object.assign(Object.assign({}, createSuccessResource(this.entry, this.crumbs, this.settings.baseUrl)), { image: buildAssetPath(this.entry.image, this.entry, this.settings.baseUrl), lead: this.entry.lead, chapters: this.entry.chapters.map((chapter) => {
                if (chapter.type === 'failed') {
                    return createFailedResource(chapter, this.settings.baseUrl);
                }
                return Object.assign(Object.assign({}, createSuccessResource(chapter, this.crumbs, this.settings.baseUrl)), { lead: chapter.lead, lessons: chapter.lessons.map((lesson) => createLessonRef(lesson, this.settings.baseUrl)) });
            }) });
    }
    find(link) {
        if (this.entry.type === 'failed') {
            return null;
        }
        const result = findChild(this.entry.chapters, link);
        if (result === null) {
            return null;
        }
        return new ChapterProvider(this, result.child, result.pos, [...this.crumbs, {
                title: this.entry.title,
                path: this.entry.path
            }], this.settings);
    }
}

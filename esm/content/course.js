import { existsSync } from "fs";
import simpleGit from 'simple-git';
import { createSuccessEntry, createBrokenEntry } from "./entry.js";
import { createOkResource, createBrokenResource, buildAssetPath, createBrokenRef, createOkRef, createForbiddenResource, createForbiddenRef } from './resource.js';
import { ChapterProvider, loadChapter } from "./chapter.js";
import { findChild, readIndexFile, readYamlFile } from "./content-node.js";
import { BaseResourceProvider, NoAccessProvider, NotFoundProvider } from "./provider.js";
import { createLessonRef } from "./lesson.js";
export const loadCourse = async (parentLocation, folderName) => {
    const index = await readIndexFile(`${parentLocation.fsPath}/${folderName}`);
    if (index === 'not-found') {
        return createBrokenEntry(parentLocation, folderName);
    }
    const isGitRepo = existsSync(`${parentLocation.fsPath}/${folderName}/.git`);
    let repo = null;
    if (isGitRepo) {
        const git = simpleGit({
            baseDir: `${parentLocation.fsPath}/${folderName}`,
            binary: 'git',
        });
        const url = await git.remote(['get-url', 'origin']);
        const repoParams = await readYamlFile(`${parentLocation.fsPath}/${folderName}/repo.yml`);
        if (repoParams === 'not-found') {
            repo = {
                url: url.trim(),
                branch: 'not-found',
                secret: 'not-found',
            };
        }
        else {
            repo = Object.assign({ url: url.trim() }, repoParams);
        }
        console.log('git repo', index.title, repo);
    }
    const baseEntry = createSuccessEntry(parentLocation, folderName, index.title);
    const chapters = await Promise.all(index.chapters === undefined ? [] :
        index.chapters.map((chapterLink) => loadChapter(baseEntry.location, chapterLink)));
    return Object.assign(Object.assign({}, baseEntry), { image: index.image, lead: index.lead, repo,
        chapters });
};
export const createCourseRef = (course, baseUrl) => {
    if (course.type === 'broken') {
        return createBrokenRef(course, baseUrl);
    }
    return Object.assign(Object.assign({}, createOkRef(course, baseUrl)), { image: buildAssetPath(course.image, course.location.path, baseUrl), lead: course.lead });
};
export class CourseProvider extends BaseResourceProvider {
    async reload() {
        const git = simpleGit({
            baseDir: this.entry.location.fsPath,
            binary: 'git',
        });
        const pullResult = await git.pull();
        console.log('pullResult', pullResult);
        const index = await readIndexFile(this.entry.location.fsPath);
        if (index === 'not-found') {
            return;
        }
        if (this.entry.type === 'broken') {
            return;
        }
        const chapters = await Promise.all(index.chapters === undefined ? [] :
            index.chapters.map((chapterLink) => loadChapter(this.entry.location, chapterLink)));
        this.entry.image = index.image;
        this.entry.lead = index.lead;
        this.entry.chapters = chapters;
    }
    async fetch() {
        if (this.entry.type === 'broken') {
            return createBrokenResource(this.entry, this.crumbs, this.settings.baseUrl);
        }
        return Object.assign(Object.assign({}, createOkResource(this.entry, this.crumbs, this.settings.baseUrl)), { image: buildAssetPath(this.entry.image, this.entry.location.path, this.settings.baseUrl), lead: this.entry.lead, chapters: this.entry.chapters.map((chapter) => {
                if (chapter.type === 'broken') {
                    return createBrokenResource(chapter, this.crumbs, this.settings.baseUrl);
                }
                const childAccess = this.access.step(chapter.link);
                if (!childAccess.accepts()) {
                    return createForbiddenResource(chapter, this.settings.baseUrl);
                }
                return Object.assign(Object.assign({}, createOkResource(chapter, this.crumbs, this.settings.baseUrl)), { lead: chapter.lead, lessons: chapter.lessons.map((lesson) => {
                        const lessonAccess = childAccess.step(lesson.link);
                        if (lessonAccess.accepts()) {
                            return createLessonRef(lesson, this.settings.baseUrl);
                        }
                        return createForbiddenRef(lesson, this.settings.baseUrl);
                    }) });
            }) });
    }
    find(link) {
        if (this.entry.type === 'broken') {
            return new NotFoundProvider();
        }
        const result = findChild(this.entry.chapters, link);
        if (result === null) {
            return new NotFoundProvider();
        }
        const childAccess = this.access.step(result.child.link);
        if (!childAccess.accepts()) {
            return new NoAccessProvider(result.child, this.settings);
        }
        return new ChapterProvider(this, result.child, result.pos, [...this.crumbs, {
                title: this.entry.title,
                path: this.entry.location.path
            }], childAccess, this.settings);
    }
    findRepo(repoUrl) {
        return null;
    }
}

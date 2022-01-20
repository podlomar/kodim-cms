import { existsSync } from "fs";
import simpleGit from 'simple-git';
import { createSuccessEntry, createFailedEntry } from "./entry.js";
import { createSuccessResource, createFailedResource, buildAssetPath, createFailedRef, createSuccessRef } from './resource.js';
import { ChapterProvider, loadChapter } from "./chapter.js";
import { findChild, readIndexFile, readYamlFile } from "./content-node.js";
import { BaseResourceProvider, NotFoundProvider } from "./provider.js";
import { createLessonRef } from "./lesson.js";
export const loadCourse = async (parentEntry, folderName) => {
    const index = await readIndexFile(`${parentEntry.fsPath}/${folderName}`);
    if (index === 'not-found') {
        return createFailedEntry(parentEntry, folderName);
    }
    const isGitRepo = existsSync(`${parentEntry.fsPath}/${folderName}/.git`);
    let repo = null;
    if (isGitRepo) {
        const git = simpleGit({
            baseDir: `${parentEntry.fsPath}/${folderName}`,
            binary: 'git',
        });
        const url = await git.remote(['get-url', 'origin']);
        const repoParams = await readYamlFile(`${parentEntry.fsPath}/${folderName}/repo.yml`);
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
    const baseEntry = createSuccessEntry(parentEntry, folderName, index.title);
    const chapters = await Promise.all(index.chapters === undefined ? [] :
        index.chapters.map((chapterLink) => loadChapter(baseEntry, chapterLink)));
    return Object.assign(Object.assign({}, baseEntry), { image: index.image, lead: index.lead, repo,
        chapters });
};
export const createCourseRef = (course, baseUrl) => {
    if (course.type === 'failed') {
        return createFailedRef(course, baseUrl);
    }
    return Object.assign(Object.assign({}, createSuccessRef(course, baseUrl)), { image: buildAssetPath(course.image, course, baseUrl), lead: course.lead });
};
export class CourseProvider extends BaseResourceProvider {
    async reload() {
        const git = simpleGit({
            baseDir: this.entry.fsPath,
            binary: 'git',
        });
        const pullResult = await git.pull();
        console.log('pullResult', pullResult);
        const index = await readIndexFile(this.entry.fsPath);
        if (index === 'not-found') {
            return;
        }
        if (this.entry.type === 'failed') {
            return;
        }
        const chapters = await Promise.all(index.chapters === undefined ? [] :
            index.chapters.map((chapterLink) => loadChapter(this.entry, chapterLink)));
        this.entry.image = index.image;
        this.entry.lead = index.lead;
        this.entry.chapters = chapters;
    }
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
            return new NotFoundProvider();
        }
        const result = findChild(this.entry.chapters, link);
        if (result === null) {
            return new NotFoundProvider();
        }
        return new ChapterProvider(this, result.child, result.pos, [...this.crumbs, {
                title: this.entry.title,
                path: this.entry.path
            }], this.settings);
    }
    findRepo(repoUrl) {
        return null;
    }
}

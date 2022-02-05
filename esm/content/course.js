import { existsSync } from "fs";
import simpleGit from 'simple-git';
import { createBaseEntry, createChildLocation } from "./entry.js";
import { createBaseResource, buildAssetPath, createBaseRef } from './resource.js';
import { ChapterProvider, createChapterRef, loadChapter } from "./chapter.js";
import { findChild, readIndexFile, readYamlFile } from "./content-node.js";
import { BaseResourceProvider, NotFoundProvider } from "./provider.js";
export const loadCourse = async (parentLocation, folderName) => {
    const index = await readIndexFile(`${parentLocation.fsPath}/${folderName}`);
    const location = createChildLocation(parentLocation, folderName);
    if (index === 'not-found') {
        return Object.assign({ nodeType: 'broken' }, createBaseEntry(location, folderName, {}));
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
    const chapters = await Promise.all(index.chapters === undefined ? [] :
        index.chapters.map((chapterLink) => loadChapter(location, chapterLink)));
    return Object.assign(Object.assign({ nodeType: 'inner' }, createBaseEntry(location, folderName, {
        image: index.image,
        lead: index.lead,
        repo,
    })), { subEntries: chapters });
};
export const createCourseRef = (courseEntry, accessAllowed, baseUrl) => (Object.assign(Object.assign({}, createBaseRef(accessAllowed ? 'ok' : 'forbidden', courseEntry, baseUrl)), { publicContent: courseEntry.nodeType === 'broken'
        ? 'broken'
        : {
            image: buildAssetPath(courseEntry.props.image, courseEntry.location.path, baseUrl),
            lead: courseEntry.props.lead,
        } }));
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
        if (this.entry.nodeType === 'broken') {
            return;
        }
        const chapters = await Promise.all(index.chapters === undefined ? [] :
            index.chapters.map((chapterLink) => loadChapter(this.entry.location, chapterLink)));
        this.entry.props.image = index.image;
        this.entry.props.lead = index.lead;
        this.entry.subEntries = chapters;
    }
    async fetch() {
        const baseResource = createBaseResource(this.entry, this.crumbs, this.settings.baseUrl);
        if (!this.access.accepts()) {
            return Object.assign(Object.assign({}, baseResource), { status: 'forbidden', content: this.entry.nodeType === 'broken'
                    ? {
                        type: 'broken',
                    } : {
                    type: 'public',
                    image: buildAssetPath(this.entry.props.image, this.entry.location.path, this.settings.baseUrl),
                    lead: this.entry.props.lead,
                } });
        }
        if (this.entry.nodeType === 'broken') {
            return Object.assign(Object.assign({}, baseResource), { status: 'ok', content: {
                    type: 'broken',
                } });
        }
        const chapters = this.entry.subEntries.map((chapter) => {
            const access = this.access.step(chapter.link);
            return createChapterRef(chapter, access.accepts(), this.settings.baseUrl);
        });
        return Object.assign(Object.assign({}, baseResource), { status: 'ok', content: {
                type: 'full',
                image: buildAssetPath(this.entry.props.image, this.entry.location.path, this.settings.baseUrl),
                lead: this.entry.props.lead,
                chapters,
            } });
    }
    find(link) {
        if (!this.access.accepts()) {
            return new NotFoundProvider();
        }
        if (this.entry.nodeType === 'broken') {
            return new NotFoundProvider();
        }
        const result = findChild(this.entry.subEntries, link);
        if (result === null) {
            return new NotFoundProvider();
        }
        return new ChapterProvider(this, result.child, result.pos, [...this.crumbs, {
                title: this.entry.title,
                path: this.entry.location.path
            }], this.access.step(result.child.link), this.settings);
    }
    findRepo(repoUrl) {
        return null;
    }
}

import { existsSync } from "fs";
import simpleGit from 'simple-git';
import { createBaseEntry, createBrokenEntry } from "./entry.js";
import { createBaseResource, buildAssetPath, createBaseRef } from './resource.js';
import { ChapterProvider, createChapterRef, loadChapter } from "./chapter.js";
import { findChild, readIndexFile, readYamlFile } from "./content-node.js";
import { BaseResourceProvider, NotFoundProvider } from "./provider.js";
export const loadCourse = async (parentBase, folderName) => {
    const index = await readIndexFile(`${parentBase.fsPath}/${folderName}`);
    if (index === 'not-found') {
        return createBrokenEntry(parentBase, folderName);
    }
    const isGitRepo = existsSync(`${parentBase.fsPath}/${folderName}/.git`);
    let repo = null;
    if (isGitRepo) {
        const git = simpleGit({
            baseDir: `${parentBase.fsPath}/${folderName}`,
            binary: 'git',
        });
        const url = await git.remote(['get-url', 'origin']);
        const repoParams = await readYamlFile(`${parentBase.fsPath}/${folderName}/repo.yml`);
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
    const baseEntry = createBaseEntry(parentBase, index, folderName);
    const chapters = await Promise.all(index.chapters === undefined ? [] :
        index.chapters.map((chapterLink) => loadChapter(baseEntry, chapterLink)));
    return Object.assign(Object.assign({ nodeType: 'inner' }, baseEntry), { props: {
            image: index.image,
            lead: index.lead,
            repo,
        }, subEntries: chapters });
};
export const createCourseRef = (courseEntry, accessAllowed, baseUrl) => (Object.assign(Object.assign({}, createBaseRef(accessAllowed ? 'ok' : 'forbidden', courseEntry, baseUrl)), { publicContent: courseEntry.nodeType === 'broken'
        ? 'broken'
        : {
            image: buildAssetPath(courseEntry.props.image, courseEntry.path, baseUrl),
            lead: courseEntry.props.lead,
        } }));
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
        if (this.entry.nodeType === 'broken') {
            return;
        }
        const chapters = await Promise.all(index.chapters === undefined ? [] :
            index.chapters.map((chapterLink) => loadChapter(this.entry, chapterLink)));
        this.entry.props.image = index.image;
        this.entry.props.lead = index.lead;
        this.entry.subEntries = chapters;
    }
    async fetch() {
        const baseResource = createBaseResource(this.entry, this.crumbs, this.settings.baseUrl);
        if (!this.accessCheck.accepts()) {
            return Object.assign(Object.assign({}, baseResource), { status: 'forbidden', content: this.entry.nodeType === 'broken'
                    ? {
                        type: 'broken',
                    } : {
                    type: 'public',
                    image: buildAssetPath(this.entry.props.image, this.entry.path, this.settings.baseUrl),
                    lead: this.entry.props.lead,
                } });
        }
        if (this.entry.nodeType === 'broken') {
            return Object.assign(Object.assign({}, baseResource), { status: 'ok', content: {
                    type: 'broken',
                } });
        }
        const chapters = this.entry.subEntries.map((chapter) => {
            const accessCheck = this.accessCheck.step(chapter);
            return createChapterRef(chapter, accessCheck.accepts(), this.settings.baseUrl);
        });
        return Object.assign(Object.assign({}, baseResource), { status: 'ok', content: {
                type: 'full',
                image: buildAssetPath(this.entry.props.image, this.entry.path, this.settings.baseUrl),
                lead: this.entry.props.lead,
                chapters,
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
        return new ChapterProvider(this, result.child, result.pos, [...this.crumbs, {
                title: this.entry.title,
                path: this.entry.path
            }], this.accessCheck.step(result.child), this.settings);
    }
    findRepo(repoUrl) {
        return null;
    }
}

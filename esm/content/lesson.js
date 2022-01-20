import { createFailedEntry, createSuccessEntry } from "./entry.js";
import { createSuccessResource, createFailedResource, createSuccessRef, createResourceRef, createFailedRef } from './resource.js';
import { findChild, readIndexFile } from "./content-node.js";
import { BaseResourceProvider, NotFoundProvider } from "./provider.js";
import { LessonSectionProvider, loadLessonSection } from "./lesson-section.js";
export const loadLesson = async (parentEntry, folderName, position) => {
    const index = await readIndexFile(`${parentEntry.fsPath}/${folderName}`);
    if (index === 'not-found') {
        return createFailedEntry(parentEntry, folderName);
    }
    const baseEntry = createSuccessEntry(parentEntry, folderName, index.title);
    const sections = await Promise.all(index.sections.map((sectionLink) => loadLessonSection(baseEntry, sectionLink)));
    return Object.assign(Object.assign({}, baseEntry), { num: position + 1, lead: index.lead, sections });
};
export const createLessonRef = (lesson, baseUrl) => {
    if (lesson.type === 'failed') {
        return createFailedRef(lesson, baseUrl);
    }
    return Object.assign(Object.assign({}, createSuccessRef(lesson, baseUrl)), { num: lesson.num, lead: lesson.lead });
};
export class LessonProvider extends BaseResourceProvider {
    getFirstSectionLink() {
        if (this.entry.type === 'failed') {
            return null;
        }
        if (this.entry.sections.length === 0) {
            return null;
        }
        return this.entry.sections[0].link;
    }
    async fetch(expandSection) {
        if (this.entry.type === 'failed') {
            return createFailedResource(this.entry, this.settings.baseUrl);
        }
        const sections = this.entry.sections.map((section) => createResourceRef(section, this.settings.baseUrl));
        const next = this.parent.getNextLesson(this.position);
        const prev = this.parent.getPrevLesson(this.position);
        const result = Object.assign(Object.assign({}, createSuccessResource(this.entry, this.crumbs, this.settings.baseUrl)), { num: this.entry.num, lead: this.entry.lead, sections,
            next,
            prev });
        if (expandSection === undefined) {
            return result;
        }
        const fullSectionLink = expandSection === 'first'
            ? this.getFirstSectionLink()
            : expandSection.link;
        if (fullSectionLink === null) {
            return result;
        }
        const fullSectionProvider = this.find(fullSectionLink);
        if (fullSectionProvider === null) {
            return result;
        }
        const fullSection = await fullSectionProvider.fetch();
        if (fullSection.type === 'not-found') {
            return result;
        }
        return Object.assign(Object.assign({}, result), { fullSection });
    }
    find(link) {
        if (this.entry.type === 'failed') {
            return new NotFoundProvider;
        }
        const result = findChild(this.entry.sections, link);
        if (result === null) {
            return new NotFoundProvider;
        }
        return new LessonSectionProvider(this, result.child, result.pos, [...this.crumbs, {
                title: this.entry.title,
                path: this.entry.path
            }], this.settings);
    }
    getNextSection(pos) {
        if (this.entry.type === 'failed') {
            return null;
        }
        const section = this.entry.sections[pos + 1];
        if (section === undefined) {
            return null;
        }
        return createResourceRef(section, this.settings.baseUrl);
    }
    getPrevSection(pos) {
        if (this.entry.type === 'failed') {
            return null;
        }
        const section = this.entry.sections[pos - 1];
        if (section === undefined) {
            return null;
        }
        return createResourceRef(section, this.settings.baseUrl);
    }
    findRepo(repoUrl) {
        return null;
    }
}

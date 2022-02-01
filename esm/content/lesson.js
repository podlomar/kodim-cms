import { createBrokenEntry, createSuccessEntry } from "./entry.js";
import { createOkResource, createBrokenResource, createOkRef, createResourceRef, createBrokenRef, createForbiddenRef } from './resource.js';
import { findChild, readIndexFile } from "./content-node.js";
import { BaseResourceProvider, NoAccessProvider, NotFoundProvider } from "./provider.js";
import { LessonSectionProvider, loadLessonSection } from "./lesson-section.js";
export const loadLesson = async (parentLocation, folderName, position) => {
    const index = await readIndexFile(`${parentLocation.fsPath}/${folderName}`);
    if (index === 'not-found') {
        return createBrokenEntry(parentLocation, folderName);
    }
    const baseEntry = createSuccessEntry(parentLocation, folderName, index.title);
    const sections = await Promise.all(index.sections.map((sectionLink) => loadLessonSection(baseEntry.location, sectionLink)));
    return Object.assign(Object.assign({}, baseEntry), { num: position + 1, lead: index.lead, sections });
};
export const createLessonRef = (lesson, baseUrl) => {
    if (lesson.type === 'broken') {
        return createBrokenRef(lesson, baseUrl);
    }
    return Object.assign(Object.assign({}, createOkRef(lesson, baseUrl)), { num: lesson.num, lead: lesson.lead });
};
export class LessonProvider extends BaseResourceProvider {
    getFirstSectionLink() {
        if (this.entry.type === 'broken') {
            return null;
        }
        if (this.entry.sections.length === 0) {
            return null;
        }
        return this.entry.sections[0].link;
    }
    async fetch(expandSection) {
        if (this.entry.type === 'broken') {
            return createBrokenResource(this.entry, this.crumbs, this.settings.baseUrl);
        }
        const sections = this.entry.sections.map((section) => {
            const sectionAccess = this.access.step(section.link);
            if (sectionAccess.accepts()) {
                return createResourceRef(section, this.settings.baseUrl);
            }
            return createForbiddenRef(section, this.settings.baseUrl);
        });
        const next = this.parent.getNextLesson(this.position);
        const prev = this.parent.getPrevLesson(this.position);
        const result = Object.assign(Object.assign({}, createOkResource(this.entry, this.crumbs, this.settings.baseUrl)), { num: this.entry.num, lead: this.entry.lead, sections,
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
        if (fullSection.status === 'not-found') {
            return result;
        }
        return Object.assign(Object.assign({}, result), { fullSection });
    }
    find(link) {
        if (this.entry.type === 'broken') {
            return new NotFoundProvider;
        }
        const result = findChild(this.entry.sections, link);
        if (result === null) {
            return new NotFoundProvider;
        }
        const childAccess = this.access.step(result.child.link);
        if (!childAccess.accepts()) {
            return new NoAccessProvider(result.child, this.settings);
        }
        return new LessonSectionProvider(this, result.child, result.pos, [...this.crumbs, {
                title: this.entry.title,
                path: this.entry.location.path
            }], childAccess, this.settings);
    }
    getNextSection(pos) {
        if (this.entry.type === 'broken') {
            return null;
        }
        const section = this.entry.sections[pos + 1];
        if (section === undefined) {
            return null;
        }
        const childAccess = this.access.step(section.link);
        if (!childAccess.accepts()) {
            return createForbiddenRef(section, this.settings.baseUrl);
        }
        return createResourceRef(section, this.settings.baseUrl);
    }
    getPrevSection(pos) {
        if (this.entry.type === 'broken') {
            return null;
        }
        const section = this.entry.sections[pos - 1];
        if (section === undefined) {
            return null;
        }
        const childAccess = this.access.step(section.link);
        if (!childAccess.accepts()) {
            return createForbiddenRef(section, this.settings.baseUrl);
        }
        return createResourceRef(section, this.settings.baseUrl);
    }
    findRepo(repoUrl) {
        return null;
    }
}

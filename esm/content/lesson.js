import { createBrokenEntry, createSuccessEntry } from "./entry.js";
import { createBaseResource, createBaseRef } from './resource.js';
import { findChild, readIndexFile } from "./content-node.js";
import { BaseResourceProvider, NotFoundProvider } from "./provider.js";
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
export const createLessonRef = (lesson, accessAllowed, baseUrl) => (Object.assign(Object.assign({}, createBaseRef(accessAllowed ? 'ok' : 'forbidden', lesson, baseUrl)), { publicContent: lesson.type === 'broken'
        ? 'broken'
        : {
            num: lesson.num,
            lead: lesson.lead,
        } }));
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
        const baseResource = createBaseResource(this.entry, this.crumbs, this.settings.baseUrl);
        if (!this.access.accepts()) {
            return Object.assign(Object.assign({}, baseResource), { status: 'forbidden', content: this.entry.type === 'broken'
                    ? {
                        type: 'broken',
                    } : {
                    type: 'public',
                    num: this.entry.num,
                    lead: this.entry.lead,
                } });
        }
        if (this.entry.type === 'broken') {
            return Object.assign(Object.assign({}, baseResource), { status: 'ok', content: {
                    type: 'broken',
                } });
        }
        const sections = this.entry.sections.map((section) => {
            const sectionAccess = this.access.step(section.link);
            return Object.assign(Object.assign({}, createBaseRef(sectionAccess.accepts() ? 'ok' : 'forbidden', section, this.settings.baseUrl)), { publicContent: section.type === 'broken' ? 'broken' : {} });
        });
        const next = this.parent.getNextLesson(this.position);
        const prev = this.parent.getPrevLesson(this.position);
        const content = {
            type: 'full',
            num: this.entry.num,
            lead: this.entry.lead,
            sections,
            next,
            prev,
        };
        if (expandSection === undefined) {
            return Object.assign(Object.assign({}, baseResource), { status: 'ok', content });
        }
        const fullSectionLink = expandSection === 'first'
            ? this.getFirstSectionLink()
            : expandSection.link;
        if (fullSectionLink === null) {
            return Object.assign(Object.assign({}, baseResource), { status: 'ok', content });
        }
        const fullSectionProvider = this.find(fullSectionLink);
        if (fullSectionProvider === null) {
            return Object.assign(Object.assign({}, baseResource), { status: 'ok', content });
        }
        const fullSection = await fullSectionProvider.fetch();
        if (fullSection.status === 'not-found') {
            return Object.assign(Object.assign({}, baseResource), { status: 'ok', content });
        }
        return Object.assign(Object.assign({}, baseResource), { status: 'ok', content: Object.assign(Object.assign({}, content), { fullSection }) });
    }
    find(link) {
        if (!this.access.accepts()) {
            return new NotFoundProvider();
        }
        if (this.entry.type === 'broken') {
            return new NotFoundProvider();
        }
        const result = findChild(this.entry.sections, link);
        if (result === null) {
            return new NotFoundProvider();
        }
        return new LessonSectionProvider(this, result.child, result.pos, [...this.crumbs, {
                title: this.entry.title,
                path: this.entry.location.path
            }], this.access.step(result.child.link), this.settings);
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
        return Object.assign(Object.assign({}, createBaseRef(childAccess.accepts() ? 'ok' : 'forbidden', section, this.settings.baseUrl)), { publicContent: section.type === 'broken' ? 'broken' : {} });
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
        return Object.assign(Object.assign({}, createBaseRef(childAccess.accepts() ? 'ok' : 'forbidden', section, this.settings.baseUrl)), { publicContent: section.type === 'broken' ? 'broken' : {} });
    }
    findRepo(repoUrl) {
        return null;
    }
}

import { createBaseEntry, createChildLocation } from "./entry.js";
import { createBaseResource, createBaseRef } from './resource.js';
import { findChild, readIndexFile } from "./content-node.js";
import { BaseResourceProvider, NotFoundProvider } from "./provider.js";
import { LessonSectionProvider, loadLessonSection } from "./lesson-section.js";
export const loadLesson = async (parentLocation, folderName, position) => {
    const index = await readIndexFile(`${parentLocation.fsPath}/${folderName}`);
    const location = createChildLocation(parentLocation, folderName);
    if (index === 'not-found') {
        return Object.assign({ nodeType: 'broken' }, createBaseEntry(location, folderName, {}));
    }
    const sections = await Promise.all(index.sections.map((sectionLink) => loadLessonSection(location, sectionLink)));
    return Object.assign(Object.assign({ nodeType: 'inner' }, createBaseEntry(location, folderName, {
        num: position + 1,
        lead: index.lead,
    }, index.title)), { subEntries: sections });
};
export const createLessonRef = (lesson, accessAllowed, baseUrl) => (Object.assign(Object.assign({}, createBaseRef(accessAllowed ? 'ok' : 'forbidden', lesson, baseUrl)), { publicContent: lesson.nodeType === 'broken'
        ? 'broken'
        : {
            num: lesson.props.num,
            lead: lesson.props.lead,
        } }));
export class LessonProvider extends BaseResourceProvider {
    getFirstSectionLink() {
        if (this.entry.nodeType === 'broken') {
            return null;
        }
        if (this.entry.subEntries.length === 0) {
            return null;
        }
        return this.entry.subEntries[0].link;
    }
    async fetch(expandSection) {
        const baseResource = createBaseResource(this.entry, this.crumbs, this.settings.baseUrl);
        if (!this.access.accepts()) {
            return Object.assign(Object.assign({}, baseResource), { status: 'forbidden', content: this.entry.nodeType === 'broken'
                    ? {
                        type: 'broken',
                    } : {
                    type: 'public',
                    num: this.entry.props.num,
                    lead: this.entry.props.lead,
                } });
        }
        if (this.entry.nodeType === 'broken') {
            return Object.assign(Object.assign({}, baseResource), { status: 'ok', content: {
                    type: 'broken',
                } });
        }
        const sections = this.entry.subEntries.map((section) => {
            const sectionAccess = this.access.step(section.link);
            return Object.assign(Object.assign({}, createBaseRef(sectionAccess.accepts() ? 'ok' : 'forbidden', section, this.settings.baseUrl)), { publicContent: section.nodeType === 'broken' ? 'broken' : {} });
        });
        const next = this.parent.getNextLesson(this.position);
        const prev = this.parent.getPrevLesson(this.position);
        const content = {
            type: 'full',
            num: this.entry.props.num,
            lead: this.entry.props.lead,
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
        if (this.entry.nodeType === 'broken') {
            return new NotFoundProvider();
        }
        const result = findChild(this.entry.subEntries, link);
        if (result === null) {
            return new NotFoundProvider();
        }
        return new LessonSectionProvider(this, result.child, result.pos, [...this.crumbs, {
                title: this.entry.title,
                path: this.entry.location.path
            }], this.access.step(result.child.link), this.settings);
    }
    getNextSection(pos) {
        if (this.entry.nodeType === 'broken') {
            return null;
        }
        const section = this.entry.subEntries[pos + 1];
        if (section === undefined) {
            return null;
        }
        const childAccess = this.access.step(section.link);
        return Object.assign(Object.assign({}, createBaseRef(childAccess.accepts() ? 'ok' : 'forbidden', section, this.settings.baseUrl)), { publicContent: section.nodeType === 'broken' ? 'broken' : {} });
    }
    getPrevSection(pos) {
        if (this.entry.nodeType === 'broken') {
            return null;
        }
        const section = this.entry.subEntries[pos - 1];
        if (section === undefined) {
            return null;
        }
        const childAccess = this.access.step(section.link);
        return Object.assign(Object.assign({}, createBaseRef(childAccess.accepts() ? 'ok' : 'forbidden', section, this.settings.baseUrl)), { publicContent: section.nodeType === 'broken' ? 'broken' : {} });
    }
    findRepo(repoUrl) {
        return null;
    }
}

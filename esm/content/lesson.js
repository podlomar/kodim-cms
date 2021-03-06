import { createBaseEntry, createBrokenEntry } from "./entry.js";
import { createBaseResource, createBaseRef } from './resource.js';
import { findChild, readIndexFile } from "./content-node.js";
import { BaseResourceProvider, NotFoundProvider } from "./provider.js";
import { LessonSectionProvider, loadLessonSection } from "./lesson-section.js";
export const loadLesson = async (parentBase, folderName, position) => {
    var _a;
    const index = await readIndexFile(`${parentBase.fsPath}/${folderName}`);
    if (index === 'not-found') {
        return createBrokenEntry(parentBase, folderName);
    }
    const baseEntry = createBaseEntry(parentBase, index, folderName);
    const sections = await Promise.all(((_a = index.sections) !== null && _a !== void 0 ? _a : []).map((sectionLink) => loadLessonSection(baseEntry, sectionLink)));
    return Object.assign(Object.assign({ nodeType: 'inner' }, baseEntry), { props: {
            num: position + 1,
            lead: index.lead,
        }, subEntries: sections });
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
    async fetch() {
        const baseResource = createBaseResource(this.entry, this.crumbs, this.settings.baseUrl);
        if (!this.accessCheck.accepts()) {
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
            const sectionAccess = this.accessCheck.step(section);
            return Object.assign(Object.assign({}, createBaseRef(sectionAccess.accepts() ? 'ok' : 'forbidden', section, this.settings.baseUrl)), { publicContent: section.nodeType === 'broken' ? 'broken' : {} });
        });
        const next = this.parent.getNextLesson(this.position);
        const prev = this.parent.getPrevLesson(this.position);
        return Object.assign(Object.assign({}, baseResource), { status: 'ok', content: {
                type: 'full',
                num: this.entry.props.num,
                lead: this.entry.props.lead,
                sections,
                next,
                prev,
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
        return new LessonSectionProvider(this, result.child, result.pos, [...this.crumbs, {
                title: this.entry.title,
                path: this.entry.path
            }], this.accessCheck.step(result.child), this.settings);
    }
    getNextSection(pos) {
        if (this.entry.nodeType === 'broken') {
            return null;
        }
        const section = this.entry.subEntries[pos + 1];
        if (section === undefined) {
            return null;
        }
        const childAccess = this.accessCheck.step(section);
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
        const childAccess = this.accessCheck.step(section);
        return Object.assign(Object.assign({}, createBaseRef(childAccess.accepts() ? 'ok' : 'forbidden', section, this.settings.baseUrl)), { publicContent: section.nodeType === 'broken' ? 'broken' : {} });
    }
    findRepo(repoUrl) {
        return null;
    }
}

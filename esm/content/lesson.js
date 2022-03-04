import { InnerEntry } from '../core/entry.js';
import { EntryLoader } from '../core/loader.js';
import { LessonSectionLoader } from './lesson-section.js';
export class LessonLoader extends EntryLoader {
    async loadEntry(common, index, position) {
        const lessonEntry = new LessonEntry(this.parentEntry, common, index, []);
        const sections = await new LessonSectionLoader(lessonEntry).loadMany(index.sections);
        lessonEntry.pushSubEntries(...sections);
        return lessonEntry;
    }
}
export class LessonEntry extends InnerEntry {
    getPublicAttrs(index) {
        return {
            num: this.common.position + 1,
            lead: index.lead,
        };
    }
    async fetchFullAttrs(index) {
        var _a, _b, _c, _d;
        const next = (_b = (_a = this.getNextSibling()) === null || _a === void 0 ? void 0 : _a.getRef()) !== null && _b !== void 0 ? _b : null;
        const prev = (_d = (_c = this.getPrevSibling()) === null || _c === void 0 ? void 0 : _c.getRef()) !== null && _d !== void 0 ? _d : null;
        return Object.assign(Object.assign({}, this.getPublicAttrs(index)), { sections: this.subEntries.map((entry) => entry.getRef()), next,
            prev });
    }
}

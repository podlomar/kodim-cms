import { FolderLoader } from '@filefish/core/dist/loader.js';
import { createBaseContent, createCrumbs } from './content.js';
import { LessonSectionLoader } from './lesson-section.js';
export class LessonEntry extends ParentEntry {
    constructor(base, subEntries) {
        super(base, subEntries);
    }
    getContentRef() {
        var _a, _b;
        return {
            status: 'ok',
            ...createBaseContent(this.base),
            publicContent: {
                num: this.index + 1,
                lead: ((_b = (_a = this.extra) === null || _a === void 0 ? void 0 : _a.lead) !== null && _b !== void 0 ? _b : 'no-lead').toString(),
            },
        };
    }
    async fetch() {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        return {
            ...createBaseContent(this.base),
            crumbs: createCrumbs(this),
            lead: ((_b = (_a = this.extra) === null || _a === void 0 ? void 0 : _a.lead) !== null && _b !== void 0 ? _b : 'no-lead').toString(),
            num: this.index + 1,
            sections: this.subEntries.map((subEntry) => subEntry.getContentRef()),
            prev: (_e = (_d = (_c = this.parent) === null || _c === void 0 ? void 0 : _c.getPrevSibling(this.index)) === null || _d === void 0 ? void 0 : _d.getContentRef()) !== null && _e !== void 0 ? _e : null,
            next: (_h = (_g = (_f = this.parent) === null || _f === void 0 ? void 0 : _f.getNextSibling(this.index)) === null || _g === void 0 ? void 0 : _g.getContentRef()) !== null && _h !== void 0 ? _h : null,
        };
    }
}
export class LessonLoader extends FolderLoader {
    async loadFolder(base, subNodes) {
        const subEntries = await new LessonSectionLoader().loadMany(subNodes);
        return new LessonEntry(base, subEntries);
    }
}

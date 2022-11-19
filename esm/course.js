import { FolderLoader } from '@filefish/core/dist/loader.js';
import { ChapterLoader } from './chapter.js';
import { createBaseContent } from './content.js';
export class CourseEntry extends ParentEntry {
    constructor(base, subEntries) {
        super(base, subEntries);
    }
    get division() {
        var _a, _b;
        return ((_b = (_a = this.extra) === null || _a === void 0 ? void 0 : _a.division) !== null && _b !== void 0 ? _b : 'no-division').toString();
    }
    getContentRef() {
        var _a, _b, _c, _d;
        return {
            status: 'ok',
            ...createBaseContent(this.base),
            publicContent: {
                division: this.division,
                image: ((_b = (_a = this.extra) === null || _a === void 0 ? void 0 : _a.image) !== null && _b !== void 0 ? _b : 'no-image').toString(),
                lead: ((_d = (_c = this.extra) === null || _c === void 0 ? void 0 : _c.lead) !== null && _d !== void 0 ? _d : 'no-lead').toString(),
            },
        };
    }
    async fetch() {
        var _a, _b, _c, _d;
        const chapters = await Promise.all(this.subEntries.map((entry) => entry.fetch()));
        return {
            ...createBaseContent(this.base),
            image: ((_b = (_a = this.extra) === null || _a === void 0 ? void 0 : _a.image) !== null && _b !== void 0 ? _b : 'no-image').toString(),
            lead: ((_d = (_c = this.extra) === null || _c === void 0 ? void 0 : _c.lead) !== null && _d !== void 0 ? _d : 'no-lead').toString(),
            chapters: await this.fetchChildren(),
        };
    }
}
export class CourseLoader extends FolderLoader {
    async loadFolder(base, subNodes) {
        const subEntries = await new ChapterLoader().loadMany(subNodes);
        return new CourseEntry(base, subEntries);
    }
}

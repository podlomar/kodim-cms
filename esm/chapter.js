import { FolderLoader } from '@filefish/core/dist/loader.js';
import { createBaseContent } from './content.js';
import { LessonLoader } from './lesson.js';
export class ChapterEntry extends ParentEntry {
    constructor(base, subEntries) {
        super(base, subEntries);
    }
    async fetch() {
        var _a, _b;
        return {
            ...createBaseContent(this.base),
            lead: ((_b = (_a = this.extra) === null || _a === void 0 ? void 0 : _a.lead) !== null && _b !== void 0 ? _b : 'no-lead').toString(),
            lessons: this.subEntries.map((subEntry) => subEntry.getContentRef()),
        };
    }
}
export class ChapterLoader extends FolderLoader {
    async loadFolder(base, subNodes) {
        const subEntries = await new LessonLoader().loadMany(subNodes);
        return new ChapterEntry(base, subEntries);
    }
}

import { InnerEntry } from '../core/entry.js';
import { EntryLoader } from '../core/loader.js';
export class ChapterLoader extends EntryLoader {
    async loadEntry(common, index, position) {
        return new ChapterEntry(this.parentEntry, common, index, []);
    }
}
export class ChapterEntry extends InnerEntry {
    getPublicAttrs(index) {
        return {
            lead: index.lead,
        };
    }
    async fetchFullAttrs(index) {
        const nextChapter = this.parentEntry.findSubEntryByPos(0);
        return Object.assign(Object.assign({}, this.getPublicAttrs(index)), { lessons: [] });
    }
}

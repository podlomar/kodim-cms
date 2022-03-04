import { ChapterLoader } from './chapter.js';
import { InnerEntry } from '../core/entry.js';
import { EntryLoader } from '../core/loader.js';
export class CourseLoader extends EntryLoader {
    async loadEntry(common, index, position) {
        const courseEntry = new CourseEntry(this.parentEntry, common, index, []);
        if (index === null) {
            return courseEntry;
        }
        const chapters = await new ChapterLoader(courseEntry).loadMany(index.chapters);
        courseEntry.pushSubEntries(...chapters);
        return courseEntry;
    }
}
export class CourseEntry extends InnerEntry {
    getPublicAttrs(index) {
        return {
            image: index.image,
            lead: index.lead,
        };
    }
    async fetchFullAttrs(index) {
        return Object.assign(Object.assign({}, this.getPublicAttrs(index)), { chapters: this.subEntries.map((entry) => entry.getRef()) });
    }
}

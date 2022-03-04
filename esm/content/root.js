import { InnerEntry } from '../core/entry.js';
import { EntryLoader } from '../core/loader.js';
import { CourseLoader } from './course.js';
import path from 'path';
export class RootLoader extends EntryLoader {
    constructor(contentFolder) {
        super(null);
        this.contentFolder = contentFolder;
    }
    buildFsPath(fileName) {
        return path.join(this.contentFolder, fileName);
    }
    async loadEntry(common, index, position) {
        const rootEntry = new RootEntry(null, common, index, []);
        const courseLoader = new CourseLoader(rootEntry);
        const courses = await Promise.all(index.divisions.map((divisionIndex) => (courseLoader.loadMany(divisionIndex.courses))));
        rootEntry.pushSubEntries(...courses.flat());
        return rootEntry;
    }
}
export class RootEntry extends InnerEntry {
    getPublicAttrs() {
        return {};
    }
    async fetchFullAttrs(index) {
        let lastIdx = 0;
        const divisions = [];
        index.divisions.forEach((divisionIndex) => {
            var _a;
            const courses = this.subEntries.slice(lastIdx, lastIdx + divisionIndex.courses.length);
            divisions.push({
                title: (_a = divisionIndex.title) !== null && _a !== void 0 ? _a : 'No Title',
                lead: divisionIndex.lead,
                courses: courses.map((course) => course.getRef()),
            });
            lastIdx += divisionIndex.courses.length;
        });
        return { divisions };
    }
}

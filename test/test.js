import { KodimCms } from '../esm/index.js';
import { RootContentType } from '../esm/content/root.js';
import { CourseContentType } from '../esm/content/course.js';

const cms = await KodimCms.load(
  '/home/podlomar/work/kodim.cz/content',
);

// const root = await cms.loadContent(cms.rootCursor(), RootContentType);
// const zakladyTs = await cms.loadContent(cms.rootCursor().descend('zaklady-ts'), CourseContentType);
// const courseEntry = cms.rootCursor().descend('zaklady-ts').entry();

console.log(cms.ff.summary());

// console.log(JSON.stringify(zakladyTs, null, 2));

// it('well formed content tree', () => {
//   assert.deepStrictEqual(rootProvider.getEntry(), contentTree);
// });

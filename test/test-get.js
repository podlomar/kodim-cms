import { KodimCms } from '../esm/index.js';

const cms = await KodimCms.load('test/content');

// const root = await cms.loadSection('spravne', 'kouzelna-kucharka', 'lekce', 'voda-bez-rizika', 'cv-vareni-vody');

// // console.log(JSON.stringify(cms.root(), null, 2));
// console.log(JSON.stringify(root, null, 2));

console.log(JSON.stringify(cms.repoRegistry, null, 2));

import { cms } from '../esm/index.js';

// console.log(JSON.stringify(cms.rootEntry, null, 2));
console.log(JSON.stringify(await cms.rootEntry.fetch(), null, 2));
import assert from 'assert';
import { AccessClaimCheck } from '../esm/content/access-check.js';
import { KodimCms } from '../esm/index.js';
import contentTree from './content/tree.js';

const cms = await KodimCms.load(
  '/home/podlomar/work/kodim.cz/kodim-cms-test-content',
);

const accessCheck = AccessClaimCheck.create({
  login: 'pokus',
  access: 'public',
});

const rootProvider = cms.getRoot(accessCheck);

it('well formed content tree', () => {
  assert.deepStrictEqual(rootProvider.getEntry(), contentTree);
});
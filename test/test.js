import assert from 'assert';
import { AccessClaimCheck } from '../esm/content/access-check.js';
import { KodimCms } from '../esm/index.js';
import contentTree from './content/tree.js';
import viden from './content/viden.js';

const cms = await KodimCms.load(
  '/home/podlomar/work/kodim.cz/kodim-cms-test-content',
);

const accessCheck = AccessClaimCheck.create({
  login: 'pokus',
  access: 'public',
});

const rootProvider = cms.getRoot(accessCheck);

it('well formed index tree', () => {
  assert.deepStrictEqual(rootProvider.getEntry(), contentTree);
});

it('well formed section content', async () => {
  const section = await rootProvider
    .find('zemepis')
    .find('evropa')
    .find('rakousko')
    .find('viden')
    .fetch();
  
  assert.deepStrictEqual(section, viden);
});

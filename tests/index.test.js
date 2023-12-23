import { describe } from 'mocha';
import { expect } from 'chai';
import { KodimCms } from '../esm/index.js';
import treeIndex from './expected/treeindex.json' assert { type: 'json' };
import rootExpected from './expected/rootcontent.json' assert { type: 'json' };

describe('Indexing', () => {
  it('Should index full content tree', async () => {
    const cms = await KodimCms.load('tests/content');
    expect(cms).to.be.instanceOf(KodimCms);
    expect(cms.root()).to.deep.equal(treeIndex);
  });
});

describe('Loading', () => {
  it('Should load root content', async () => {
    const cms = await KodimCms.load('tests/content');
    const rootContent = await cms.loadRoot();
    expect(rootContent).to.deep.equal(rootExpected);
  });
});


import { describe } from 'mocha';
import { expect } from 'chai';
import { KodimCms } from '../esm/index.js';
import treeIndex from './expected/treeindex.json' assert { type: 'json' };
import rootExpected from './expected/rootcontent.json' assert { type: 'json' };

const rootSource = {
  topics: [
    {
      name: 'spravne',
      title: 'Správné formátování',
      lead: 'Správně zformátovaný obsah je klíčovým prvkem ve světě psaného a tištěného textu, stejně jako v digitálním prostředí. Tento koncept se týká způsobu, jakým jsou informace, text a média prezentovány a uspořádány, aby byly snadno čitelné, esteticky příjemné a efektivní ve sdělení svého obsahu',
      courses: [
        {
          name: 'kouzelna-kucharka',
          folder: `./tests/content/kouzla/kouzelna-kucharka`,
          topic: 'spravne',
          organization: null,
          repo: null,
        },
        {
          name: 'boby',
          folder: `./tests/content/kouzla/boby`,
          topic: 'spravne',
          organization: null,
          repo: null,
        },
        {
          name: 'pruvodce-vesmirem',
          folder: `./tests/content/pruvodce-vesmirem`,
          topic: 'spravne',
          organization: null,
          repo: null,
        },
      ],
    },
  ]
};

describe('Indexing', () => {
  it('Should index full content tree', async () => {
    const cms = await KodimCms.load(rootSource);
    expect(cms).to.be.instanceOf(KodimCms);
    expect(cms.root()).to.deep.equal(treeIndex);
  });
});

describe('Loading', () => {
  it('Should load root content', async () => {
    const cms = await KodimCms.load(rootSource);
    const rootContent = await cms.loadRoot();
    expect(rootContent).to.deep.equal(rootExpected);
  });
});


import { describe } from 'mocha';
import { expect } from 'chai';
import dayjs from 'dayjs';
import { KodimCms } from '../esm/index.js';
import { agnosticAgent } from 'filefish/cursor';
import { matchAccessRule } from '../esm/access-control/match-access-rule.js';

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

const cms = await KodimCms.load(rootSource);
const cursor1 = cms.rootCursor(agnosticAgent).navigate('spravne');
const cursor2 = cms.rootCursor(agnosticAgent).navigate('spravne', 'kouzelna-kucharka');
const cursor3 = cms.rootCursor(agnosticAgent).navigate(
  'spravne', 'kouzelna-kucharka', 'lekce', 'voda-bez-rizika',
);

describe('Access rule matching', () => {
  it('Should match a simple rule', async () => {    
    const rule = {
      since: null,
      until: null,
      query: [
        {
          name: 'spravne',
          filter: null,
        },
      ],
    };
    
    expect(matchAccessRule(cursor1, rule)).to.be.true;
    expect(matchAccessRule(cursor2, rule)).to.be.false;
    expect(matchAccessRule(cursor3, rule)).to.be.false;
  });

  it('Should match a query with a wildcard', async () => {
    const rule = {
      since: null,
      until: null,
      query: [
        {
          name: '*',
          filter: null,
        },
      ],
    };

    expect(matchAccessRule(cursor1, rule)).to.be.true;
    expect(matchAccessRule(cursor2, rule)).to.be.false;
    expect(matchAccessRule(cursor3, rule)).to.be.false;
  });

  it('Should match a query with a deep wildcard', async () => {
    const rule = {
      since: null,
      until: null,
      query: [
        {
          name: '**',
          filter: null,
        },
      ],
    };

    expect(matchAccessRule(cursor1, rule)).to.be.true;
    expect(matchAccessRule(cursor2, rule)).to.be.true;
    expect(matchAccessRule(cursor3, rule)).to.be.true;
  });

  it('Should not match a query shorter than the entry path', async () => {
    const rule = {
      since: null,
      until: null,
      query: [
        {
          name: '*',
          filter: null,
        },
        {
          name: '*',
          filter: null,
        },
      ],
    };

    expect(matchAccessRule(cursor1, rule)).to.be.false;
    expect(matchAccessRule(cursor2, rule)).to.be.true;
    expect(matchAccessRule(cursor3, rule)).to.be.false;
  });

  it('Should match a query with a filter', async () => {
    const rule = {
      since: null,
      until: null,
      query: [
        {
          name: 'spravne',
          filter: {
            name: 'lead',
            op: '$=',
            value: 'obsahu',
          },
        },
      ],
    };

    expect(matchAccessRule(cursor1, rule)).to.be.true;
  });

  it('Should match a query with a since date', async () => {
    const rule = {
      since: '2024-01-01T08:00',
      until: null,
      query: [
        {
          name: 'spravne',
          filter: null,
        },
      ],
    };

    expect(matchAccessRule(cursor1, rule, dayjs('2024-01-01T08:00'))).to.be.true;
    expect(matchAccessRule(cursor1, rule, dayjs('2024-01-01T07:59'))).to.be.false;
  });

  it('Should match a query with an until date', async () => {
    const rule = {
      since: null,
      until: '2024-01-01T08:00',
      query: [
        {
          name: 'spravne',
          filter: null,
        },
      ],
    };

    expect(matchAccessRule(cursor1, rule, dayjs('2024-01-01T08:00'))).to.be.true;
    expect(matchAccessRule(cursor1, rule, dayjs('2024-01-01T08:01'))).to.be.false;
  });

  it('Should match a query with a since and until date', async () => {
    const rule = {
      since: '2024-01-01T08:00',
      until: '2024-01-01T09:00',
      query: [
        {
          name: 'spravne',
          filter: null,
        },
      ],
    };

    expect(matchAccessRule(cursor1, rule, dayjs('2024-01-01T08:00'))).to.be.true;
    expect(matchAccessRule(cursor1, rule, dayjs('2024-01-01T09:00'))).to.be.true;
    expect(matchAccessRule(cursor1, rule, dayjs('2024-01-01T09:01'))).to.be.false;
    expect(matchAccessRule(cursor1, rule, dayjs('2024-01-01T07:59'))).to.be.false;
  });

  it('Should much a complex rule', async () => {
    const rule = {
      since: null,
      until: null,
      query: [
        {
          name: '*',
          filter: {
            name: 'lead',
            op: '$=',
            value: 'obsahu',
          },
        },
        {
          name: 'kouzelna-kucharka',
          filter: null,
        },
        {
          name: '**',
          filter: null,
        }
      ],
    };
    
    expect(matchAccessRule(cursor1, rule)).to.be.false;
    expect(matchAccessRule(cursor2, rule)).to.be.true;
    expect(matchAccessRule(cursor3, rule)).to.be.true;
  });
});

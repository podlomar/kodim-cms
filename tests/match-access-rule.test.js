import { describe } from 'mocha';
import { expect } from 'chai';
import { KodimCms } from '../esm/index.js';
import { agnosticAgent } from 'filefish/cursor';
import { matchAccessRule } from '../esm/access-control/match-access-rule.js';

const cms = await KodimCms.load('tests/content');

describe('Access rule matching', () => {
  it('Should match a simple rule', async () => {    
    const rule = {
      after: null,
      until: null,
      query: [
        {
          name: '',
          filter: null,
        },
        {
          name: 'spravne',
          filter: null,
        },
      ],
    };
    
    const cursor = cms.rootCursor(agnosticAgent).navigate('spravne');
    expect(matchAccessRule(cursor, rule)).to.be.true;
  });

  it('Should match a query with a wildcard', async () => {
    const rule = {
      after: null,
      until: null,
      query: [
        {
          name: '',
          filter: null,
        },
        {
          name: '*',
          filter: null,
        },
      ],
    };
    const cursor = cms.rootCursor(agnosticAgent).navigate('spravne');
    expect(matchAccessRule(cursor, rule)).to.be.true;
  });

  it('Should match a query with a filter', async () => {
    const rule = {
      after: null,
      until: null,
      query: [
        {
          name: '',
          filter: null,
        },
        {
          name: 'spravne',
          filter: {
            name: 'heading',
            op: '$=',
            value: 'obsah',
          },
        },
      ],
    };

    const cursor = cms.rootCursor(agnosticAgent).navigate('spravne');
    expect(matchAccessRule(cursor, rule)).to.be.true;
  });
});

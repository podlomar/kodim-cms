import { describe } from 'mocha';
import { expect } from 'chai';
import { KodimCms } from '../esm/index.js';
import { agnosticAgent } from 'filefish/cursor';
import { matchQuery } from '../esm/access-control/match-query.js';

const cms = await KodimCms.load('tests/content');

describe('Entry query matching', () => {
  it('Should match a simple query', async () => {    
    const query = [
      {
        name: '',
        filter: null,
      },
      {
        name: 'spravne',
        filter: null,
      },
    ];
    const cursor = cms.rootCursor(agnosticAgent).navigate('spravne');
    expect(matchQuery(cursor, query)).to.be.true;
  });

  it('Should match a query with a wildcard', async () => {
    const query = [
      {
        name: '',
        filter: null,
      },
      {
        name: '*',
        filter: null,
      },
    ];
    const cursor = cms.rootCursor(agnosticAgent).navigate('spravne');
    expect(matchQuery(cursor, query)).to.be.true;
  });

  it('Should match a query with a filter', async () => {
    const query = [
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
    ];
    const cursor = cms.rootCursor(agnosticAgent).navigate('spravne');
    expect(matchQuery(cursor, query)).to.be.true;
  });
});

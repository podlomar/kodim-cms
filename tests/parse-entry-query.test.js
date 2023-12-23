import { describe } from 'mocha';
import { expect } from 'chai';
import { parseEntryQuery } from '../esm/access-control/parse-entry-query.js';

describe('EntryPattern parsing', () => {
  it('Should parse simple pattern', () => {
    const pattern = parseEntryQuery('/test');
    expect(pattern.isSuccess()).to.be.true;
    expect(pattern.get()).to.deep.equal([
      {
        name: 'test',
        filter: null,
      }
    ]);
  });

  it('Should parse pattern with filter', () => {
    const pattern = parseEntryQuery('/test[@title="Hello world"]');
    expect(pattern.isSuccess()).to.be.true;
    expect(pattern.get()).to.deep.equal([
      {
        name: 'test',
        filter: {
          name: 'title',
          op: '=',
          value: 'Hello world',
        },
      },
    ]);
  });

  it('Should parse pattern with whitespace', () => {
    const pattern = parseEntryQuery(' /  test [ @title = "Hello world" ]   ');
    expect(pattern.isSuccess()).to.be.true;
    expect(pattern.get()).to.deep.equal([
      {
        name: 'test',
        filter: {
          name: 'title',
          op: '=',
          value: 'Hello world',
        },
      },
    ]);
  });

  it('Should parse filter with null value', () => {
    const pattern = parseEntryQuery('/test[@title=null]');
    expect(pattern.isSuccess()).to.be.true;
    expect(pattern.get()).to.deep.equal([
      {
        name: 'test',
        filter: {
          name: 'title',
          op: '=',
          value: null,
        },
      },
    ]);
  });

  it('Should parse filter with boolean value', () => {
    const pattern1 = parseEntryQuery('/test[@title=true]');
    expect(pattern1.isSuccess()).to.be.true;
    expect(pattern1.get()).to.deep.equal([
      {
        name: 'test',
        filter: {
          name: 'title',
          op: '=',
          value: true,
        },
      },
    ]);

    const pattern2 = parseEntryQuery('/test[@title=false]');
    expect(pattern2.isSuccess()).to.be.true;
    expect(pattern2.get()).to.deep.equal([
      {
        name: 'test',
        filter: {
          name: 'title',
          op: '=',
          value: false,
        },
      },
    ]);
  });

  it('Should parse filter with number value', () => {
    const pattern1 = parseEntryQuery('/test[@title=42]');
    expect(pattern1.isSuccess()).to.be.true;
    expect(pattern1.get()).to.deep.equal([
      {
        name: 'test',
        filter: {
          name: 'title',
          op: '=',
          value: 42,
        },
      },
    ]);

    const pattern2 = parseEntryQuery('/test[@title=-42.15]');
    expect(pattern2.isSuccess()).to.be.true;
    expect(pattern2.get()).to.deep.equal([
      {
        name: 'test',
        filter: {
          name: 'title',
          op: '=',
          value: -42.15,
        },
      },
    ]);

    const pattern3 = parseEntryQuery('/test[@title=+.15]');
    expect(pattern3.isSuccess()).to.be.true;
    expect(pattern3.get()).to.deep.equal([
      {
        name: 'test',
        filter: {
          name: 'title',
          op: '=',
          value: 0.15,
        },
      },
    ]);
  });

  it('Should parse filter with string value with escaped characters', () => {
    const pattern = parseEntryQuery('/test[@title="Hello\\n\\t\\"world\\""]');
    expect(pattern.isSuccess()).to.be.true;
    expect(pattern.get()).to.deep.equal([
      {
        name: 'test',
        filter: {
          name: 'title',
          op: '=',
          value: 'Hello\n\t"world"',
        },
      },
    ]);
  });

  it('Should parse multiple patterns', () => {
    const pattern = parseEntryQuery('/test1/test2[@title="Hello world"]/test3[@num=42]');
    expect(pattern.isSuccess()).to.be.true;
    expect(pattern.get()).to.deep.equal([
      {
        name: 'test1',
        filter: null,
      },
      {
        name: 'test2',
        filter: {
          name: 'title',
          op: '=',
          value: 'Hello world',
        },
      },
      {
        name: 'test3',
        filter: {
          name: 'num',
          op: '=',
          value: 42,
        },
      },
    ]);
  });
});

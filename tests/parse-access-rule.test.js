import { describe } from 'mocha';
import { expect } from 'chai';
import { parseAccessRule } from '../esm/access-control/parse-access-rule.js';

describe('AccessRule parsing', () => {
  it('Should parse simple rule', () => {
    const rule = parseAccessRule('/test');
    expect(rule.isSuccess()).to.be.true;
    expect(rule.get()).to.deep.equal({
      after: null,
      until: null,
      query: [
        {
          name: 'test',
          filter: null,
        },
      ],
    });
  });

  it('Should parse rule with time range', () => {
    const ruleResult = parseAccessRule('after 2023-12-21T10:00 until 2023-12-21T20:00 /test');
    expect(ruleResult.isSuccess()).to.be.true;
    const rule = ruleResult.get();

    const after = rule.after.toISOString();
    const until = rule.until.toISOString();

    expect(after).to.equal('2023-12-21T09:00:00.000Z');
    expect(until).to.equal('2023-12-21T19:00:00.000Z');
    expect(rule.query).to.deep.equal([
      {
        name: 'test',
        filter: null,
      },
    ]);
  });

  it('Should parse rule with only after time limit', () => {
    const ruleResult = parseAccessRule('after 2023-12-21T10:00 /test');
    const rule = ruleResult.get();

    const after = rule.after.toISOString();

    expect(after).to.equal('2023-12-21T09:00:00.000Z');
    expect(rule.until).to.equal(null);
    expect(rule.query).to.deep.equal([
      {
        name: 'test',
        filter: null,
      },
    ]);
  });

  it('Should parse rule with only until time limit', () => {
    const ruleResult = parseAccessRule('until 2023-12-21T20:00 /test');
    const rule = ruleResult.get();

    const until = rule.until.toISOString();

    expect(until).to.equal('2023-12-21T19:00:00.000Z');
    expect(rule.after).to.equal(null);
    expect(rule.query).to.deep.equal([
      {
        name: 'test',
        filter: null,
      },
    ]);
  });
  
  it('Should parse rule with filter', () => {
    const rule = parseAccessRule('/test[@title="Hello world"]');
    expect(rule.isSuccess()).to.be.true;
    expect(rule.get()).to.deep.equal({
      after: null,
      until: null,
      query: [
        {
          name: 'test',
          filter: {
            name: 'title',
            op: '=',
            value: 'Hello world',
          },
        },
      ],
    });
  });

  it('Should parse rule with whitespace', () => {
    const rule = parseAccessRule(' /  test [ @title = "Hello world" ]   ');
    expect(rule.isSuccess()).to.be.true;
    expect(rule.get()).to.deep.equal({
      after: null,
      until: null,
      query: [
        {
          name: 'test',
          filter: {
            name: 'title',
            op: '=',
            value: 'Hello world',
          },
        },
      ],
    });
  });

  it('Should parse filter with null value', () => {
    const rule = parseAccessRule('/test[@title=null]');
    expect(rule.isSuccess()).to.be.true;
    expect(rule.get()).to.deep.equal({
      after: null,
      until: null,
      query: [
        {
          name: 'test',
          filter: {
            name: 'title',
            op: '=',
            value: null,
          },
        },
      ],
    });
  });

  it('Should parse filter with boolean value', () => {
    const rule1 = parseAccessRule('/test[@title=true]');
    expect(rule1.isSuccess()).to.be.true;
    expect(rule1.get()).to.deep.equal({
      after: null,
      until: null,
      query: [
        {
          name: 'test',
          filter: {
            name: 'title',
            op: '=',
            value: true,
          },
        },
      ],
    });

    const rule2 = parseAccessRule('/test[@title=false]');
    expect(rule2.isSuccess()).to.be.true;
    expect(rule2.get()).to.deep.equal({
      after: null,
      until: null,
      query: [
        {
          name: 'test',
          filter: {
            name: 'title',
            op: '=',
            value: false,
          },
        },
      ],
    });
  });

  it('Should parse filter with number value', () => {
    const rule1 = parseAccessRule('/test[@title=42]');
    expect(rule1.isSuccess()).to.be.true;
    expect(rule1.get()).to.deep.equal({
      after: null,
      until: null,
      query: [
        {
          name: 'test',
          filter: {
            name: 'title',
            op: '=',
            value: 42,
          },
        },
      ],
    });

    const rule2 = parseAccessRule('/test[@title=-42.15]');
    expect(rule2.isSuccess()).to.be.true;
    expect(rule2.get()).to.deep.equal({
      after: null,
      until: null,
      query: [
        {
          name: 'test',
          filter: {
            name: 'title',
            op: '=',
            value: -42.15,
          },
        },
      ],
    });

    const rule3 = parseAccessRule('/test[@title=+.15]');
    expect(rule3.isSuccess()).to.be.true;
    expect(rule3.get()).to.deep.equal({
      after: null,
      until: null,
      query: [
        {
          name: 'test',
          filter: {
            name: 'title',
            op: '=',
            value: 0.15,
          },
        },
      ],
    });
  });

  it('Should parse filter with string value with escaped characters', () => {
    const rule = parseAccessRule('/test[@title="Hello\\n\\t\\"world\\""]');
    expect(rule.isSuccess()).to.be.true;
    expect(rule.get()).to.deep.equal({
      after: null,
      until: null,
      query: [
        {
          name: 'test',
          filter: {
            name: 'title',
            op: '=',
            value: 'Hello\n\t"world"',
          },
        },
      ],
    });
  });

  it('Should parse multiple rules', () => {
    const rule = parseAccessRule('/test1/test2[@title="Hello world"]/test3[@num=42]');
    expect(rule.isSuccess()).to.be.true;
    expect(rule.get()).to.deep.equal({
      after: null,
      until: null,
      query: [
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
      ],
    });
  });
});

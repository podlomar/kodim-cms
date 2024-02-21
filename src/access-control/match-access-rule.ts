import { Dayjs } from "dayjs";
import { IndexEntry } from "filefish/indexer";
import { EntryPattern, AccessRule } from "./parse-access-rule.js";
import { Cursor } from "filefish/cursor";

export const matchEntry = (entry: IndexEntry, pattern: EntryPattern): boolean => {
  if (
    pattern.name !== entry.name &&
    pattern.name !== '*' &&
    pattern.name !== '**'
  ) {
    return false;
  }

  if (pattern.filter === null) {
    return true;
  }

  const filter = pattern.filter;
  // @ts-expect-error
  const propValue = entry.data[filter.name];

  if (filter.op === '=') {
    return propValue === filter.value;
  }

  if (filter.op === '!=') {
    return propValue !== filter.value;
  }

  if (typeof propValue === 'string' && typeof filter.value === 'string') {
    if (filter.op === '*=') {
      return propValue.includes(filter.value);
    }

    if (filter.op === '^=') {
      return propValue.startsWith(filter.value);
    }

    if (filter.op === '$=') {
      return propValue.endsWith(filter.value);
    }
  }

  if (typeof propValue === 'number' && typeof filter.value === 'number') {
    if (filter.op === '<') {
      return propValue < filter.value;
    }

    if (filter.op === '<=') {
      return propValue <= filter.value;
    }

    if (filter.op === '>') {
      return propValue > filter.value;
    }

    if (filter.op === '>=') {
      return propValue >= filter.value;
    }
  }

  return false;
}

export const matchAccessRule = (cursor: Cursor, rule: AccessRule, time: Dayjs): boolean => {
  if (rule.since !== null && time.isBefore(rule.since)) {
    return false;
  }
  
  if (rule.until !== null && time.isAfter(rule.until)) {
    return false;
  }

  const entryPath = cursor.path();
  const query = [{ name: '', filter: null }, ...rule.query];

  let patternIndex = 0;
  let pathIndex = 0;
  while (pathIndex < entryPath.length) {
    const patternPart = query[patternIndex];
    const pathItem = entryPath[pathIndex];

    if (patternPart === undefined) {
      return false;
    }

    if (!matchEntry(pathItem.entry, patternPart)) {
      return false;
    }

    if (patternPart.name !== '**') {
      patternIndex++;
    }

    pathIndex++;
  }

  return true;
};

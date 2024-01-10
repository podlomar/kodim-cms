import dayjs from "dayjs";
import { IndexEntry } from "filefish/indexer";
import { EntryPattern, AccessRule } from "./parse-access-rule.js";
import { Cursor } from "filefish/cursor";

export const matchEntry = (entry: IndexEntry, pattern: EntryPattern): boolean => {
  if (pattern.name !== entry.name && pattern.name !== '*') {
    return false;
  }

  if (pattern.filter === null) {
    return true;
  }

  const filter = pattern.filter;
  const propValue = entry.attrs[filter.name];

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

export const matchAccessRule = (cursor: Cursor, rule: AccessRule): boolean => {
  const today = dayjs();

  if (rule.after !== null && today.isBefore(rule.after)) {
    return false;
  }
  
  if (rule.until !== null && today.isAfter(rule.until)) {
    return false;
  }

  // FIXME: Accomodate for ** in the query
  const entryPath = cursor.path();
  const query = [{ name: '', filter: null }, ...rule.query];
  
  for (let i = 0; i < query.length; i++) {
    if (entryPath.length <= i) {
      return false;
    }

    const patternPart = query[i];
    const pathItem = entryPath[i];

    if (!matchEntry(pathItem.entry, patternPart)) {
      return false;
    }
  }

  return true;
};

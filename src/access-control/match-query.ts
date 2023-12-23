import { IndexEntry } from "filefish/indexer";
import { EntryPattern, EntryQuery } from "./parse-entry-query.js";
import { Cursor } from "filefish/cursor";

export const matchEntry = (entry: IndexEntry, pattern: EntryPattern): boolean => {
  if (pattern.name !== entry.name && pattern.name !== '*') {
    return false;
  }

  if (pattern.filter === null) {
    return true;
  }

  const filter = pattern.filter;
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

export const matchQuery = (cursor: Cursor, query: EntryQuery): boolean => {
  const entryPath = cursor.path();
  for (let i = 0; i < query.length; i++) {
    const patternPart = query[i];
    const pathItem = entryPath[i];

    if (!matchEntry(pathItem.entry, patternPart)) {
      return false;
    }
  }

  return true;
};

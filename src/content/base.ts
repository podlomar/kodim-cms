import { OkCursor } from "filefish/dist/cursor.js";
import { IndexEntry } from "filefish/dist/treeindex.js";
import { Crumbs, crumbsFromCursor } from "./crumbs.js";

export interface BaseShallowContent {
  readonly name: string;
  readonly title: string;
  readonly path: string;
}

export interface BaseContent extends BaseShallowContent {
  readonly crumbs: Crumbs;
}

export const buildBaseShallowContent = (
  cursor: OkCursor<IndexEntry>
): BaseShallowContent => {
  const entry = cursor.entry();
  return {
    name: entry.name,
    title: entry.title,
    path: cursor.contentPath(),
  };
};

export const buildBaseContent = (cursor: OkCursor<IndexEntry>): BaseContent => {
  return {
    ...buildBaseShallowContent(cursor),
    crumbs: crumbsFromCursor(cursor),
  };
};

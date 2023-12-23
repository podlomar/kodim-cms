import { Cursor } from "filefish/cursor";
import { IndexEntry } from "filefish/indexer";
import { Crumbs, crumbsFromCursor } from "./crumbs.js";

export interface BaseNavItem {
  readonly name: string;
  readonly title: string;
  readonly path: string;
}

export interface BaseContent extends BaseNavItem {
  readonly crumbs: Crumbs;
}

export const buildBaseNavItem = (cursor: Cursor<IndexEntry>): BaseNavItem => {
  const entry = cursor.entry();
  return {
    name: entry.name,
    title: entry.title,
    path: cursor.contentPath(),
  };
};

export const buildBaseContent = (cursor: Cursor): BaseContent => {
  return {
    ...buildBaseNavItem(cursor),
    crumbs: crumbsFromCursor(cursor),
  };
};

import { Cursor } from "filefish/dist/cursor.js";
import { IndexEntry } from "filefish/dist/treeindex.js";
import { ChapterContentType } from "./chapter.js";

export interface CrumbItem {
  readonly path: string;
  readonly title: string;
}

export type Crumbs = CrumbItem[];

export const crumbsFromCursor = (cursor: Cursor): Crumbs => {
  type CmsEntry = IndexEntry & { title?: string };
  
  const crumbs: Crumbs = [];
  
  let parent = cursor.parent();
  while (parent.isOk()) {
    const entry = parent.entry() as CmsEntry;
    if (ChapterContentType.fits(entry) && entry.name === 'lekce') {
      parent = parent.parent();
      continue;
    }  
    
    const title = entry.title ?? entry.name;
    const path = parent.contentPath();

    crumbs.push({ path, title });
    parent = parent.parent();
  }

  return crumbs.reverse().slice(1);
}

import { Cursor } from "filefish/dist/cursor.js";
import { ChapterContentType } from "./chapter.js";

export interface CrumbItem {
  readonly path: string;
  readonly title: string;
}

export type Crumbs = CrumbItem[];

export const crumbsFromCursor = (cursor: Cursor): Crumbs => {
  const crumbs: Crumbs = [];
  
  let parent = cursor.parent();
  while (parent.isOk()) {
    const entry = parent.entry();
    if (ChapterContentType.fits(parent) && entry.name === 'lekce') {
      parent = parent.parent();
      continue;
    }  
    
    const title = entry.title;
    const path = parent.contentPath()!;

    crumbs.push({ path, title });
    parent = parent.parent();
  }

  return crumbs.reverse().slice(1);
}

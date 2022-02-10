import { EntryIndex } from "../entries";

export type EntryAccess = 'public' | 'logged-in' | 'claim' | 'deny';

export interface BaseEntry {
  link: string;
  title: string;
  path: string,
  fsPath: string,
  authors: string[],
  draft: boolean,
  access: EntryAccess,
};

export const createBaseEntry = <Props>(
  parentBase: BaseEntry,
  index: EntryIndex,
  link: string,
  fsPath?: string,
): BaseEntry => {
  let authors = parentBase.authors;
  
  if (index.author !== undefined) {
    if (typeof index.author === 'string') {
      authors = [...authors, index.author];
    } else {
      authors = [...authors, ...index.author];
    }
  }

  return {
    link,
    title: index.title ?? link,
    path: `${parentBase.path}/${link}`,
    fsPath: fsPath ?? `${parentBase.fsPath}/${link}`,
    authors,
    draft: index.draft ?? false,
    access: index.access ?? parentBase.access,
  };
};

export interface OkLeafEntry<Props extends {}> extends BaseEntry {
  nodeType: 'leaf',
  props: Props,
}

export interface OkInnerEntry<
  Props extends {},
  SubEntry extends Entry = any
> extends BaseEntry {
  nodeType: 'inner',
  props: Props,
  subEntries: SubEntry[],
}

export interface BrokenEntry extends BaseEntry {
  nodeType: 'broken',
}

export const createBrokenEntry = (
  parentBase: BaseEntry,
  link: string,
  fsPath?: string,
): BrokenEntry => {

  return {
    nodeType: 'broken',
    link,
    title: link,
    path: `${parentBase.path}/${link}`,
    fsPath: fsPath ?? `${parentBase.fsPath}/${link}`,
    authors: parentBase.authors,
    draft: false,
    access: 'claim',
  };
};

export type LeafEntry<Props extends {} = {}> = OkLeafEntry<Props> | BrokenEntry;

export type InnerEntry<Props extends {} = {}, SubEntry extends Entry = any> = (
  | OkInnerEntry<Props, SubEntry>
  | BrokenEntry
);

export type Entry = OkLeafEntry<any> | OkInnerEntry<any> | BrokenEntry;
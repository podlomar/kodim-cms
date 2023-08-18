import { report } from "process";
import { EntryIndex } from "../entries";

export type EntryAccess = 'public' | 'logged-in' | 'claim' | 'deny';

export interface Repository {
  originUrl: string,
  baseUrl: string,
  branch: string,
  secret: string,
  entryFsPath: string,
}

export interface BaseEntry {
  link: string;
  title: string;
  path: string,
  fsPath: string,
  repository: Repository | null,
  authors: string[],
  draft: boolean,
  access: EntryAccess,
};

const removeGitExtension = (url: string): string => {
  if (url.endsWith('.git')) {
    return url.slice(0, -4);
  }
  return url;
}

export const createBaseEntry = <Props>(
  parentBase: BaseEntry,
  index: EntryIndex,
  link: string,
  repo?: {
    originUrl: string,
    branch: string,
    secret: string,
  } | null,
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

  const entryFsPath = fsPath ?? `${parentBase.fsPath}/${link}`;

  let repository = parentBase.repository;
  if (repo !== undefined && repo !== null) {
    repository = {
      ...repo,
      baseUrl: removeGitExtension(repo.originUrl),
      entryFsPath,
    }
  }

  return {
    link,
    title: index.title ?? link,
    path: `${parentBase.path}/${link}`,
    fsPath: entryFsPath,
    repository,
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
    repository: null,
    authors: parentBase.authors,
    draft: false,
    access: parentBase.access,
  };
};

export type LeafEntry<Props extends {} = {}> = OkLeafEntry<Props> | BrokenEntry;

export type InnerEntry<Props extends {} = {}, SubEntry extends Entry = any> = (
  | OkInnerEntry<Props, SubEntry>
  | BrokenEntry
);

export type Entry = OkLeafEntry<any> | OkInnerEntry<any> | BrokenEntry;
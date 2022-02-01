export interface EntryLocation {
  path: string;
  fsPath: string;
}

export interface BaseEntry {
  link: string;
  location: EntryLocation,
  title: string;
};

export const createBaseEntry = (
  parentLocation: EntryLocation,
  link: string, 
  title?: string,
  fsPath?: string,
): BaseEntry => ({
  link,
  location: {
    path: `${parentLocation.path}/${link}`,
    fsPath: fsPath ?? `${parentLocation.fsPath}/${link}`,
  },
  title: title ?? link,
});

export interface SuccessEntry extends BaseEntry {
  type: 'success',
}

export const createSuccessEntry = (
  parentLocation: EntryLocation, 
  link: string, 
  title?: string,
  fsPath?: string,
): SuccessEntry => ({
  type: 'success',
  ...createBaseEntry(parentLocation, link, title, fsPath),
});

export interface BrokenEntry extends BaseEntry {
  type: 'broken',
}

export const createBrokenEntry = (
  parentLocation: EntryLocation, 
  link: string,
  title?: string,
  fsPath?: string,
): BrokenEntry => ({
  type: 'broken',
  ...createBaseEntry(parentLocation, link, title, fsPath),
});

export type Entry = SuccessEntry | BrokenEntry;

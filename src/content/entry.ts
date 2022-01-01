export interface SuccessEntry {
  type: 'success',
  link: string,
  path: string,
  fsPath: string,
  title: string,
}

export interface FailedEntry {
  type: 'failed',
  link: string,
  path: string,
  fsPath: string,
}

export type Entry = SuccessEntry | FailedEntry;

export const createSuccessEntry = (
  parentEntry: SuccessEntry, 
  link: string, 
  title: string,
  fsPath?: string,
): SuccessEntry => ({
  type: 'success',
  link,
  title,
  path: `${parentEntry.path}/${link}`,
  fsPath: fsPath ?? `${parentEntry.fsPath}/${link}`,
});

export const createFailedEntry = (
  parentEntry: SuccessEntry, 
  link: string,
  fsPath?: string,
): FailedEntry => ({
  type: 'failed',
  link,
  path: `${parentEntry.path}/${link}`,
  fsPath: fsPath ?? `${parentEntry.fsPath}/${link}`,
});


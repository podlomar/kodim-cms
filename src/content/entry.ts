export interface EntryLocation {
  path: string;
  fsPath: string;
}

export const createChildLocation = (
  parentLocation: EntryLocation,
  link: string,
  fsPath?: string,
) => ({
  path: `${parentLocation.path}/${link}`,
  fsPath: fsPath ?? `${parentLocation.fsPath}/${link}`,
});

export interface BaseEntry<Props extends {} = any> {
  link: string;
  title: string;
  location: EntryLocation;
  props: Props;
};

export const createBaseEntry = <Props>(
  location: EntryLocation,
  link: string,
  props: Props,
  title?: string,
): BaseEntry<Props> => ({
  link,
  title: title ?? link,
  location,
  props,
});

export interface OkLeafEntry<Props extends {}> extends BaseEntry<Props> {
  nodeType: 'leaf',
}

export interface OkInnerEntry<
  Props extends {},
  SubEntry extends Entry = any
> extends BaseEntry<Props> {
  nodeType: 'inner',
  subEntries: SubEntry[],
}

export interface BrokenEntry extends BaseEntry {
  nodeType: 'broken',
}

export type LeafEntry<Props extends {} = {}> = OkLeafEntry<Props> | BrokenEntry;

export type InnerEntry<Props extends {} = {}, SubEntry extends Entry = any> = (
  | OkInnerEntry<Props, SubEntry>
  | BrokenEntry
);

export type Entry = OkLeafEntry<any> | OkInnerEntry<any> | BrokenEntry;
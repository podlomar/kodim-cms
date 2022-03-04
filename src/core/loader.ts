import { promises as fs } from "fs";
import yaml from "yaml";
import { EntryIndex } from "../entries";
import { EntryCommon, Entry, InnerEntry } from "./entry.js";

export const readYamlFile = async <T>(filePath: string): Promise<T | 'not-found'> => {
  try {
    const fileContent = await fs.readFile(filePath, "utf-8");
    return yaml.parse(fileContent) as T;
  } catch (err: any) {
    const { code } = err;
    if (code === 'ENOENT') {
      return 'not-found';
    } else {
      throw err;
    }
  }
};

export abstract class EntryLoader<
  IndexType extends EntryIndex,
  ParentEntry extends InnerEntry<any, any, any, any, any> | null,
  EntryType extends Entry<any, any, any, any, any>,
  > {
  protected readonly parentEntry: ParentEntry;

  public constructor(parentEntry: ParentEntry) {
    this.parentEntry = parentEntry;
  }

  public async loadOne(fileName: string, position: number): Promise<EntryType> {
    const parentBase = this.parentEntry === null
      ? {
        link: '',
        path: '',
        fsPath: '',
        baseUrl: 'http://localhost',
      }
      : this.parentEntry.getCommon();

    const path = `${parentBase.path}/${fileName}`;
    const fsPath = this.buildFsPath(fileName);
    const index = await this.loadIndex(fsPath);

    return this.loadEntry({
      link: fileName,
      path,
      fsPath,
      position,
      baseUrl: parentBase.baseUrl,
    }, index === 'not-found' ? null : index, position);
  }

  public async loadMany(
    fileNames: string[],
    startPosition: number = 0,
  ): Promise<EntryType[]> {
    return await Promise.all(
      fileNames.map((fileName: string, idx: number) => this.loadOne(
        fileName, startPosition + idx,
      ))
    );
  }

  protected buildFsPath(fileName: string): string {
    if (this.parentEntry === null) {
      return '';
    }

    return `${this.parentEntry.getCommon().fsPath}/${fileName}`;
  }

  protected async loadIndex(fsPath: string): Promise<IndexType | 'not-found'> {
    return readYamlFile<IndexType>(`${fsPath}/entry.yml`);
  }

  protected abstract loadEntry(
    common: EntryCommon, index: IndexType | null, position: number
  ): Promise<EntryType>;
}
import { promises as fs } from "fs";
import yaml from "yaml";
import { EntryIndex } from "../entries";
import { BaseEntry, BrokenEntry, createBaseEntry, createBrokenEntry, InnerEntry, LeafEntry } from "./entry.js";

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
  EntryType extends LeafEntry<any> | InnerEntry<any, any>
  > {
  public async loadOne(
    parentBase: BaseEntry, folderName: string, position: number,
  ): Promise<EntryType | BrokenEntry> {
    const fsPath = this.buildFsPath(parentBase, folderName);
    const index = await this.loadIndex(fsPath);

    if (index === 'not-found') {
      return createBrokenEntry(parentBase, folderName, fsPath);
    }

    const baseEntry = createBaseEntry(parentBase, index, folderName, fsPath);
    return this.loadEntry(baseEntry, index, position);
  }

  public async loadMany(
    parentBase: BaseEntry, folderNames: string[], startPosition: number = 0,
  ): Promise<(EntryType | BrokenEntry)[]> {
    return await Promise.all(
      folderNames.map((folderName: string, idx: number) => this.loadOne(
        parentBase, folderName, startPosition + idx,
      ))
    );
  }

  public async reload(
    entry: EntryType): Promise<EntryType | BrokenEntry> {
    const index = await this.loadIndex(entry.fsPath);

    if (index === 'not-found') {
      return createBrokenEntry(parentBase, folderName, fsPath);
    }

    const baseEntry = createBaseEntry(parentBase, index, folderName, fsPath);
    return this.loadEntry(baseEntry, index, position);
  }

  protected buildFsPath(parentBase: BaseEntry, folderName: string): string {
    return `${parentBase.fsPath}/${folderName}`;
  }

  protected async loadIndex(fsPath: string): Promise<IndexType | 'not-found'> {
    return readYamlFile<IndexType>(`${fsPath}/entry.yml`);
  }

  protected abstract loadEntry(
    baseEntry: BaseEntry, index: IndexType, position: number
  ): Promise<EntryType>;
}
import { promises as fs } from 'fs';
import path from 'path';
import yaml from 'yaml';

export const parseEntryFile = async <T extends {}>(folderPath: string): Promise<T> => {
  try {
    const entryFileContent = await fs.readFile(
      path.resolve(folderPath, 'entry.yml'), 'utf-8'
    );
    return yaml.parse(entryFileContent) ?? {};
  } catch (error) {
    return {} as T;
  }
};

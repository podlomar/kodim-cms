import { promises as fs } from "fs";
import yaml from "yaml";
import { Entry } from "./entry.js";

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

export const readIndexFile = async <T>(folderPath: string): Promise<T | 'not-found'> =>
  readYamlFile(`${folderPath}/index.yml`);

export const findChild = <T extends Entry>(
  children: T[], link: string
): { child: T, pos: number } | null => {
  const position = children.findIndex((child) => child.link === link);

  if (position < 0) {
    return null;
  }

  return {
    child: children[position],
    pos: position,
  };
}

import { Entry } from "./entry.js";
export declare const readYamlFile: <T>(filePath: string) => Promise<"not-found" | T>;
export declare const readIndexFile: <T>(folderPath: string) => Promise<"not-found" | T>;
export declare const findChild: <T extends Entry>(children: T[], link: string) => {
    child: T;
    pos: number;
} | null;

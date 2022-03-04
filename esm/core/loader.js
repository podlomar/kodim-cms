import { promises as fs } from "fs";
import yaml from "yaml";
export const readYamlFile = async (filePath) => {
    try {
        const fileContent = await fs.readFile(filePath, "utf-8");
        return yaml.parse(fileContent);
    }
    catch (err) {
        const { code } = err;
        if (code === 'ENOENT') {
            return 'not-found';
        }
        else {
            throw err;
        }
    }
};
export class EntryLoader {
    constructor(parentEntry) {
        this.parentEntry = parentEntry;
    }
    async loadOne(fileName, position) {
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
    async loadMany(fileNames, startPosition = 0) {
        return await Promise.all(fileNames.map((fileName, idx) => this.loadOne(fileName, startPosition + idx)));
    }
    buildFsPath(fileName) {
        if (this.parentEntry === null) {
            return '';
        }
        return `${this.parentEntry.getCommon().fsPath}/${fileName}`;
    }
    async loadIndex(fsPath) {
        return readYamlFile(`${fsPath}/entry.yml`);
    }
}

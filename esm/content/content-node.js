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
export const readIndexFile = async (folderPath) => readYamlFile(`${folderPath}/index.yml`);
export const findChild = (children, link) => {
    const position = children.findIndex((child) => child.link === link);
    if (position < 0) {
        return null;
    }
    return {
        child: children[position],
        pos: position,
    };
};

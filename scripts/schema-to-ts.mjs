import { readFileSync, createWriteStream } from 'fs';
import yaml from 'yaml';
import { compile, compileFromFile } from 'json-schema-to-typescript';
import { globby } from 'globby';

const filePaths = await globby("../src/schemas/*.yml");  

const stream = createWriteStream("../src/entries.d.ts", "utf-8");

for(const filePath of filePaths) {
  const schema = yaml.parse(readFileSync(filePath, 'utf-8'));
  const compiledType = await compile(
    schema, 
    'MySchema',
    {
      bannerComment: null,
    }
  );

  stream.write(compiledType);
  stream.write('\n');
}

stream.close();




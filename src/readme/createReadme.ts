import * as fs from 'fs/promises';
import * as path from 'path';

import { generateTree } from './generateProjetTree';
import { readmeContent } from './readmeContentGenerator';

export const createReadme = async (repoPath: string): Promise<string> => {
  try {
    const pkgPath = path.join(repoPath, 'package.json');
    const pkgFile: string = await fs.readFile(pkgPath, 'utf-8');
    const pkg = JSON.parse(pkgFile);
    const guidePath = path.join(repoPath, 'repo-guide');
    try {
      await fs.access(guidePath);
    } catch {
      await fs.mkdir(guidePath, { recursive: true });
    }
    const projectTree = await generateTree(repoPath);
    const content = readmeContent(pkg, projectTree);
    await fs.writeFile(path.join(guidePath, 'README.md'), content, 'utf-8');
    console.log(`Guide generated at: ${guidePath}`);
    return guidePath;
  } catch (err: any) {
    console.log(`Couldn't create the readme file`, err.message);
    process.exit(1);
  }
};

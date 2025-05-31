import * as fs from 'fs/promises';
import * as path from 'path';

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
    const content = readmeContent(pkg);
    await fs.writeFile(path.join(guidePath, 'README.md'), content, 'utf-8');
    console.log('readme.md created');
    return guidePath;
  } catch (err: any) {
    throw new Error('Could not create readme.md');
  }
};

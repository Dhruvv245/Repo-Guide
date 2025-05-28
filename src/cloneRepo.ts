import * as fs from 'fs';
import * as path from 'path';
import simpleGit, { SimpleGit } from 'simple-git';

const git: SimpleGit = simpleGit();

export const cloneRepo = async (repoUrl: string, outDir: string): Promise<string> => {
  try {
    const projectRoot = path.resolve();
    const outputDirFullPath = path.join(projectRoot, outDir);
    if (!fs.existsSync(outputDirFullPath)) {
      fs.mkdirSync(outputDirFullPath, { recursive: true });
    }
    console.log(`Cloning ${repoUrl} into ${outDir}...`);
    await git.clone(repoUrl, outputDirFullPath);
    console.log('Clone completed!');
    return outputDirFullPath;
  } catch (err: any) {
    console.error('Failed to clone', err.message);
    process.exit(1);
  }
};


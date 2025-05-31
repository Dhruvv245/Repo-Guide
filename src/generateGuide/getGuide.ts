import { createCodeSummary } from './code-summary/createCodeSummary.ts';
import { createReadme } from './readme/createReadme';
import { createStructure } from './structure/createStructure';
import { generateTree } from './utils/generateRepoTree.js';
import { getAllCodeFiles } from './utils/getCodeFiles';

export const getGuide = async (repoPath: string): Promise<string> => {
  try {
    const projectTree = await generateTree(repoPath);
    const files = await getAllCodeFiles(repoPath);
    const guidePath = await createReadme(repoPath);
    await createStructure(repoPath, guidePath,projectTree);
    await createCodeSummary(guidePath, files);
    return guidePath;
  } catch (err: any) {
    console.log('An error occurred', err.message);
    process.exit(1);
  }
};

import { createCodeSummary } from './code-summary/createCodeSummary.ts';
import { getArchitecture } from './generateArchitecture/architecture.js';
import { createReadme } from './readme/createReadme';
import { createStructure } from './structure/createStructure';
import { getGuideTemp } from './temp/temp.js';
import { generateTree } from './utils/generateRepoTree.js';
import { getAllCodeFiles } from './utils/getCodeFiles';

export const getGuide = async (repoPath: string): Promise<string> => {
  try {
    const projectTree = await generateTree(repoPath);
    const files = await getAllCodeFiles(repoPath);
    const guidePath = await createReadme(repoPath);
    await createStructure(guidePath,projectTree);
    await createCodeSummary(guidePath, files);
    await getArchitecture(repoPath, guidePath);
    await getGuideTemp(repoPath);
    return guidePath;
  } catch (err: any) {
    console.log('An error occurred', err.message);
    process.exit(1);
  }
};

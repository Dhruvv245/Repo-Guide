import { createReadme } from './readme/createReadme';
import { createStructure } from './structure/createStructure';

export const getGuide = async (repoPath: string): Promise<string> => {
  try {
    const guidePath = await createReadme(repoPath);
    const structurePath = await createStructure(repoPath, guidePath);
    return guidePath;
  } catch (err: any) {
    console.log('An error occurred', err.message);
    process.exit(1);
  }
};

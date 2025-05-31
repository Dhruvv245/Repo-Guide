import * as fs from 'fs/promises';
import * as path from 'path';
import { generateTree } from '../utils/generateRepoTree';

/**
 * Creates a markdown file (`structure.md`) that documents the structure of a repository.
 *
 * @param {string} repoPath - The path to the repository whose structure is to be documented.
 * @param {string} guidePath - The path where the `structure.md` file will be created.
 * @returns {Promise<string>} - The path to the created `structure.md` file.
 * @throws {Error} - Throws an error if the file creation fails.
 */
export const createStructure = async (repoPath: string, guidePath: string): Promise<string> => {
  try {
    const structurePath = path.join(guidePath, 'structure.md');
    const tree = await generateTree(repoPath);
    await fs.mkdir(guidePath, { recursive: true });
    await fs.writeFile(structurePath, `# 📂 Project Structure\n\n\`\`\`\n${tree}\n\`\`\`\n`);
    return structurePath;
  } catch (err: any) {
    throw new Error(`Failed to create structure.md`);
  }
};

import * as fs from 'fs/promises';
import * as path from 'path';

export const createStructure = async (guidePath: string,tree:string) => {
  try {
    const structurePath = path.join(guidePath, 'structure.md');
    await fs.mkdir(guidePath, { recursive: true });
    await fs.writeFile(structurePath, `# 📂 Project Structure\n\n\`\`\`\n${tree}\n\`\`\`\n`);
    console.log('structure.md created');
  } catch (err: any) {
    throw new Error(`Failed to create structure.md`);
  }
};

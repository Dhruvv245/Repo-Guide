import fs from 'fs/promises';
import path from 'path';

import { summarizeFile } from './summarizeFile';

export const createCodeSummary = async (guidePath: string, files: string[]) => {
  try {
    const summaries = await Promise.all(files.map(file => summarizeFile(file)));
    const outputPath = path.join(guidePath, 'code-summary.md');
    await fs.writeFile(outputPath, `# 📘 Code Summary\n\n${summaries.join('\n')}`);
    console.log('code-summary.md created');
  } catch (err) {
    throw new Error('Failed to create code-summary.md');
  }
};

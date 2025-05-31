import fs from 'fs/promises';
import path from 'path';

export const getAllCodeFiles = async (
  dirPath: string,
  extensions = ['.js', '.ts', '.jsx', '.tsx', '.html', '.md']
): Promise<string[]> => {
  let files: string[] = [];
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      const subFiles = await getAllCodeFiles(fullPath, extensions);
      files = files.concat(subFiles);
    } else if (extensions.includes(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
};

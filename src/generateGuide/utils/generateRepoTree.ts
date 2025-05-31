import fs from 'fs/promises';
import path from 'path';

export const generateTree = async (dirPath: string, prefix = ''): Promise<string> => {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  // Sort directories first, then files
  entries.sort((a, b) => Number(b.isDirectory()) - Number(a.isDirectory()));

  const lines = await Promise.all(
    entries.map(async (entry, index) => {
      const isLast = index === entries.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        const subtree = await generateTree(fullPath, prefix + (isLast ? '    ' : '│   '));
        return `${prefix}${connector}${entry.name}/\n${subtree}`;
      } else {
        return `${prefix}${connector}${entry.name}`;
      }
    })
  );

  return lines.join('\n');
};

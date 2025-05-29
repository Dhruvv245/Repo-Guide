import fs from 'fs/promises';
import path from 'path';

export const generateTree = async (dirPath: string, prefix = ''): Promise<string> => {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return (
    await Promise.all(
      entries
        .filter((entry) => entry.name !== 'node_modules' && entry.name !== '.git')
        .map(async (entry, index) => {
          const isLast = index === entries.length - 1;
          const connector = isLast ? '└── ' : '├── ';
          const nextPrefix = prefix + (isLast ? '    ' : '│   ');
          const fullPath = path.join(dirPath, entry.name);

          if (entry.isDirectory()) {
            return `${prefix}${connector}${entry.name}/\n${await generateTree(fullPath, nextPrefix)}`;
          } else {
            return `${prefix}${connector}${entry.name}`;
          }
        })
    )
  ).join('\n');
};

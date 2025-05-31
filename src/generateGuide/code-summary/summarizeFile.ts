import fs from 'fs/promises';
import path from 'path';

export const summarizeFile = async (filePath: string): Promise<string> => {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const name = path.relative('.', filePath);
    const topComment = lines.find(line => line.trim().startsWith('//') || line.trim().startsWith('/*')) || 'No description found.';
    const functions = content.match(/function\s+\w+|\w+\s*=\s*\(/g) || [];
    const exports = content.match(/export\s+(function|const|class)\s+\w+/g) || [];

    return `### 📄 ${name}
- 🧾 Description: ${topComment.trim()}
- 🔧 Functions: ${functions.length}
- 📤 Exports: ${exports.length ? exports.join(', ') : 'None'}

---
`;
};

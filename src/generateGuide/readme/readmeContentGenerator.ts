// Helper to format dependencies
const formatDeps = (deps: Record<string, string> | undefined): string =>
  deps && Object.keys(deps).length
    ? Object.entries(deps)
        .map(([dep, ver]) => `- \`${dep}\`: \`${ver}\``)
        .join('\n')
    : 'None';

export const readmeContent = (pkg: any) => `# ${pkg.name || 'Project Name'}

## 📦 Description
${pkg.description || 'No description provided.'}

## 📌 Version
${pkg.version || 'N/A'}

## 👤 Author${Array.isArray(pkg.author) ? 's' : ''}
${
  pkg.author
    ? Array.isArray(pkg.author)
      ? pkg.author.map((a: any) => (typeof a === 'string' ? a : a.name)).join(', ')
      : typeof pkg.author === 'string'
      ? pkg.author
      : pkg.author.name
    : 'N/A'
}

${
  pkg.contributors && pkg.contributors.length
    ? `## 🤝 Contributors\n${pkg.contributors.map((c: any) => (typeof c === 'string' ? c : c.name)).join(', ')}\n`
    : ''
}

${
  pkg.repository
    ? `## 📁 Repository\n${typeof pkg.repository === 'string' ? pkg.repository : pkg.repository.url}\n`
    : ''
}

${pkg.license ? `## 🪪 License\n${pkg.license}\n` : ''}

${pkg.bugs ? `## 🐛 Bugs\n${typeof pkg.bugs === 'string' ? pkg.bugs : pkg.bugs.url}\n` : ''}

${
  pkg.keywords && pkg.keywords.length ? `## 🔎 Keywords\n${pkg.keywords.map((k: string) => `- ${k}`).join('\n')}\n` : ''
}

---

## 🚀 Getting Started

Install dependencies:

\`\`\`bash
npm install
\`\`\`

Run the project:

\`\`\`bash
npm start
\`\`\`

---

## 🛠️ Available Scripts

${
  pkg.scripts && Object.keys(pkg.scripts).length
    ? Object.entries(pkg.scripts)
        .map(([name, cmd]) => `- \`${name}\`: \`${cmd}\``)
        .join('\n')
    : 'None'
}

---

## 🧩 Dependencies

${formatDeps(pkg.dependencies)}

---

## 🧪 Dev Dependencies

${formatDeps(pkg.devDependencies)}

---

${
  pkg.engines
    ? `## 🧱 Node.js Engine Requirement\n${Object.entries(pkg.engines)
        .map(([k, v]) => `- \`${k}\`: \`${v}\``)
        .join('\n')}\n`
    : ''
}
`;


import * as path from 'path';
import * as fs from 'fs/promises';
import { ASTGenerator, FileAST } from '../../astGenerator/astGenerator';

export async function getGuideTemp(repoPath: string): Promise<string> {
  const astGenerator = new ASTGenerator();
  const guidePath = path.join(repoPath, 'REPO_GUIDE.md');
  
  console.log('Analyzing repository structure...');
  const fileASTs = await astGenerator.analyzeDirectory(repoPath);
  
  console.log('Generating guide...');
  const guide = await generateGuideContent(repoPath, fileASTs);
  
  await fs.writeFile(guidePath, guide, 'utf-8');
  return guidePath;
}

async function generateGuideContent(repoPath: string, fileASTs: FileAST[]): Promise<string> {
  const repoName = path.basename(repoPath);
  const languageStats = getLanguageStats(fileASTs);
  const projectStructure = getProjectStructure(fileASTs);
  const keyFiles = identifyKeyFiles(fileASTs);
  
  let guide = `# ${repoName} - Repository Guide\n\n`;
  guide += `Generated on: ${new Date().toISOString()}\n\n`;
  
  // Overview
  guide += `## 📋 Overview\n\n`;
  guide += `This repository contains **${fileASTs.length}** analyzable files across **${Object.keys(languageStats).length}** programming languages.\n\n`;
  
  // Language breakdown
  guide += `## 🔧 Technology Stack\n\n`;
  Object.entries(languageStats)
    .sort(([,a], [,b]) => b.count - a.count)
    .forEach(([lang, stats]) => {
      guide += `- **${lang.charAt(0).toUpperCase() + lang.slice(1)}**: ${stats.count} files (${stats.functions} functions, ${stats.classes} classes)\n`;
    });
  guide += `\n`;
  
  // Project structure
  guide += `## 📁 Project Structure\n\n`;
  guide += '```\n';
  guide += generateTreeView(projectStructure);
  guide += '```\n\n';
  
  // Key files
  guide += `## 🔑 Key Files\n\n`;
  keyFiles.forEach(file => {
    guide += `### ${path.basename(file.filePath)}\n`;
    guide += `- **Language**: ${file.language}\n`;
    guide += `- **Lines**: ${file.metadata.lines}\n`;
    guide += `- **Functions**: ${file.metadata.functions.length > 0 ? file.metadata.functions.join(', ') : 'None'}\n`;
    guide += `- **Classes**: ${file.metadata.classes.length > 0 ? file.metadata.classes.join(', ') : 'None'}\n`;
    guide += `- **Imports**: ${file.metadata.imports.length > 0 ? file.metadata.imports.slice(0, 5).join(', ') : 'None'}\n`;
    if (file.metadata.imports.length > 5) {
      guide += `  *(and ${file.metadata.imports.length - 5} more)*\n`;
    }
    guide += `\n`;
  });
  
  // Detailed analysis
  guide += `## 🔍 Detailed Analysis\n\n`;
  
  const groupedByLanguage = groupFilesByLanguage(fileASTs);
  Object.entries(groupedByLanguage).forEach(([language, files]) => {
    guide += `### ${language.charAt(0).toUpperCase() + language.slice(1)} Files\n\n`;
    
    files.forEach(file => {
      guide += `#### ${path.relative(repoPath, file.filePath)}\n`;
      if (file.error) {
        guide += `- ❌ **Error**: ${file.error}\n`;
      } else {
        guide += `- **Size**: ${file.metadata.size} bytes (${file.metadata.lines} lines)\n`;
        
        if (file.metadata.functions.length > 0) {
          guide += `- **Functions**: ${file.metadata.functions.join(', ')}\n`;
        }
        
        if (file.metadata.classes.length > 0) {
          guide += `- **Classes**: ${file.metadata.classes.join(', ')}\n`;
        }
        
        if (file.metadata.imports.length > 0) {
          guide += `- **Dependencies**: ${file.metadata.imports.slice(0, 3).join(', ')}`;
          if (file.metadata.imports.length > 3) {
            guide += ` (and ${file.metadata.imports.length - 3} more)`;
          }
          guide += `\n`;
        }
      }
      guide += `\n`;
    });
  });
  
  // Getting started
  guide += `## 🚀 Getting Started\n\n`;
  guide += `1. **Entry Points**: Look for files like \`main.js\`, \`index.js\`, \`app.py\`, or \`main.go\`\n`;
  guide += `2. **Configuration**: Check for \`package.json\`, \`requirements.txt\`, \`Cargo.toml\`, or similar\n`;
  guide += `3. **Documentation**: Read any existing README files or documentation\n`;
  guide += `4. **Tests**: Look for test directories or files ending in \`.test.\` or \`.spec.\`\n\n`;
  
  // Architecture insights
  const insights = generateArchitectureInsights(fileASTs);
  if (insights.length > 0) {
    guide += `## 🏗️ Architecture Insights\n\n`;
    insights.forEach(insight => {
      guide += `- ${insight}\n`;
    });
    guide += `\n`;
  }
  
  return guide;
}

function getLanguageStats(fileASTs: FileAST[]): Record<string, {count: number, functions: number, classes: number}> {
  const stats: Record<string, {count: number, functions: number, classes: number}> = {};
  
  fileASTs.forEach(file => {
    if (!stats[file.language]) {
      stats[file.language] = { count: 0, functions: 0, classes: 0 };
    }
    stats[file.language].count++;
    stats[file.language].functions += file.metadata.functions.length;
    stats[file.language].classes += file.metadata.classes.length;
  });
  
  return stats;
}

function getProjectStructure(fileASTs: FileAST[]): string[] {
  return fileASTs.map(file => file.filePath).sort();
}

function generateTreeView(files: string[]): string {
  // Simple tree view generation
  const tree: Record<string, any> = {};
  
  files.forEach(filePath => {
    const parts = filePath.split(path.sep);
    let current = tree;
    
    parts.forEach((part, index) => {
      if (!current[part]) {
        current[part] = index === parts.length - 1 ? null : {};
      }
      if (current[part]) {
        current = current[part];
      }
    });
  });
  
  function renderTree(obj: any, prefix = ''): string {
    let result = '';
    const entries = Object.entries(obj);
    
    entries.forEach(([key, value], index) => {
      const isLast = index === entries.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      result += `${prefix}${connector}${key}\n`;
      
      if (value && typeof value === 'object') {
        const newPrefix = prefix + (isLast ? '    ' : '│   ');
        result += renderTree(value, newPrefix);
      }
    });
    
    return result;
  }
  
  return renderTree(tree);
}

function identifyKeyFiles(fileASTs: FileAST[]): FileAST[] {
  // Identify important files based on various criteria
  const keyFiles: FileAST[] = [];
  
  // Sort by importance score
  const scored = fileASTs.map(file => ({
    file,
    score: calculateImportanceScore(file)
  })).sort((a, b) => b.score - a.score);
  
  // Take top 10 most important files
  return scored.slice(0, 10).map(item => item.file);
}

function calculateImportanceScore(file: FileAST): number {
  let score = 0;
  
  // Filename importance
  const filename = path.basename(file.filePath).toLowerCase();
  if (['index', 'main', 'app', 'server'].some(name => filename.includes(name))) {
    score += 50;
  }
  
  // File size (moderate size files are often more important)
  if (file.metadata.lines > 50 && file.metadata.lines < 500) {
    score += 20;
  }
  
  // Number of functions and classes
  score += file.metadata.functions.length * 5;
  score += file.metadata.classes.length * 10;
  
  // Number of imports (indicates central files)
  score += Math.min(file.metadata.imports.length * 2, 20);
  
  return score;
}

function groupFilesByLanguage(fileASTs: FileAST[]): Record<string, FileAST[]> {
  const grouped: Record<string, FileAST[]> = {};
  
  fileASTs.forEach(file => {
    if (!grouped[file.language]) {
      grouped[file.language] = [];
    }
    grouped[file.language].push(file);
  });
  
  return grouped;
}

function generateArchitectureInsights(fileASTs: FileAST[]): string[] {
  const insights: string[] = [];
  
  // Analyze patterns
  const languageCount = new Set(fileASTs.map(f => f.language)).size;
  if (languageCount > 3) {
    insights.push(`Multi-language project with ${languageCount} different programming languages`);
  }
  
  const totalFunctions = fileASTs.reduce((sum, file) => sum + file.metadata.functions.length, 0);
  const totalClasses = fileASTs.reduce((sum, file) => sum + file.metadata.classes.length, 0);
  
  // React-specific insights
  const reactComponents = fileASTs.filter(file => 
    file.metadata.functions.some(fn => /^[A-Z]/.test(fn)) || // Components start with capital
    file.filePath.endsWith('.jsx') || file.filePath.endsWith('.tsx')
  ).length;
  
  if (reactComponents > 0) {
    insights.push(`React application with ${reactComponents} component files`);
  }
  
  // Check for Redux
  const hasRedux = fileASTs.some(file => 
    file.filePath.includes('slice') || 
    file.filePath.includes('store') ||
    file.metadata.imports.some(imp => imp.includes('redux'))
  );
  if (hasRedux) {
    insights.push('Uses Redux for state management');
  }
  
  // Check for routing
  const hasRouting = fileASTs.some(file => 
    file.metadata.imports.some(imp => imp.includes('router'))
  );
  if (hasRouting) {
    insights.push('Implements client-side routing');
  }
  
  // Check for API integration
  const hasAPI = fileASTs.some(file => 
    file.filePath.includes('api') || 
    file.filePath.includes('service') ||
    file.metadata.functions.some(fn => fn.toLowerCase().includes('fetch'))
  );
  if (hasAPI) {
    insights.push('Includes API integration and data fetching');
  }
  
  if (totalClasses > totalFunctions * 0.5) {
    insights.push('Object-oriented architecture with significant use of classes');
  } else if (totalFunctions > totalClasses * 3) {
    insights.push('Functional programming approach with emphasis on functions');
  }
  
  // Check for common patterns
  const hasTests = fileASTs.some(file => 
    file.filePath.includes('test') || file.filePath.includes('spec')
  );
  if (hasTests) {
    insights.push('Includes test files - good testing practices');
  }
  
  const hasConfig = fileASTs.some(file => 
    ['package.json', 'requirements.txt', 'Cargo.toml', 'pom.xml', 'vite.config', 'tailwind.config'].some(config => 
      file.filePath.includes(config)
    )
  );
  if (hasConfig) {
    insights.push('Well-structured project with proper configuration files');
  }
  
  // Check for styling approach
  const hasTailwind = fileASTs.some(file => file.filePath.includes('tailwind'));
  const hasCSS = fileASTs.some(file => file.filePath.endsWith('.css') || file.filePath.endsWith('.scss'));
  
  if (hasTailwind) {
    insights.push('Uses Tailwind CSS for utility-first styling');
  } else if (hasCSS) {
    insights.push('Uses traditional CSS/SCSS for styling');
  }
  
  // Feature-based organization
  const hasFeatures = fileASTs.some(file => file.filePath.includes('features'));
  if (hasFeatures) {
    insights.push('Organized by features - good modular architecture');
  }
  
  return insights;
}
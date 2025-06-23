// src/astGenerator/astGenerator.ts
import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';

export interface ASTNode {
  type: string;
  start?: number;
  end?: number;
  loc?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  [key: string]: any;
}

export interface FileAST {
  filePath: string;
  language: string;
  ast: ASTNode | null;
  error?: string;
  metadata: {
    lines: number;
    size: number;
    functions: string[];
    classes: string[];
    imports: string[];
  };
}

export class ASTGenerator {
  private supportedExtensions = new Map([
    ['.js', 'javascript'],
    ['.jsx', 'javascript'],
    ['.ts', 'typescript'],
    ['.tsx', 'typescript'],
    ['.py', 'python'],
    ['.java', 'java'],
    ['.go', 'go'],
    ['.rs', 'rust'],
    ['.cpp', 'cpp'],
    ['.c', 'c'],
    ['.cs', 'csharp'],
    ['.php', 'php'],
    ['.rb', 'ruby'],
  ]);

  async generateAST(filePath: string): Promise<FileAST> {
    const ext = path.extname(filePath).toLowerCase();
    const language = this.supportedExtensions.get(ext);

    if (!language) {
      return {
        filePath,
        language: 'unknown',
        ast: null,
        error: `Unsupported file extension: ${ext}`,
        metadata: await this.getBasicMetadata(filePath),
      };
    }

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      let ast: ASTNode | null = null;

      switch (language) {
        case 'javascript':
        case 'typescript':
          ast = await this.parseJavaScript(content, language === 'typescript');
          break;
        case 'python':
          ast = await this.parsePython(content);
          break;
        case 'java':
          ast = await this.parseJava(content);
          break;
        case 'go':
          ast = await this.parseGo(content);
          break;
        case 'rust':
          ast = await this.parseRust(content);
          break;
        default:
          ast = await this.parseGeneric(content, language);
      }

      return {
        filePath,
        language,
        ast,
        metadata: await this.extractMetadata(content, language, ast),
      };
    } catch (error) {
      return {
        filePath,
        language,
        ast: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: await this.getBasicMetadata(filePath),
      };
    }
  }

  private async parseJavaScript(content: string, isTypeScript: boolean = false): Promise<ASTNode> {
    try {
      // Using @babel/parser for JavaScript/TypeScript parsing
      const babel = await import('@babel/parser');

      const ast = babel.parse(content, {
        sourceType: 'module',
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true,
        strictMode: false,
        plugins: isTypeScript
          ? ['typescript', 'jsx', 'decorators-legacy', 'classProperties']
          : ['jsx', 'decorators-legacy', 'classProperties', 'dynamicImport'],
      });

      return this.cleanASTNode(ast);
    } catch (error) {
      // Fallback to enhanced regex parsing for React/JS files
      return this.parseReactJavaScript(content);
    }
  }

  private parseReactJavaScript(content: string): ASTNode {
    const lines = content.split('\n');
    const structure: ASTNode = {
      type: 'Program',
      language: 'javascript',
      body: [],
      lines: lines.length,
    };

    // Enhanced patterns for React and modern JS
    const patterns = {
      // React functional components
      '^(?:export\\s+(?:default\\s+)?)?(?:const|let|var)\\s+([A-Z][\\w$]*)\\s*=\\s*\\(': 'FunctionComponent',
      '^(?:export\\s+(?:default\\s+)?)?function\\s+([A-Z][\\w$]*)': 'FunctionComponent',
      '^(?:export\\s+(?:default\\s+)?)?function\\s+([a-z][\\w$]*)': 'FunctionDeclaration',
      '^(?:export\\s+(?:default\\s+)?)?const\\s+([a-z][\\w$]*)\\s*=\\s*\\(': 'ArrowFunction',
      '^(?:export\\s+(?:default\\s+)?)?const\\s+([a-z][\\w$]*)\\s*=\\s*async\\s*\\(': 'AsyncArrowFunction',

      // Class components and regular classes
      '^(?:export\\s+(?:default\\s+)?)?class\\s+([\\w$]+)': 'ClassDeclaration',

      // Imports
      '^import\\s+.*?from\\s+[\'"]([^\'"]+)[\'"]': 'ImportDeclaration',
      '^import\\s+[\'"]([^\'"]+)[\'"]': 'ImportDeclaration',

      // Exports
      '^export\\s+\\{([^}]+)\\}': 'NamedExport',
      '^export\\s+(?:default\\s+)?': 'ExportDeclaration',

      // Hooks (React)
      'use[A-Z][\\w$]*\\s*\\(': 'Hook',

      // Redux/State management
      'createSlice\\s*\\(': 'ReduxSlice',
      'configureStore\\s*\\(': 'ReduxStore',
    };

    const foundItems = new Set(); // Prevent duplicates

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) return;

      for (const [pattern, type] of Object.entries(patterns)) {
        const regex = new RegExp(pattern);
        const match = trimmed.match(regex);
        if (match) {
          const name = match[1] || 'anonymous';
          const key = `${type}-${name}`;

          if (!foundItems.has(key)) {
            foundItems.add(key);
            structure.body.push({
              type,
              name,
              line: index + 1,
              content: trimmed.length > 80 ? trimmed.substring(0, 80) + '...' : trimmed,
            });
          }
        }
      }
    });

    return structure;
  }

  private async parsePython(content: string): Promise<ASTNode> {
    try {
      // Use python to generate AST and parse the output
      const tempFile = path.join('/tmp', `ast_${Date.now()}.py`);
      await fs.writeFile(tempFile, content);

      const pythonScript = `
import ast
import json
import sys

try:
    with open('${tempFile}', 'r') as f:
        source = f.read()
    
    tree = ast.parse(source)
    
    def ast_to_dict(node):
        if isinstance(node, ast.AST):
            result = {'type': node.__class__.__name__}
            if hasattr(node, 'lineno'):
                result['lineno'] = node.lineno
            if hasattr(node, 'col_offset'):
                result['col_offset'] = node.col_offset
            
            for field, value in ast.iter_fields(node):
                if isinstance(value, list):
                    result[field] = [ast_to_dict(item) for item in value]
                elif isinstance(value, ast.AST):
                    result[field] = ast_to_dict(value)
                else:
                    result[field] = repr(value) if not isinstance(value, (str, int, float, bool, type(None))) else value
            return result
        return repr(node)
    
    print(json.dumps(ast_to_dict(tree), indent=2))
except Exception as e:
    print(json.dumps({"error": str(e)}))
`;

      const result = execSync(`python3 -c "${pythonScript}"`, { encoding: 'utf-8' });
      return JSON.parse(result);
    } catch (error) {
      return this.parseBasicStructure(content, 'python');
    }
  }

  private async parseJava(content: string): Promise<ASTNode> {
    // Basic Java structure parsing
    return this.parseBasicStructure(content, 'java');
  }

  private async parseGo(content: string): Promise<ASTNode> {
    // Basic Go structure parsing
    return this.parseBasicStructure(content, 'go');
  }

  private async parseRust(content: string): Promise<ASTNode> {
    // Basic Rust structure parsing
    return this.parseBasicStructure(content, 'rust');
  }

  private async parseGeneric(content: string, language: string): Promise<ASTNode> {
    return this.parseBasicStructure(content, language);
  }

  private parseBasicStructure(content: string, language: string): ASTNode {
    const lines = content.split('\n');
    const structure: ASTNode = {
      type: 'Program',
      language,
      body: [],
      lines: lines.length,
    };

    // Extract basic patterns based on language
    const patterns = this.getLanguagePatterns(language);

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) return;

      for (const [pattern, type] of Object.entries(patterns)) {
        const regex = new RegExp(pattern);
        const match = trimmed.match(regex);
        if (match) {
          structure.body.push({
            type,
            name: match[1] || 'anonymous',
            line: index + 1,
            content: trimmed,
          });
        }
      }
    });

    return structure;
  }

  private getLanguagePatterns(language: string): Record<string, string> {
    const patterns: Record<string, Record<string, string>> = {
      javascript: {
        '^function\\s+([\\w$]+)': 'FunctionDeclaration',
        '^class\\s+([\\w$]+)': 'ClassDeclaration',
        '^const\\s+([\\w$]+)\\s*=\\s*\\(': 'ArrowFunction',
        '^import\\s+.*from\\s+[\'"]([^\'"]+)': 'ImportDeclaration',
        '^export\\s+': 'ExportDeclaration',
      },
      typescript: {
        '^function\\s+([\\w$]+)': 'FunctionDeclaration',
        '^class\\s+([\\w$]+)': 'ClassDeclaration',
        '^interface\\s+([\\w$]+)': 'InterfaceDeclaration',
        '^type\\s+([\\w$]+)': 'TypeAlias',
        '^const\\s+([\\w$]+)\\s*=\\s*\\(': 'ArrowFunction',
        '^import\\s+.*from\\s+[\'"]([^\'"]+)': 'ImportDeclaration',
      },
      python: {
        '^def\\s+([\\w_]+)': 'FunctionDef',
        '^class\\s+([\\w_]+)': 'ClassDef',
        '^import\\s+([\\w_.]+)': 'Import',
        '^from\\s+([\\w_.]+)\\s+import': 'ImportFrom',
      },
      java: {
        '^public\\s+class\\s+([\\w$]+)': 'ClassDeclaration',
        '^public\\s+.*\\s+([\\w$]+)\\s*\\(': 'MethodDeclaration',
        '^private\\s+.*\\s+([\\w$]+)\\s*\\(': 'MethodDeclaration',
        '^import\\s+([\\w$.]+)': 'ImportDeclaration',
      },
      go: {
        '^func\\s+([\\w_]+)': 'FunctionDeclaration',
        '^type\\s+([\\w_]+)\\s+struct': 'StructDeclaration',
        '^import\\s+[\'"]([^\'"]+)': 'ImportDeclaration',
      },
      rust: {
        '^fn\\s+([\\w_]+)': 'FunctionDeclaration',
        '^struct\\s+([\\w_]+)': 'StructDeclaration',
        '^impl\\s+([\\w_]+)': 'ImplDeclaration',
        '^use\\s+([\\w_:]+)': 'UseDeclaration',
      },
    };

    return patterns[language] || {};
  }

  private cleanASTNode(node: any): ASTNode {
    // Remove circular references and clean up the AST
    const seen = new WeakSet();

    const clean = (obj: any): any => {
      if (obj === null || typeof obj !== 'object') return obj;
      if (seen.has(obj)) return '[Circular]';
      seen.add(obj);

      if (Array.isArray(obj)) {
        return obj.map(clean);
      }

      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (key.startsWith('_') || key === 'parent') continue;
        cleaned[key] = clean(value);
      }
      return cleaned;
    };

    return clean(node);
  }

  private async extractMetadata(content: string, language: string, ast: ASTNode | null): Promise<FileAST['metadata']> {
    const lines = content.split('\n');
    const metadata: FileAST['metadata'] = {
      lines: lines.length,
      size: content.length,
      functions: [],
      classes: [],
      imports: [],
    };

    if (ast && ast.body) {
      ast.body.forEach((node: any) => {
        switch (node.type) {
          case 'FunctionDeclaration':
          case 'FunctionDef':
          case 'ArrowFunction':
          case 'AsyncArrowFunction':
          case 'FunctionComponent':
            if (node.name && node.name !== 'anonymous') {
              metadata.functions.push(node.name);
            }
            break;
          case 'ClassDeclaration':
          case 'ClassDef':
            if (node.name && node.name !== 'anonymous') {
              metadata.classes.push(node.name);
            }
            break;
          case 'ImportDeclaration':
          case 'Import':
          case 'ImportFrom':
            if (node.name && node.name !== 'anonymous') {
              metadata.imports.push(node.name);
            }
            break;
        }
      });
    }

    // Remove duplicates
    metadata.functions = [...new Set(metadata.functions)];
    metadata.classes = [...new Set(metadata.classes)];
    metadata.imports = [...new Set(metadata.imports)];

    return metadata;
  }

  private async getBasicMetadata(filePath: string): Promise<FileAST['metadata']> {
    try {
      const stats = await fs.stat(filePath);
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      return {
        lines: lines.length,
        size: stats.size,
        functions: [],
        classes: [],
        imports: [],
      };
    } catch {
      return {
        lines: 0,
        size: 0,
        functions: [],
        classes: [],
        imports: [],
      };
    }
  }

  async analyzeDirectory(dirPath: string): Promise<FileAST[]> {
    const results: FileAST[] = [];

    const analyzeRecursively = async (currentPath: string) => {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);

        if (entry.isDirectory()) {
          // Skip common directories that don't need analysis
          if (['node_modules', '.git', 'dist', 'build', '__pycache__'].includes(entry.name)) {
            continue;
          }
          await analyzeRecursively(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (this.supportedExtensions.has(ext)) {
            const ast = await this.generateAST(fullPath);
            results.push(ast);
          }
        }
      }
    };

    await analyzeRecursively(dirPath);
    return results;
  }
}

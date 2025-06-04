import fs from "fs/promises";
import path from "path";
import { Project } from "ts-morph";

export const getArchitecture = async (repoPath: string, guidePath: string) => {
  try{
      const outputPath = path.join(guidePath, "architecture.json");
  // 1. Initialize the project
  const project = new Project({
    skipAddingFilesFromTsConfig: true,
  });
  project.addSourceFilesAtPaths(`${repoPath}/**/*.{ts,tsx,js,jsx}`);
  // 2. Traverse each file        
  const architecture: any[] = [];
  project.getSourceFiles().forEach((sourceFile) => {
    const absPath = sourceFile.getFilePath();
    const relPath = path.relative(repoPath, absPath);

    const imports = sourceFile.getImportDeclarations().map((imp) =>
      imp.getModuleSpecifierValue()
    );

    const exports = sourceFile.getExportSymbols().map((sym) => sym.getName());

    const classes = sourceFile.getClasses().map((cls) => cls.getName());
    const functions = sourceFile.getFunctions().map((fn) => fn.getName());

    architecture.push({
      file: relPath,
      imports,
      exports,
      classes,
      functions,
    });
  });
  // 3. Write architecture.json
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(architecture, null, 2));
  console.log(`architecture.json created `);
  return outputPath;
  }catch (err: any) {
    throw new Error(`Failed to generate architecture: ${err.message}`);
  }
};

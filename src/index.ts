#!/usr/bin/env node

import { Command } from 'commander';

import { cloneRepo } from './cloneRepo';

const program: Command = new Command();

program.name('repo-buddy').description('CLI to help you understand any code base.').version('1.0.0');

program
  .command('introduce')
  .description('Get to know about the CLI')
  .action((): void => {
    console.log('Hi there! This is a CLI that helps you understand any code base');
  });

program
  .command('generate')
  .description('Generate the repo guide')
  .argument('<repo-url>', 'GitHub repositry URL')
  .argument('<out-dir>', 'Output directory')
  .action(async (repoURL: string, outDir: string) => {
    const repoPath = await cloneRepo(repoURL, outDir);
  });

program.parse(process.argv);

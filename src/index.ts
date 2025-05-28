#!/usr/bin/env node

import { Command } from 'commander';

const program = new Command();

program
  .name('repo-buddy')
  .description('CLI to help you understand any code base.')
  .version('1.0.0');

program
  .command('introduce')
  .description('This command introduces you to our CLI')
  .action(() => {
    console.log(
      'Hi there! This is CLI that helps you understand any code base'
    );
  });

program.parse();

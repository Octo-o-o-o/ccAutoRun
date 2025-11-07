#!/usr/bin/env node
/**
 * ccAutoRun v2.0 - CLI Main Entry
 *
 * Main CLI entry point using Commander.js
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { init } from './commands/init.js';
import { list } from './commands/list.js';
import { status } from './commands/status.js';
import { initLogger } from './utils/logger.js';
import { ErrorHandler } from './utils/error-handler.js';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json for version
const packageJson = JSON.parse(
  await readFile(join(__dirname, '../package.json'), 'utf-8')
);

const program = new Command();

export default async function main() {
  // Setup program
  program
    .name('ccautorun')
    .description('Cross-platform intelligent automation tool powered by Claude Code')
    .version(packageJson.version)
    .option('-v, --verbose', 'Enable verbose logging')
    .option('--debug', 'Enable debug mode')
    .option('--dry-run', 'Preview actions without executing them');

  // Global options handler
  program.hook('preAction', (thisCommand) => {
    const opts = thisCommand.opts();

    // Initialize logger with options
    initLogger({
      verbose: opts.verbose || opts.debug,
      level: opts.debug ? 'debug' : 'info',
    });
  });

  // Init command
  program
    .command('init')
    .description('Initialize ccAutoRun in the current project')
    .option('--setup-hooks', 'Automatically setup Claude Code hooks')
    .option('--enable-hooks', 'Enable hooks immediately after setup')
    .option('--force', 'Force re-initialization')
    .action(async (options) => {
      try {
        const globalOpts = program.opts();
        await init({ ...options, dryRun: globalOpts.dryRun });
      } catch (error) {
        const exitCode = ErrorHandler.handle(error, {
          command: 'init',
          verbose: program.opts().verbose,
        });
        process.exit(exitCode);
      }
    });

  // List command
  program
    .command('list')
    .description('List all execution plans')
    .option('-a, --all', 'Show all plans including archived')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const globalOpts = program.opts();
        await list({ ...options, dryRun: globalOpts.dryRun });
      } catch (error) {
        const exitCode = ErrorHandler.handle(error, {
          command: 'list',
          verbose: program.opts().verbose,
        });
        process.exit(exitCode);
      }
    });

  // Status command
  program
    .command('status')
    .description('Show current plan execution status')
    .argument('[plan-id]', 'Plan ID to check status')
    .option('--json', 'Output as JSON')
    .action(async (planId, options) => {
      try {
        const globalOpts = program.opts();
        await status({ ...options, planId, dryRun: globalOpts.dryRun });
      } catch (error) {
        const exitCode = ErrorHandler.handle(error, {
          command: 'status',
          verbose: program.opts().verbose,
        });
        process.exit(exitCode);
      }
    });

  // Doctor command (placeholder)
  program
    .command('doctor')
    .description('Check system requirements and configuration')
    .option('--fix', 'Automatically fix common issues')
    .action(async (options) => {
      console.log(chalk.yellow('Doctor command - Coming in next update'));
      console.log(chalk.gray('This will check:'));
      console.log(chalk.gray('  - Node.js version'));
      console.log(chalk.gray('  - Claude CLI installation'));
      console.log(chalk.gray('  - Hook configuration'));
      console.log(chalk.gray('  - Project setup'));
    });

  // Run command (placeholder for Stage 3)
  program
    .command('run')
    .description('Run a plan (Stage 3)')
    .argument('[plan-id]', 'Plan ID to run')
    .option('--stage <number>', 'Start from specific stage')
    .action(async (planId, options) => {
      console.log(chalk.yellow('Run command - Will be implemented in Stage 3'));
    });

  // Parse arguments
  await program.parseAsync(process.argv);

  // Show help if no command provided
  if (!process.argv.slice(2).length) {
    program.outputHelp();
  }
}

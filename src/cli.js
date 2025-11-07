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
import { doctor } from './commands/doctor.js';
import { config } from './commands/config.js';
import { pause } from './commands/pause.js';
import { resume } from './commands/resume.js';
import { logs } from './commands/logs.js';
import { skip } from './commands/skip.js';
import { retry } from './commands/retry.js';
import { stats } from './commands/stats.js';
import { triggerCommand } from './commands/trigger.js';
import { resetCommand } from './commands/reset.js';
import { validate } from './commands/validate.js';
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

  // Doctor command
  program
    .command('doctor')
    .description('Check system requirements and configuration')
    .option('--fix', 'Automatically fix common issues')
    .action(async (options) => {
      try {
        const globalOpts = program.opts();
        await doctor({ ...options, dryRun: globalOpts.dryRun });
      } catch (error) {
        const exitCode = ErrorHandler.handle(error, {
          command: 'doctor',
          verbose: program.opts().verbose,
        });
        process.exit(exitCode);
      }
    });

  // Config command
  program
    .command('config')
    .description('Manage ccAutoRun configuration')
    .option('--list', 'List all configuration')
    .option('--get <key>', 'Get configuration value (supports nested keys like "notifications.enabled")')
    .option('--set <key> <value>', 'Set configuration value (e.g., --set editor vim)')
    .action(async (options) => {
      try {
        const globalOpts = program.opts();

        // Handle --set which takes two arguments
        let processedOptions = { ...options, dryRun: globalOpts.dryRun };

        // If --set is an array, it means we got both key and value
        if (Array.isArray(options.set)) {
          processedOptions.set = options.set[0];
          processedOptions.setValue = options.set[1];
        }

        await config(processedOptions);
      } catch (error) {
        const exitCode = ErrorHandler.handle(error, {
          command: 'config',
          verbose: program.opts().verbose,
        });
        process.exit(exitCode);
      }
    });

  // Pause command
  program
    .command('pause')
    .description('Pause a running plan')
    .argument('<plan-id>', 'Plan ID or name to pause')
    .action(async (planId, options) => {
      try {
        const globalOpts = program.opts();
        await pause(planId, { ...options, dryRun: globalOpts.dryRun });
      } catch (error) {
        const exitCode = ErrorHandler.handle(error, {
          command: 'pause',
          verbose: program.opts().verbose,
        });
        process.exit(exitCode);
      }
    });

  // Resume command
  program
    .command('resume')
    .description('Resume a paused plan')
    .argument('<plan-id>', 'Plan ID or name to resume')
    .action(async (planId, options) => {
      try {
        const globalOpts = program.opts();
        await resume(planId, { ...options, dryRun: globalOpts.dryRun });
      } catch (error) {
        const exitCode = ErrorHandler.handle(error, {
          command: 'resume',
          verbose: program.opts().verbose,
        });
        process.exit(exitCode);
      }
    });

  // Logs command
  program
    .command('logs')
    .description('View plan execution logs')
    .argument('<plan-id>', 'Plan ID or name')
    .option('--tail <number>', 'Show only last N lines', parseInt)
    .option('--follow', 'Follow log output (like tail -f)')
    .option('--level <level>', 'Filter by log level (error, warn, info, debug)')
    .action(async (planId, options) => {
      try {
        const globalOpts = program.opts();
        await logs(planId, { ...options, dryRun: globalOpts.dryRun });
      } catch (error) {
        const exitCode = ErrorHandler.handle(error, {
          command: 'logs',
          verbose: program.opts().verbose,
        });
        process.exit(exitCode);
      }
    });

  // Skip command
  program
    .command('skip')
    .description('Skip a stage in a plan')
    .argument('<plan-id>', 'Plan ID or name')
    .argument('<stage-number>', 'Stage number to skip')
    .option('--reason <reason>', 'Reason for skipping')
    .action(async (planId, stageNumber, options) => {
      try {
        const globalOpts = program.opts();
        await skip(planId, stageNumber, { ...options, dryRun: globalOpts.dryRun });
      } catch (error) {
        const exitCode = ErrorHandler.handle(error, {
          command: 'skip',
          verbose: program.opts().verbose,
        });
        process.exit(exitCode);
      }
    });

  // Retry command
  program
    .command('retry')
    .description('Retry a failed stage or plan')
    .argument('<plan-id>', 'Plan ID or name')
    .argument('[stage-number]', 'Stage number to retry (default: current stage)')
    .option('--reset-count', 'Reset session count')
    .action(async (planId, stageNumber, options) => {
      try {
        const globalOpts = program.opts();
        await retry(planId, stageNumber, { ...options, dryRun: globalOpts.dryRun });
      } catch (error) {
        const exitCode = ErrorHandler.handle(error, {
          command: 'retry',
          verbose: program.opts().verbose,
        });
        process.exit(exitCode);
      }
    });

  // Stats command
  program
    .command('stats')
    .description('Display statistics about plans')
    .option('--task <plan-id>', 'Show statistics for specific plan')
    .option('--format <format>', 'Output format (json)', 'text')
    .action(async (options) => {
      try {
        const globalOpts = program.opts();
        await stats({ ...options, dryRun: globalOpts.dryRun });
      } catch (error) {
        const exitCode = ErrorHandler.handle(error, {
          command: 'stats',
          verbose: program.opts().verbose,
        });
        process.exit(exitCode);
      }
    });

  // Trigger command
  program
    .command('trigger')
    .description('Manually trigger next stage continuation')
    .argument('<task-name>', 'Task name or plan path')
    .option('--resume', 'Resume existing Claude session')
    .option('--force', 'Force trigger even if paused or failed')
    .option('--skip-limit', 'Skip safety limit check')
    .action(async (taskName, options) => {
      try {
        const globalOpts = program.opts();
        await triggerCommand(taskName, { ...options, dryRun: globalOpts.dryRun });
      } catch (error) {
        const exitCode = ErrorHandler.handle(error, {
          command: 'trigger',
          verbose: program.opts().verbose,
        });
        process.exit(exitCode);
      }
    });

  // Reset command
  program
    .command('reset')
    .description('Reset session state')
    .argument('<task-name>', 'Task name to reset')
    .option('--stage <number>', 'Reset to specific stage')
    .option('-y, --yes', 'Skip confirmation')
    .action(async (taskName, options) => {
      try {
        const globalOpts = program.opts();
        await resetCommand(taskName, { ...options, dryRun: globalOpts.dryRun });
      } catch (error) {
        const exitCode = ErrorHandler.handle(error, {
          command: 'reset',
          verbose: program.opts().verbose,
        });
        process.exit(exitCode);
      }
    });

  // Validate command
  program
    .command('validate')
    .description('Validate execution plan format and structure')
    .argument('<task-name>', 'Task name or plan to validate')
    .action(async (taskName, options) => {
      try {
        const globalOpts = program.opts();
        await validate(taskName, { ...options, dryRun: globalOpts.dryRun });
      } catch (error) {
        const exitCode = ErrorHandler.handle(error, {
          command: 'validate',
          verbose: program.opts().verbose,
        });
        process.exit(exitCode);
      }
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

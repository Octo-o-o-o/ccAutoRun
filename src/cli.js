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
import { recover } from './commands/recover.js';
import { audit } from './commands/audit.js';
import { logs } from './commands/logs.js';
import { skip } from './commands/skip.js';
import { retry } from './commands/retry.js';
import { stats } from './commands/stats.js';
import { triggerCommand } from './commands/trigger.js';
import { resetCommand } from './commands/reset.js';
import { validate } from './commands/validate.js';
import { watchCommand } from './commands/watch.js';
import { migrate } from './commands/migrate.js';
import { archive } from './commands/archive.js';
import { initLogger } from './utils/logger.js';
import { ErrorHandler } from './utils/error-handler.js';
import { Config } from './utils/config.js';
import { ConfigValidator } from './utils/config-validator.js';
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

/**
 * Check configuration version and prompt migration if needed
 */
async function checkConfigVersion() {
  try {
    const config = new Config();
    const isInitialized = await config.isInitialized();

    if (!isInitialized) {
      // No config yet, skip version check
      return;
    }

    const { config: currentConfig } = await config.loadOrDefault();
    const validator = new ConfigValidator();

    if (validator.needsMigration(currentConfig)) {
      const currentVersion = currentConfig.version || '1.0.0';
      console.log(chalk.yellow('\n  ⚠  Configuration version mismatch detected'));
      console.log(chalk.gray(`      Current: v${currentVersion}`));
      console.log(chalk.gray(`      Expected: v2.0.0\n`));
      console.log(chalk.cyan('      Run "ccautorun migrate" to update your configuration.\n'));
      // Don't block execution - just warn
    }
  } catch (error) {
    // Silently fail - don't block CLI startup
    // Only log in debug mode
    if (process.env.DEBUG) {
      console.error('Version check failed:', error);
    }
  }
}

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
        const processedOptions = { ...options, dryRun: globalOpts.dryRun };

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

  // Migrate command
  program
    .command('migrate')
    .description('Migrate configuration from older versions')
    .option('--dry-run', 'Preview migration without applying changes')
    .action(async (options) => {
      try {
        const globalOpts = program.opts();
        await migrate({ ...options, dryRun: options.dryRun || globalOpts.dryRun });
      } catch (error) {
        const exitCode = ErrorHandler.handle(error, {
          command: 'migrate',
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

  // Recover command
  program
    .command('recover')
    .description('Recover from a failed plan execution')
    .argument('[plan-id]', 'Plan ID or name to recover (auto-detect if omitted)')
    .option('--strategy <strategy>', 'Recovery strategy: retry|skip|rollback|abort')
    .option('--stage <number>', 'Target stage for rollback', parseInt)
    .option('--reason <reason>', 'Reason for skip/abort')
    .option('--interactive', 'Interactive mode (default: true)', true)
    .option('--no-interactive', 'Non-interactive mode')
    .action(async (planId, options) => {
      try {
        const globalOpts = program.opts();
        await recover(planId, { ...options, dryRun: globalOpts.dryRun });
      } catch (error) {
        const exitCode = ErrorHandler.handle(error, {
          command: 'recover',
          verbose: program.opts().verbose,
        });
        process.exit(exitCode);
      }
    });

  // Audit command
  program
    .command('audit')
    .description('Run security audit (dependencies, sensitive files, command security)')
    .option('--report <format>', 'Report format: text|json|html', 'text')
    .option('--output <file>', 'Output report to file')
    .option('--fix', 'Automatically fix vulnerabilities (npm audit fix)')
    .action(async (options) => {
      try {
        const globalOpts = program.opts();
        await audit({ ...options, dryRun: globalOpts.dryRun });
      } catch (error) {
        const exitCode = ErrorHandler.handle(error, {
          command: 'audit',
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

  // Watch command
  program
    .command('watch')
    .description('Watch task progress in real-time')
    .argument('<task-name>', 'Name of the task to watch')
    .option('-i, --interval <seconds>', 'Refresh interval in seconds', '2')
    .option('--no-notify', 'Disable desktop notifications')
    .action(async (taskName, options) => {
      try {
        await watchCommand(taskName, {
          interval: parseInt(options.interval, 10),
          notify: options.notify,
        });
      } catch (error) {
        const exitCode = ErrorHandler.handle(error, {
          command: 'watch',
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

  // Archive command
  program
    .command('archive')
    .description('Archive completed task')
    .argument('<task-name>', 'Name of the task to archive')
    .option('--dry-run', 'Preview archive without applying changes')
    .action(async (taskName, options) => {
      try {
        const globalOpts = program.opts();
        await archive(taskName, { ...options, dryRun: options.dryRun || globalOpts.dryRun });
      } catch (error) {
        const exitCode = ErrorHandler.handle(error, {
          command: 'archive',
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

  // Check configuration version before executing commands
  // (Skip for init and migrate commands)
  const args = process.argv.slice(2);
  const command = args[0];
  const skipVersionCheck = ['init', 'migrate', 'doctor', '--help', '-h', '--version', '-V'].includes(command);

  if (!skipVersionCheck) {
    await checkConfigVersion();
  }

  // Parse arguments
  await program.parseAsync(process.argv);

  // Show help if no command provided
  if (!process.argv.slice(2).length) {
    program.outputHelp();
  }
}

/**
 * Archive Command
 *
 * Archive completed tasks to .ccautorun/archive/
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { readSession, deleteSession } from '../core/session-manager.js';
import { detectArchitecture } from '../core/plan-parser.js';
import { logger } from '../utils/logger.js';

/**
 * Get .ccautorun directory path
 */
function getCcAutoRunDir() {
  return path.join(os.homedir(), '.ccautorun');
}

/**
 * Archive command handler
 */
export async function archive(taskName, options = {}) {
  const { dryRun = false } = options;

  console.log(chalk.bold.cyan(`\n  Archiving Task: ${taskName}\n`));

  // Read session
  const session = readSession(taskName);

  if (!session) {
    console.error(chalk.red('  ✗ Task not found\n'));
    console.log(chalk.gray('    Run "ccautorun list" to see available tasks.\n'));
    process.exit(1);
  }

  // Check if task is completed
  if (session.status !== 'completed') {
    console.error(chalk.yellow(`  ⚠  Task is not completed (status: ${session.status})\n`));
    console.log(chalk.gray('    Only completed tasks can be archived.\n'));
    process.exit(1);
  }

  const ccDir = getCcAutoRunDir();
  const plansDir = path.join(ccDir, 'plans');
  const archiveDir = path.join(ccDir, 'archive');

  // Ensure archive directory exists
  await fs.mkdir(archiveDir, { recursive: true });

  // Detect architecture and determine source path
  let sourcePath;
  let destPath;
  let isDirectory = false;

  // Try both split and single architectures
  const splitPath = path.join(plansDir, taskName);
  const singlePath = path.join(plansDir, `${taskName}.md`);

  try {
    const stat = await fs.stat(splitPath);
    if (stat.isDirectory()) {
      sourcePath = splitPath;
      destPath = path.join(archiveDir, taskName);
      isDirectory = true;
    }
  } catch {
    // Try single file
    try {
      await fs.stat(singlePath);
      sourcePath = singlePath;
      destPath = path.join(archiveDir, `${taskName}.md`);
      isDirectory = false;
    } catch {
      console.error(chalk.red('  ✗ Plan files not found\n'));
      process.exit(1);
    }
  }

  console.log(chalk.gray(`  Architecture: ${isDirectory ? 'split (directory)' : 'single (file)'}`));
  console.log(chalk.gray(`  Source: ${sourcePath}`));
  console.log(chalk.gray(`  Destination: ${destPath}\n`));

  // Calculate task statistics
  const stats = {
    stages: session.currentStage || 0,
    totalStages: session.totalStages || 0,
    count: session.count || 0,
  };

  console.log(chalk.bold('  Task Summary:\n'));
  console.log(chalk.gray(`    Name: ${taskName}`));
  console.log(chalk.gray(`    Stages: ${stats.stages}/${stats.totalStages}`));
  console.log(chalk.gray(`    Iterations: ${stats.count}`));
  console.log();

  if (dryRun) {
    console.log(chalk.cyan('  [DRY RUN] Would archive:\n'));
    console.log(chalk.gray(`    Move: ${sourcePath} → ${destPath}`));
    console.log(chalk.gray(`    Delete session: ${taskName}.json\n`));
    return;
  }

  // Move plan files
  try {
    // Check if destination already exists
    try {
      await fs.stat(destPath);
      // Destination exists, create backup
      const backupPath = `${destPath}.backup-${Date.now()}`;
      await fs.rename(destPath, backupPath);
      console.log(chalk.yellow(`  ⚠  Existing archive backed up to: ${backupPath}\n`));
    } catch {
      // Destination doesn't exist, OK to proceed
    }

    await fs.rename(sourcePath, destPath);
    console.log(chalk.green('  ✓ Plan files moved to archive\n'));
  } catch (error) {
    logger.error('Failed to move plan files:', error);
    console.error(chalk.red(`  ✗ Failed to move files: ${error.message}\n`));
    process.exit(1);
  }

  // Delete session
  try {
    deleteSession(taskName);
    console.log(chalk.green('  ✓ Session deleted\n'));
  } catch (error) {
    logger.error('Failed to delete session:', error);
    console.error(chalk.yellow(`  ⚠  Failed to delete session: ${error.message}\n`));
  }

  console.log(chalk.bold.green('  ✓ Task archived successfully!\n'));
}

/**
 * Register archive command with Commander
 */
export function registerArchiveCommand(program) {
  program
    .command('archive')
    .description('Archive completed task')
    .argument('<task-name>', 'Name of the task to archive')
    .option('--dry-run', 'Preview archive without applying changes')
    .action(async (taskName, options) => {
      try {
        await archive(taskName, {
          ...options,
          dryRun: options.dryRun || program.opts().dryRun,
        });
      } catch (error) {
        logger.error('Archive command failed:', error);
        console.error(chalk.red(`\n  ✗ Error: ${error.message}\n`));
        process.exit(1);
      }
    });
}

/**
 * ccAutoRun logs command
 *
 * View plan execution logs
 */

import fs from 'fs/promises';
import { createReadStream } from 'fs';
import path from 'path';
import chalk from 'chalk';
import { Config } from '../utils/config.js';
import { getLogger } from '../utils/logger.js';
import { Errors } from '../utils/error-handler.js';
import readline from 'readline';

const logger = getLogger();

/**
 * Find plan by ID or name
 */
async function findPlan(planId) {
  const plansDir = '.ccautorun/plans';

  // Check if it's a direct plan ID
  const directPath = path.join(plansDir, planId, 'metadata.json');
  try {
    const metadata = JSON.parse(await fs.readFile(directPath, 'utf-8'));
    return { id: planId, metadata };
  } catch {
    // Not a direct ID, search by name
  }

  // Search by name
  const entries = await fs.readdir(plansDir);

  for (const entry of entries) {
    const metadataPath = path.join(plansDir, entry, 'metadata.json');
    try {
      const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
      if (metadata.name === planId) {
        return { id: entry, metadata };
      }
    } catch {
      // Skip invalid plans
    }
  }

  throw Errors.planNotFound(planId);
}

/**
 * Read and display log file
 */
async function displayLogs(logPath, options = {}) {
  const { tail, level } = options;

  try {
    await fs.access(logPath);
  } catch {
    logger.warn('No log file found for this plan');
    return;
  }

  const lines = [];
  const fileStream = createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    // Filter by level if specified
    if (level) {
      const levelUpper = level.toUpperCase();
      if (!line.includes(`[${levelUpper}]`)) {
        continue;
      }
    }

    lines.push(line);
  }

  // Apply tail limit
  const displayLines = tail ? lines.slice(-tail) : lines;

  // Display
  for (const line of displayLines) {
    // Colorize log levels
    const coloredLine = line
      .replace(/\[ERROR\]/g, chalk.red('[ERROR]'))
      .replace(/\[WARN\]/g, chalk.yellow('[WARN]'))
      .replace(/\[INFO\]/g, chalk.blue('[INFO]'))
      .replace(/\[DEBUG\]/g, chalk.gray('[DEBUG]'))
      .replace(/\[TRACE\]/g, chalk.gray('[TRACE]'));

    console.log(coloredLine);
  }
}

/**
 * Follow log file (like tail -f)
 */
async function followLogs(logPath, options = {}) {
  const { level } = options;

  try {
    await fs.access(logPath);
  } catch {
    logger.warn('No log file found for this plan');
    return;
  }

  console.log(chalk.gray(`Following ${logPath}...`));
  console.log(chalk.gray('Press Ctrl+C to stop\n'));

  // Use chokidar to watch file changes
  const chokidar = await import('chokidar');
  let position = (await fs.stat(logPath)).size;

  const watcher = chokidar.watch(logPath, {
    persistent: true,
    ignoreInitial: false,
  });

  watcher.on('change', async () => {
    const stats = await fs.stat(logPath);
    if (stats.size > position) {
      const stream = createReadStream(logPath, {
        start: position,
        end: stats.size,
      });

      const rl = readline.createInterface({
        input: stream,
        crlfDelay: Infinity,
      });

      for await (const line of rl) {
        // Filter by level if specified
        if (level) {
          const levelUpper = level.toUpperCase();
          if (!line.includes(`[${levelUpper}]`)) {
            continue;
          }
        }

        // Colorize log levels
        const coloredLine = line
          .replace(/\[ERROR\]/g, chalk.red('[ERROR]'))
          .replace(/\[WARN\]/g, chalk.yellow('[WARN]'))
          .replace(/\[INFO\]/g, chalk.blue('[INFO]'))
          .replace(/\[DEBUG\]/g, chalk.gray('[DEBUG]'))
          .replace(/\[TRACE\]/g, chalk.gray('[TRACE]'));

        console.log(coloredLine);
      }

      position = stats.size;
    }
  });

  // Handle Ctrl+C
  process.on('SIGINT', () => {
    watcher.close();
    console.log(chalk.gray('\nStopped following logs'));
    process.exit(0);
  });
}

/**
 * Logs command handler
 */
export async function logs(planId, options = {}) {
  const { tail, follow, level } = options;

  // Check if initialized
  const config = new Config();
  const isInitialized = await config.isInitialized();

  if (!isInitialized) {
    throw Errors.notInitialized();
  }

  // Find plan
  const { id, metadata } = await findPlan(planId);

  // Determine log file path
  const logPath = path.join('.ccautorun/logs', `plan-${id}.log`);

  console.log(chalk.bold(`\nLogs for: ${metadata.name}\n`));
  console.log(chalk.gray('─'.repeat(60)));
  console.log();

  if (follow) {
    await followLogs(logPath, { level });
  } else {
    await displayLogs(logPath, { tail, level });
  }
}

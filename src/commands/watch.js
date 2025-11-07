/**
 * Watch Command
 *
 * Real-time progress monitoring for tasks
 */

import chokidar from 'chokidar';
import chalk from 'chalk';
import path from 'path';
import os from 'os';
import { readSession } from '../core/session-manager.js';
import { getNotifier } from '../utils/notifier.js';
import { getLogger } from '../utils/logger.js';

const logger = getLogger();

/**
 * Format duration in human-readable format
 */
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Create progress bar
 */
function createProgressBar(current, total, width = 20) {
  const percentage = Math.min(current / total, 1);
  const filled = Math.round(percentage * width);
  const empty = width - filled;

  return chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
}

/**
 * Clear terminal screen
 */
function clearScreen() {
  process.stdout.write('\x1Bc');
}

/**
 * Display progress information
 */
function displayProgress(session, startTime, options = {}) {
  const { taskName, currentStage, status } = session;

  // Get total stages from plan config
  const totalStages = session.totalStages || 10; // Default to 10 if not found

  const percentage = Math.round((currentStage / totalStages) * 100);
  const progressBar = createProgressBar(currentStage, totalStages);

  // Calculate elapsed time
  const elapsed = Date.now() - startTime;
  const elapsedStr = formatDuration(elapsed);

  // Estimate remaining time (rough estimation)
  let estimatedRemaining = 'N/A';
  if (currentStage > 0 && status === 'active') {
    const avgTimePerStage = elapsed / currentStage;
    const remainingStages = totalStages - currentStage;
    const remainingMs = avgTimePerStage * remainingStages;
    estimatedRemaining = formatDuration(remainingMs);
  }

  // Status indicator
  let statusIndicator;
  switch (status) {
    case 'active':
      statusIndicator = chalk.green('● ACTIVE');
      break;
    case 'paused':
      statusIndicator = chalk.yellow('⏸ PAUSED');
      break;
    case 'completed':
      statusIndicator = chalk.blue('✓ COMPLETED');
      break;
    case 'failed':
      statusIndicator = chalk.red('✗ FAILED');
      break;
    default:
      statusIndicator = chalk.gray('○ UNKNOWN');
  }

  // Clear and redraw
  if (!options.noClearing) {
    clearScreen();
  }

  console.log(chalk.bold.cyan(`\n  Watching: ${taskName}\n`));
  console.log(`  Status:       ${statusIndicator}`);
  console.log(`  Progress:     Stage ${currentStage}/${totalStages} (${percentage}%)`);
  console.log(`  ${progressBar}`);
  console.log(`  Elapsed:      ${elapsedStr}`);
  console.log(`  Estimated:    ${estimatedRemaining}`);

  if (session.lastError) {
    console.log(chalk.red(`\n  ⚠️  Last Error: ${session.lastError}`));
  }

  console.log(chalk.gray('\n  Press Ctrl+C to exit\n'));
}

/**
 * Watch command handler
 */
export async function watchCommand(taskName, options = {}) {
  const interval = (options.interval || 2) * 1000; // Convert to milliseconds
  const notify = options.notify !== false;

  // Get initial session
  let session = readSession(taskName);

  if (!session) {
    console.error(chalk.red(`\n  ✗ Task not found: ${taskName}\n`));
    console.log(chalk.gray('    Run "ccautorun list" to see available tasks.\n'));
    process.exit(1);
  }

  const startTime = Date.now();
  let previousStage = session.currentStage;
  let previousStatus = session.status;

  // Get notifier if notifications enabled
  const notifier = notify ? getNotifier() : null;

  // Setup session file watcher
  const sessionPath = path.join(os.homedir(), '.ccautorun', 'sessions', `${taskName}.json`);

  // Display initial progress
  displayProgress(session, startTime, { noClearing: true });

  // Setup periodic refresh
  let refreshInterval;
  let watcher;

  const cleanup = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
    if (watcher) {
      watcher.close();
    }
    console.log(chalk.gray('\n  Watch stopped.\n'));
    process.exit(0);
  };

  // Handle Ctrl+C gracefully
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  // Watch session file for changes
  watcher = chokidar.watch(sessionPath, {
    persistent: true,
    ignoreInitial: true,
  });

  watcher.on('change', async () => {
    try {
      const newSession = readSession(taskName);
      if (!newSession) {
        logger.warn('Session file deleted');
        cleanup();
        return;
      }

      session = newSession;

      // Detect stage change
      if (newSession.currentStage !== previousStage) {
        if (notifier && notifier.shouldNotifyProgress(newSession.currentStage)) {
          await notifier.notifyStageComplete(
            taskName,
            newSession.currentStage,
            newSession.totalStages || 10
          );
        }
        previousStage = newSession.currentStage;
      }

      // Detect status change
      if (newSession.status !== previousStatus) {
        if (notifier) {
          if (newSession.status === 'completed') {
            await notifier.notifyComplete(taskName, {
              stages: newSession.currentStage,
              duration: formatDuration(Date.now() - startTime),
            });
          } else if (newSession.status === 'failed') {
            await notifier.notifyError(
              taskName,
              newSession.lastError || 'Task failed',
              'Check logs for details'
            );
          } else if (newSession.status === 'paused') {
            await notifier.notifyWarning(taskName, 'Task paused');
          }
        }
        previousStatus = newSession.status;

        // Exit if task completed or failed
        if (newSession.status === 'completed' || newSession.status === 'failed') {
          displayProgress(session, startTime);
          setTimeout(cleanup, 2000); // Wait 2s before exit
        }
      }

      displayProgress(session, startTime);
    } catch (error) {
      logger.error('Error reading session:', error);
    }
  });

  // Periodic refresh (even if file doesn't change)
  refreshInterval = setInterval(() => {
    try {
      const newSession = readSession(taskName);
      if (newSession) {
        session = newSession;
        displayProgress(session, startTime);
      }
    } catch (error) {
      logger.debug('Error in periodic refresh:', error);
    }
  }, interval);

  // Keep process alive
  await new Promise(() => {}); // Never resolves (until SIGINT/SIGTERM)
}

/**
 * Register watch command with Commander
 */
export function registerWatchCommand(program) {
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
        logger.error('Watch command failed:', error);
        console.error(chalk.red(`\n  ✗ Error: ${error.message}\n`));
        process.exit(1);
      }
    });
}

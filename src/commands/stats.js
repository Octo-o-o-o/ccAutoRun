/**
 * ccAutoRun stats command
 *
 * Display statistics about plans
 */

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { Config } from '../utils/config.js';
import { getLogger } from '../utils/logger.js';
import { Errors } from '../utils/error-handler.js';

const logger = getLogger();

/**
 * Calculate average completion time
 */
function calculateAverageTime(plans) {
  const completedPlans = plans.filter(p => p.status === 'completed' && p.createdAt && p.completedAt);

  if (completedPlans.length === 0) {
    return null;
  }

  const totalMs = completedPlans.reduce((sum, plan) => {
    const start = new Date(plan.createdAt);
    const end = new Date(plan.completedAt);
    return sum + (end - start);
  }, 0);

  const avgMs = totalMs / completedPlans.length;

  // Convert to human-readable format
  const hours = Math.floor(avgMs / (1000 * 60 * 60));
  const minutes = Math.floor((avgMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

/**
 * Calculate stage success rate
 */
function calculateStageSuccessRate(plans) {
  let totalStages = 0;
  let completedStages = 0;
  let skippedStages = 0;

  for (const plan of plans) {
    totalStages += plan.totalStages || 0;
    completedStages += (plan.currentStage || 1) - 1;

    if (plan.skippedStages) {
      skippedStages += plan.skippedStages.length;
    }
  }

  if (totalStages === 0) {
    return null;
  }

  const successfulStages = completedStages - skippedStages;
  const successRate = ((successfulStages / completedStages) * 100).toFixed(1);

  return {
    total: totalStages,
    completed: completedStages,
    skipped: skippedStages,
    successful: successfulStages,
    successRate: parseFloat(successRate),
  };
}

/**
 * Get global statistics
 */
async function getGlobalStats() {
  const plansDir = '.ccautorun/plans';
  const entries = await fs.readdir(plansDir);

  const plans = [];

  for (const entry of entries) {
    const metadataPath = path.join(plansDir, entry, 'metadata.json');
    try {
      const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
      plans.push({ id: entry, ...metadata });
    } catch {
      // Skip invalid plans
    }
  }

  const stats = {
    total: plans.length,
    running: plans.filter(p => p.status === 'running').length,
    paused: plans.filter(p => p.status === 'paused').length,
    completed: plans.filter(p => p.status === 'completed').length,
    failed: plans.filter(p => p.status === 'failed').length,
    archived: plans.filter(p => p.status === 'archived').length,
    averageCompletionTime: calculateAverageTime(plans),
    stageStats: calculateStageSuccessRate(plans),
  };

  return { stats, plans };
}

/**
 * Get statistics for a specific plan
 */
async function getPlanStats(planId) {
  const metadataPath = path.join('.ccautorun/plans', planId, 'metadata.json');

  try {
    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));

    // Calculate duration
    let duration = null;
    if (metadata.createdAt) {
      const start = new Date(metadata.createdAt);
      const end = metadata.completedAt ? new Date(metadata.completedAt) : new Date();
      const ms = end - start;

      const hours = Math.floor(ms / (1000 * 60 * 60));
      const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

      duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }

    // Count retries
    const totalRetries = metadata.retryCount
      ? Object.values(metadata.retryCount).reduce((sum, count) => sum + count, 0)
      : 0;

    // Count skipped stages
    const skippedCount = metadata.skippedStages ? metadata.skippedStages.length : 0;

    return {
      id: planId,
      name: metadata.name,
      status: metadata.status,
      currentStage: metadata.currentStage,
      totalStages: metadata.totalStages,
      duration,
      totalRetries,
      skippedStages: skippedCount,
      sessionCount: metadata.sessionCount || 0,
      createdAt: metadata.createdAt,
      completedAt: metadata.completedAt,
      architecture: metadata.architecture,
    };
  } catch {
    throw Errors.planNotFound(planId);
  }
}

/**
 * Display global statistics
 */
function displayGlobalStats(stats, format) {
  if (format === 'json') {
    console.log(JSON.stringify(stats, null, 2));
    return;
  }

  console.log(chalk.bold('\nGlobal Statistics\n'));
  console.log(chalk.gray('─'.repeat(60)));
  console.log();

  console.log(chalk.bold('Plans:'));
  console.log(chalk.gray('  Total: '), stats.total);
  console.log(chalk.blue('  Running: '), stats.running);
  console.log(chalk.yellow('  Paused: '), stats.paused);
  console.log(chalk.green('  Completed: '), stats.completed);
  console.log(chalk.red('  Failed: '), stats.failed);
  console.log(chalk.gray('  Archived: '), stats.archived);
  console.log();

  if (stats.averageCompletionTime) {
    console.log(chalk.bold('Performance:'));
    console.log(chalk.gray('  Average completion time: '), stats.averageCompletionTime);
    console.log();
  }

  if (stats.stageStats) {
    console.log(chalk.bold('Stage Statistics:'));
    console.log(chalk.gray('  Total stages: '), stats.stageStats.total);
    console.log(chalk.gray('  Completed: '), stats.stageStats.completed);
    console.log(chalk.gray('  Skipped: '), stats.stageStats.skipped);
    console.log(chalk.gray('  Success rate: '), `${stats.stageStats.successRate}%`);
    console.log();
  }
}

/**
 * Display plan-specific statistics
 */
function displayPlanStats(stats, format) {
  if (format === 'json') {
    console.log(JSON.stringify(stats, null, 2));
    return;
  }

  console.log(chalk.bold(`\nStatistics for: ${stats.name}\n`));
  console.log(chalk.gray('─'.repeat(60)));
  console.log();

  const statusColor =
    stats.status === 'completed' ? chalk.green :
    stats.status === 'running' ? chalk.blue :
    stats.status === 'failed' ? chalk.red :
    chalk.yellow;

  console.log(chalk.gray('ID: '), stats.id);
  console.log(chalk.gray('Status: '), statusColor(stats.status));
  console.log(chalk.gray('Progress: '), `${stats.currentStage}/${stats.totalStages} stages`);
  console.log(chalk.gray('Architecture: '), stats.architecture);
  console.log();

  console.log(chalk.bold('Execution:'));
  if (stats.duration) {
    console.log(chalk.gray('  Duration: '), stats.duration);
  }
  console.log(chalk.gray('  Total retries: '), stats.totalRetries);
  console.log(chalk.gray('  Skipped stages: '), stats.skippedStages);
  console.log(chalk.gray('  Session count: '), stats.sessionCount);
  console.log();

  console.log(chalk.bold('Timeline:'));
  console.log(chalk.gray('  Created: '), new Date(stats.createdAt).toLocaleString());
  if (stats.completedAt) {
    console.log(chalk.gray('  Completed: '), new Date(stats.completedAt).toLocaleString());
  }
  console.log();
}

/**
 * Stats command handler
 */
export async function stats(options = {}) {
  const { task: planId, format } = options;

  // Check if initialized
  const config = new Config();
  const isInitialized = await config.isInitialized();

  if (!isInitialized) {
    throw Errors.notInitialized();
  }

  if (planId) {
    // Show plan-specific stats
    const planStats = await getPlanStats(planId);
    displayPlanStats(planStats, format);
  } else {
    // Show global stats
    const { stats: globalStats } = await getGlobalStats();
    displayGlobalStats(globalStats, format);
  }
}

/**
 * ccAutoRun retry command
 *
 * Retry a failed stage or plan
 */

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { Config } from '../utils/config.js';
import { getLogger } from '../utils/logger.js';
import { Errors } from '../utils/error-handler.js';

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
 * Record retry action in session log
 */
async function recordRetry(planId, stageNumber, resetCount) {
  const sessionLogPath = path.join('.ccautorun/sessions', `${planId}.jsonl`);

  const logEntry = JSON.stringify({
    timestamp: new Date().toISOString(),
    type: 'retry',
    stage: stageNumber,
    resetCount,
  });

  await fs.appendFile(sessionLogPath, logEntry + '\n', 'utf-8');
}

/**
 * Retry command handler
 */
export async function retry(planId, stageNumber, options = {}) {
  const { resetCount = false, dryRun = false } = options;

  // Check if initialized
  const config = new Config();
  const isInitialized = await config.isInitialized();

  if (!isInitialized) {
    throw Errors.notInitialized();
  }

  // Find plan
  const { id, metadata } = await findPlan(planId);

  // Determine which stage to retry
  let stage;

  if (stageNumber) {
    stage = parseInt(stageNumber);
    if (isNaN(stage) || stage < 1 || stage > metadata.totalStages) {
      throw new Error(`Invalid stage number: ${stageNumber}. Must be between 1 and ${metadata.totalStages}`);
    }
  } else {
    // Default to current stage
    stage = metadata.currentStage;
  }

  // Check if plan/stage can be retried
  if (metadata.status === 'completed') {
    throw new Error(`Plan "${metadata.name}" is already completed`);
  }

  if (dryRun) {
    console.log(chalk.gray('[DRY RUN] Would retry:'));
    console.log(chalk.gray(`  Plan: ${metadata.name}`));
    console.log(chalk.gray(`  Stage: ${stage}/${metadata.totalStages}`));
    console.log(chalk.gray(`  Current status: ${metadata.status}`));
    console.log(chalk.gray(`  Reset session count: ${resetCount ? 'yes' : 'no'}`));
    return;
  }

  // Update metadata
  const previousStatus = metadata.status;

  // If retrying from failed state, restore to running
  if (metadata.status === 'failed') {
    metadata.status = 'running';
  }

  // Set current stage to the retry stage
  metadata.currentStage = stage;
  metadata.updatedAt = new Date().toISOString();
  metadata.lastRetryAt = new Date().toISOString();

  // Reset session count if requested
  if (resetCount) {
    metadata.sessionCount = 0;
    logger.info('Session count reset to 0');
  }

  // Track retry count
  if (!metadata.retryCount) {
    metadata.retryCount = {};
  }

  if (!metadata.retryCount[stage]) {
    metadata.retryCount[stage] = 0;
  }

  metadata.retryCount[stage]++;

  const metadataPath = path.join('.ccautorun/plans', id, 'metadata.json');
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');

  // Record in session log
  try {
    await recordRetry(id, stage, resetCount);
  } catch (error) {
    logger.warn('Failed to record retry in session log:', error.message);
  }

  logger.info(chalk.green('✓'), `Retrying stage ${stage} of plan "${metadata.name}"`);

  if (previousStatus === 'failed') {
    console.log(chalk.gray('  Status: '), `${chalk.red('failed')} → ${chalk.blue('running')}`);
  }

  console.log(chalk.gray('  Retry count: '), metadata.retryCount[stage]);

  if (resetCount) {
    console.log(chalk.gray('  Session count: '), 'reset to 0');
  }

  console.log();
  console.log(chalk.gray('Continue with: '), chalk.white(`ccautorun run ${id}`));
  console.log();
}

/**
 * ccAutoRun skip command
 *
 * Skip a stage in a plan
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
 * Record skip action in session log
 */
async function recordSkip(planId, stageNumber, reason) {
  const sessionLogPath = path.join('.ccautorun/sessions', `${planId}.jsonl`);

  const logEntry = JSON.stringify({
    timestamp: new Date().toISOString(),
    type: 'skip',
    stage: stageNumber,
    reason: reason || 'No reason provided',
  });

  await fs.appendFile(sessionLogPath, logEntry + '\n', 'utf-8');
}

/**
 * Skip command handler
 */
export async function skip(planId, stageNumber, options = {}) {
  const { reason, dryRun = false } = options;

  // Check if initialized
  const config = new Config();
  const isInitialized = await config.isInitialized();

  if (!isInitialized) {
    throw Errors.notInitialized();
  }

  // Find plan
  const { id, metadata } = await findPlan(planId);

  // Validate stage number
  const stage = parseInt(stageNumber);
  if (isNaN(stage) || stage < 1 || stage > metadata.totalStages) {
    throw new Error(`Invalid stage number: ${stageNumber}. Must be between 1 and ${metadata.totalStages}`);
  }

  // Check if stage can be skipped
  if (stage < metadata.currentStage) {
    throw new Error(`Cannot skip stage ${stage}: already completed`);
  }

  if (stage > metadata.currentStage + 1) {
    throw new Error(`Cannot skip stage ${stage}: must skip stages in order`);
  }

  if (dryRun) {
    console.log(chalk.gray('[DRY RUN] Would skip stage:'));
    console.log(chalk.gray(`  Plan: ${metadata.name}`));
    console.log(chalk.gray(`  Stage: ${stage}/${metadata.totalStages}`));
    console.log(chalk.gray(`  Reason: ${reason || 'No reason provided'}`));
    console.log();
    console.log(chalk.yellow('⚠ Warning: Skipping stages may cause subsequent stages to fail'));
    return;
  }

  // Show warning
  console.log(chalk.yellow('\n⚠ Warning: Skipping stages may cause subsequent stages to fail\n'));

  // Update metadata
  metadata.currentStage = stage + 1;
  metadata.updatedAt = new Date().toISOString();

  if (!metadata.skippedStages) {
    metadata.skippedStages = [];
  }

  metadata.skippedStages.push({
    stage,
    reason: reason || 'No reason provided',
    skippedAt: new Date().toISOString(),
  });

  const metadataPath = path.join('.ccautorun/plans', id, 'metadata.json');
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');

  // Record in session log
  try {
    await recordSkip(id, stage, reason);
  } catch (error) {
    logger.warn('Failed to record skip in session log:', error.message);
  }

  logger.info(chalk.green('✓'), `Skipped stage ${stage} of plan "${metadata.name}"`);

  if (reason) {
    console.log(chalk.gray('  Reason: '), reason);
  }

  console.log();
  console.log(chalk.gray('Next stage: '), `${metadata.currentStage}/${metadata.totalStages}`);
  console.log();
}

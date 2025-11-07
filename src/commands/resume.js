/**
 * ccAutoRun resume command
 *
 * Resume a paused plan
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
 * Resume command handler
 */
export async function resume(planId, options = {}) {
  const { dryRun = false } = options;

  // Check if initialized
  const config = new Config();
  const isInitialized = await config.isInitialized();

  if (!isInitialized) {
    throw Errors.notInitialized();
  }

  // Find plan
  const { id, metadata } = await findPlan(planId);

  // Check if plan can be resumed
  if (metadata.status !== 'paused' && metadata.status !== 'failed') {
    throw new Error(`Plan "${metadata.name}" cannot be resumed (status: ${metadata.status})`);
  }

  if (dryRun) {
    console.log(chalk.gray('[DRY RUN] Would resume plan:'));
    console.log(chalk.gray(`  ID: ${id}`));
    console.log(chalk.gray(`  Name: ${metadata.name}`));
    console.log(chalk.gray(`  Current stage: ${metadata.currentStage}/${metadata.totalStages}`));
    console.log(chalk.gray(`  Previous status: ${metadata.status}`));
    return;
  }

  // Update metadata
  const previousStatus = metadata.status;
  metadata.status = 'running';
  metadata.resumedAt = new Date().toISOString();
  metadata.updatedAt = new Date().toISOString();

  if (metadata.pausedAt) {
    delete metadata.pausedAt;
  }

  const metadataPath = path.join('.ccautorun/plans', id, 'metadata.json');
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');

  logger.info(chalk.green('✓'), `Plan "${metadata.name}" resumed from ${previousStatus} state`);
  console.log();
  console.log(chalk.gray('Continue with: '), chalk.white(`ccautorun run ${id}`));
  console.log();
}

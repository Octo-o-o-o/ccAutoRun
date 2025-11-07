/**
 * ccAutoRun pause command
 *
 * Pause a running plan
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
 * Pause command handler
 */
export async function pause(planId, options = {}) {
  const { dryRun = false } = options;

  // Check if initialized
  const config = new Config();
  const isInitialized = await config.isInitialized();

  if (!isInitialized) {
    throw Errors.notInitialized();
  }

  // Find plan
  const { id, metadata } = await findPlan(planId);

  // Check if plan can be paused
  if (metadata.status !== 'running') {
    throw new Error(`Plan "${metadata.name}" is not running (status: ${metadata.status})`);
  }

  if (dryRun) {
    console.log(chalk.gray('[DRY RUN] Would pause plan:'));
    console.log(chalk.gray(`  ID: ${id}`));
    console.log(chalk.gray(`  Name: ${metadata.name}`));
    console.log(chalk.gray(`  Current stage: ${metadata.currentStage}/${metadata.totalStages}`));
    return;
  }

  // Update metadata
  metadata.status = 'paused';
  metadata.pausedAt = new Date().toISOString();
  metadata.updatedAt = new Date().toISOString();

  const metadataPath = path.join('.ccautorun/plans', id, 'metadata.json');
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');

  logger.info(chalk.green('✓'), `Plan "${metadata.name}" paused`);
  console.log();
  console.log(chalk.gray('Resume with: '), chalk.white(`ccautorun resume ${id}`));
  console.log();
}

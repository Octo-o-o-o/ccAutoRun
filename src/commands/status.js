/**
 * ccAutoRun status command
 *
 * Show current plan execution status
 */

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { Config } from '../utils/config.js';
import { getLogger } from '../utils/logger.js';
import { Errors } from '../utils/error-handler.js';

const logger = getLogger();

export async function status(options = {}) {
  const { planId, json = false } = options;

  // Check if initialized
  const config = new Config();
  const isInitialized = await config.isInitialized();

  if (!isInitialized) {
    throw Errors.notInitialized();
  }

  try {
    // If no plan ID provided, try to find the most recent running plan
    let targetPlanId = planId;

    if (!targetPlanId) {
      const plansDir = '.ccautorun/plans';
      const entries = await fs.readdir(plansDir);

      // Find most recent running plan
      let mostRecent = null;
      let mostRecentTime = 0;

      for (const entry of entries) {
        const metadataPath = path.join(plansDir, entry, 'metadata.json');
        try {
          const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
          const stats = await fs.stat(metadataPath);

          if (metadata.status === 'running' && stats.mtime > mostRecentTime) {
            mostRecentTime = stats.mtime;
            mostRecent = entry;
          }
        } catch {
          // Skip
        }
      }

      if (!mostRecent) {
        logger.info('No active plan found');
        console.log(chalk.gray('Use: ') + chalk.white('ccautorun list') + chalk.gray(' to see all plans'));
        return;
      }

      targetPlanId = mostRecent;
    }

    // Load plan metadata
    const metadataPath = path.join('.ccautorun/plans', targetPlanId, 'metadata.json');
    const planPath = path.join('.ccautorun/plans', targetPlanId, 'EXECUTION_PLAN.md');

    let metadata;
    try {
      metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
    } catch (error) {
      throw Errors.planNotFound(targetPlanId);
    }

    // Get stage files if split architecture
    let stageFiles = [];
    if (metadata.architecture === 'split') {
      const stagesDir = path.join('.ccautorun/plans', targetPlanId, 'stages');
      try {
        const files = await fs.readdir(stagesDir);
        stageFiles = files.filter(f => f.endsWith('.md')).sort();
      } catch {
        // No stages directory
      }
    }

    // Output
    if (json) {
      console.log(JSON.stringify({ ...metadata, stageFiles }, null, 2));
    } else {
      console.log();
      console.log(chalk.bold(`Plan: ${metadata.name || targetPlanId}`));
      console.log(chalk.gray('─'.repeat(60)));
      console.log(chalk.gray('ID: ') + targetPlanId);

      const statusColor =
        metadata.status === 'completed' ? chalk.green :
        metadata.status === 'running' ? chalk.blue :
        metadata.status === 'failed' ? chalk.red :
        chalk.yellow;

      console.log(chalk.gray('Status: ') + statusColor(metadata.status));
      console.log(chalk.gray('Progress: ') + `Stage ${metadata.currentStage}/${metadata.totalStages}`);
      console.log(chalk.gray('Architecture: ') + metadata.architecture);

      if (metadata.estimatedTime) {
        console.log(chalk.gray('Estimated time: ') + metadata.estimatedTime);
      }

      if (metadata.tags && metadata.tags.length > 0) {
        console.log(chalk.gray('Tags: ') + metadata.tags.join(', '));
      }

      console.log(chalk.gray('Created: ') + new Date(metadata.createdAt).toLocaleString());
      console.log(chalk.gray('Updated: ') + new Date(metadata.updatedAt).toLocaleString());

      // Show stage files for split architecture
      if (stageFiles.length > 0) {
        console.log();
        console.log(chalk.bold('Stages:'));
        for (let i = 0; i < stageFiles.length; i++) {
          const marker = i + 1 === metadata.currentStage ? chalk.blue('▶') : i + 1 < metadata.currentStage ? chalk.green('✓') : chalk.gray('○');
          console.log(`  ${marker} ${stageFiles[i]}`);
        }
      }

      console.log();
    }
  } catch (error) {
    logger.error('Failed to get status:', error);
    throw error;
  }
}

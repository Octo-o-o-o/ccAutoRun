/**
 * ccAutoRun list command
 *
 * List all execution plans
 */

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { Config } from '../utils/config.js';
import { getLogger } from '../utils/logger.js';
import { Errors } from '../utils/error-handler.js';

const logger = getLogger();

export async function list(options = {}) {
  const { all = false, json = false } = options;

  // Check if initialized
  const config = new Config();
  const isInitialized = await config.isInitialized();

  if (!isInitialized) {
    throw Errors.notInitialized();
  }

  try {
    const plansDir = '.ccautorun/plans';
    let entries;

    try {
      entries = await fs.readdir(plansDir);
    } catch (error) {
      if (error.code === 'ENOENT') {
        if (json) {
          console.log(JSON.stringify({ plans: [] }, null, 2));
        } else {
          logger.info('No plans found');
          console.log(chalk.gray('Create a plan with: ') + chalk.white('claude "/plan <description>"'));
        }
        return;
      }
      throw error;
    }

    // Filter out non-plan files
    const plans = [];

    for (const entry of entries) {
      const entryPath = path.join(plansDir, entry);
      const stats = await fs.stat(entryPath);

      if (stats.isDirectory()) {
        // Check for metadata.json or EXECUTION_PLAN.md
        const metadataPath = path.join(entryPath, 'metadata.json');
        const planPath = path.join(entryPath, 'EXECUTION_PLAN.md');

        try {
          const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
          const planStats = await fs.stat(planPath);

          plans.push({
            id: entry,
            name: metadata.name || entry,
            status: metadata.status || 'unknown',
            architecture: metadata.architecture || 'split',
            currentStage: metadata.currentStage || 1,
            totalStages: metadata.totalStages || 0,
            updatedAt: planStats.mtime,
            ...metadata,
          });
        } catch {
          // Skip if metadata not found
        }
      }
    }

    // Sort by updated time (newest first)
    plans.sort((a, b) => b.updatedAt - a.updatedAt);

    // Output
    if (json) {
      console.log(JSON.stringify({ plans }, null, 2));
    } else {
      if (plans.length === 0) {
        logger.info('No plans found');
        console.log(chalk.gray('Create a plan with: ') + chalk.white('claude "/plan <description>"'));
        return;
      }

      console.log(chalk.bold(`\nFound ${plans.length} plan(s):\n`));

      for (const plan of plans) {
        const statusColor = plan.status === 'completed' ? chalk.green : plan.status === 'running' ? chalk.blue : plan.status === 'failed' ? chalk.red : chalk.yellow;

        console.log(chalk.bold(plan.id));
        console.log(chalk.gray(`  Name: `) + plan.name);
        console.log(chalk.gray(`  Status: `) + statusColor(plan.status));
        console.log(chalk.gray(`  Progress: `) + `${plan.currentStage}/${plan.totalStages} stages`);
        console.log(chalk.gray(`  Architecture: `) + plan.architecture);
        console.log(chalk.gray(`  Updated: `) + plan.updatedAt.toLocaleString());
        console.log();
      }

      console.log(chalk.gray('View details: ') + chalk.white('ccautorun status <plan-id>'));
      console.log();
    }
  } catch (error) {
    logger.error('Failed to list plans:', error);
    throw error;
  }
}

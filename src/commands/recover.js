/**
 * ccAutoRun recover command
 *
 * Recover from a failed plan execution
 * Supports multiple recovery strategies: Retry, Skip, Rollback, Abort
 */

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { Config } from '../utils/config.js';
import { getLogger } from '../utils/logger.js';
import { Errors } from '../utils/error-handler.js';
import { RecoveryManager, RecoveryStrategy } from '../core/recovery-manager.js';
import { SessionManager } from '../core/session-manager.js';

const logger = getLogger();

/**
 * Find failed or paused plans
 */
async function findFailedPlans() {
  const sessions = SessionManager.list();

  return sessions.filter(
    s => s.status === 'failed' || s.status === 'paused' || s.status === 'aborted'
  );
}

/**
 * Find plan by ID or name
 */
async function findPlan(planId) {
  if (!planId) {
    // Auto-detect most recent failed plan
    const failedPlans = await findFailedPlans();

    if (failedPlans.length === 0) {
      throw new Error('No failed plans found');
    }

    // Return most recent
    failedPlans.sort((a, b) => new Date(b.lastExecuted) - new Date(a.lastExecuted));
    const plan = failedPlans[0];

    logger.info(`Auto-detected failed plan: ${plan.taskName}`);
    return plan;
  }

  // Find by task name
  const session = SessionManager.read(planId);
  if (!session) {
    throw Errors.sessionNotFound({ taskName: planId });
  }

  return session;
}

/**
 * Display failure details
 */
function displayFailureDetails(session, failureDetails) {
  console.log();
  console.log(chalk.bold.red('❌ Plan Execution Failed'));
  console.log();

  console.log(chalk.gray('Plan:'), chalk.white(session.taskName));
  console.log(chalk.gray('Status:'), chalk.red(session.status));
  console.log(chalk.gray('Current Stage:'), chalk.white(session.currentStage));
  console.log(chalk.gray('Last Executed:'), chalk.white(session.lastExecuted));

  if (session.lastError) {
    console.log();
    console.log(chalk.gray('Error:'));
    console.log(chalk.red('  ' + session.lastError));
  }

  if (failureDetails?.recoveryPoints?.length > 0) {
    console.log();
    console.log(chalk.gray('Available Recovery Points:'));
    failureDetails.recoveryPoints.forEach(rp => {
      console.log(
        chalk.gray(`  - Stage ${rp.stage}`),
        chalk.dim(`(${new Date(rp.createdAt).toLocaleString()})`)
      );
    });
  }

  console.log();
}

/**
 * Prompt for recovery strategy
 */
async function promptRecoveryStrategy(session) {
  const choices = [
    {
      name: `${chalk.yellow('Retry')} - Retry the current stage`,
      value: RecoveryStrategy.RETRY,
    },
    {
      name: `${chalk.blue('Skip')} - Skip the current stage and continue`,
      value: RecoveryStrategy.SKIP,
    },
    {
      name: `${chalk.magenta('Rollback')} - Rollback to a previous stage`,
      value: RecoveryStrategy.ROLLBACK,
    },
    {
      name: `${chalk.red('Abort')} - Abort the plan and preserve state`,
      value: RecoveryStrategy.ABORT,
    },
    new inquirer.Separator(),
    {
      name: `${chalk.gray('Cancel')} - Cancel recovery`,
      value: 'cancel',
    },
  ];

  const { strategy } = await inquirer.prompt([
    {
      type: 'list',
      name: 'strategy',
      message: 'Select recovery strategy:',
      choices,
    },
  ]);

  if (strategy === 'cancel') {
    return null;
  }

  // For rollback, prompt for target stage
  if (strategy === RecoveryStrategy.ROLLBACK) {
    const maxStage = session.currentStage - 1;

    if (maxStage < 1) {
      console.log(chalk.yellow('⚠ Cannot rollback: no previous stages available'));
      return null;
    }

    const { targetStage } = await inquirer.prompt([
      {
        type: 'number',
        name: 'targetStage',
        message: 'Rollback to stage:',
        default: maxStage,
        validate: value => {
          if (value < 1 || value >= session.currentStage) {
            return `Stage must be between 1 and ${maxStage}`;
          }
          return true;
        },
      },
    ]);

    return { strategy, targetStage };
  }

  // For skip, prompt for reason
  if (strategy === RecoveryStrategy.SKIP) {
    const { reason } = await inquirer.prompt([
      {
        type: 'input',
        name: 'reason',
        message: 'Reason for skipping (optional):',
        default: 'User requested skip',
      },
    ]);

    return { strategy, reason };
  }

  // For abort, prompt for reason
  if (strategy === RecoveryStrategy.ABORT) {
    const { reason } = await inquirer.prompt([
      {
        type: 'input',
        name: 'reason',
        message: 'Reason for aborting (optional):',
        default: 'User requested abort',
      },
    ]);

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: chalk.yellow('⚠ This will abort the plan. Continue?'),
        default: false,
      },
    ]);

    if (!confirm) {
      return null;
    }

    return { strategy, reason };
  }

  return { strategy };
}

/**
 * Display recovery result
 */
function displayRecoveryResult(result) {
  console.log();

  if (result.success) {
    console.log(chalk.green('✓'), chalk.bold('Recovery completed successfully'));
    console.log();

    console.log(chalk.gray('Strategy:'), chalk.white(result.strategy));
    console.log(chalk.gray('Plan:'), chalk.white(result.taskName));

    if (result.message) {
      console.log(chalk.gray('Result:'), chalk.white(result.message));
    }

    if (result.currentStage) {
      console.log(chalk.gray('Current Stage:'), chalk.white(result.currentStage));
    }

    if (result.nextAction) {
      console.log();
      console.log(chalk.gray('Next:'), chalk.white(result.nextAction));
    }

    if (result.strategy !== RecoveryStrategy.ABORT) {
      console.log();
      console.log(
        chalk.gray('Resume with:'),
        chalk.white(`ccautorun resume ${result.taskName}`)
      );
    }
  } else {
    console.log(chalk.red('✗'), chalk.bold('Recovery failed'));
    console.log();

    if (result.error) {
      console.log(chalk.red(result.error));
    }
  }

  console.log();
}

/**
 * Recover command handler
 */
export async function recover(planId, options = {}) {
  const { strategy: strategyOption, interactive = true, stage, reason } = options;

  try {
    // Check if initialized
    const config = new Config();
    const isInitialized = await config.isInitialized();

    if (!isInitialized) {
      throw Errors.notInitialized();
    }

    // Find plan
    const session = await findPlan(planId);
    const recoveryManager = new RecoveryManager();

    // Get failure details
    const failureDetails = await recoveryManager.getFailureDetails(session.taskName);

    // Display failure details
    displayFailureDetails(session, failureDetails);

    // Determine recovery strategy
    let recoveryOptions = {};
    let strategy;

    if (interactive && !strategyOption) {
      // Interactive mode: prompt for strategy
      const promptResult = await promptRecoveryStrategy(session);

      if (!promptResult) {
        console.log(chalk.yellow('Recovery cancelled'));
        return;
      }

      strategy = promptResult.strategy;
      recoveryOptions = promptResult;
    } else if (strategyOption) {
      // Non-interactive mode: use provided strategy
      strategy = strategyOption;

      if (strategy === RecoveryStrategy.ROLLBACK && stage) {
        recoveryOptions.targetStage = stage;
      }

      if ((strategy === RecoveryStrategy.SKIP || strategy === RecoveryStrategy.ABORT) && reason) {
        recoveryOptions.reason = reason;
      }
    } else {
      throw new Error('No recovery strategy specified. Use --strategy or --interactive.');
    }

    // Confirm action (non-interactive)
    if (!interactive && strategy === RecoveryStrategy.ABORT) {
      console.log(
        chalk.yellow('⚠ Aborting plan in non-interactive mode. Use --interactive to confirm.')
      );
      return;
    }

    // Execute recovery
    console.log();
    console.log(chalk.gray('Executing recovery...'));
    console.log();

    const result = await recoveryManager.recover(
      session.taskName,
      strategy,
      recoveryOptions
    );

    // Display result
    displayRecoveryResult(result);
  } catch (error) {
    logger.error('Recovery failed:', { error: error.message });
    throw error;
  }
}

/**
 * Trigger Command
 *
 * Manually trigger next stage continuation
 * Useful when auto-continue hook fails or doesn't detect completion
 */

import { exec } from 'child_process';
import chalk from 'chalk';
import notifier from 'node-notifier';
import {
  parsePlan,
  getNextStageFile,
  updateProgress,
  detectArchitecture
} from '../core/plan-parser.js';
import {
  readSession,
  updateSession,
  createSession
} from '../core/session-manager.js';
import { checkLimit } from '../core/safety-limiter.js';

/**
 * Trigger next stage
 * @param {string} taskName - Task name or plan path
 * @param {Object} options - Command options
 */
export async function triggerCommand(taskName, options = {}) {
  try {
    console.log(chalk.blue(`[trigger] Manually triggering next stage for task: ${taskName}`));

    // Determine plan path
    // If taskName contains / or \, treat as path
    // Otherwise, look for plan in .ccautorun/plans/<taskName>/
    let planPath = taskName;

    if (!taskName.includes('/') && !taskName.includes('\\')) {
      // Try common locations
      const possiblePaths = [
        `${taskName}.md`,
        `${taskName}/README.md`,
        `${taskName}/EXECUTION_PLAN.md`,
        `.ccautorun/plans/${taskName}/README.md`,
        `.ccautorun/plans/${taskName}/EXECUTION_PLAN.md`
      ];

      let found = false;
      for (const p of possiblePaths) {
        const archType = detectArchitecture(p);
        if (archType) {
          planPath = p;
          found = true;
          break;
        }
      }

      if (!found) {
        console.error(chalk.red(`Plan not found for task: ${taskName}`));
        console.log(chalk.yellow('Tried paths:'));
        possiblePaths.forEach(p => console.log(`  - ${p}`));
        return;
      }
    }

    console.log(chalk.gray(`Plan path: ${planPath}`));

    // Detect architecture
    const archType = detectArchitecture(planPath);

    if (!archType) {
      console.error(chalk.red(`Invalid plan path: ${planPath}`));
      return;
    }

    console.log(chalk.gray(`Architecture: ${archType}`));

    // Parse plan
    const planData = parsePlan(planPath);
    const { config, progress } = planData;
    const totalStages = config.stages || 0;
    const currentStage = config.current || 1;
    const safetyLimit = config.safety_limit || 0;

    console.log(chalk.cyan(`Current stage: ${currentStage}/${totalStages}`));

    // Read or create session
    let session = readSession(taskName);

    if (!session) {
      console.log(chalk.yellow('No session found, creating new one'));
      session = createSession(taskName, {
        currentStage,
        status: 'active'
      });
    }

    // Check if paused
    if (session.status === 'paused' && !options.force) {
      console.error(chalk.red(`Session is paused. Use --force to override or run "ccautorun resume ${taskName}"`));
      return;
    }

    // Check if failed
    if (session.status === 'failed' && !options.force) {
      console.error(chalk.red(`Session failed. Use --force to override or run "ccautorun recover ${taskName}"`));
      if (session.lastError) {
        console.log(chalk.gray(`Error: ${session.lastError}`));
      }
      return;
    }

    // Check safety limit
    if (!options.skipLimit) {
      const limitCheck = checkLimit(taskName, safetyLimit);

      if (!limitCheck.shouldContinue) {
        console.error(chalk.red(limitCheck.message));
        console.log(chalk.yellow('Use --skip-limit to override'));
        return;
      }
    }

    // Check if all stages completed
    if (currentStage >= totalStages) {
      console.log(chalk.green('All stages completed!'));
      return;
    }

    // Update progress to next stage
    const nextStage = currentStage + 1;
    console.log(chalk.blue(`Updating progress to stage ${nextStage}...`));

    try {
      updateProgress(planPath, nextStage);
    } catch (error) {
      console.error(chalk.red(`Failed to update progress: ${error.message}`));
      return;
    }

    // Get next stage file
    const nextStageFile = getNextStageFile(planData);

    if (!nextStageFile) {
      console.error(chalk.red('Next stage file not found'));
      return;
    }

    console.log(chalk.gray(`Next stage file: ${nextStageFile}`));

    // Update session
    const lastSessionId = session.lastSessionId || 'new';

    updateSession(taskName, {
      currentStage: nextStage,
      status: 'active'
    });

    // Build claude command
    const skipPermissions = config.auto_continue?.skip_permissions !== false;
    const skipPermsFlag = skipPermissions ? '--dangerously-skip-permissions' : '';

    let claudeCommand;

    if (options.resume && lastSessionId !== 'new') {
      // Resume existing session
      claudeCommand = `claude ${skipPermsFlag} --resume ${lastSessionId} "@${nextStageFile}" "开始执行 Stage ${nextStage}"`;
    } else {
      // Start new session
      claudeCommand = `claude ${skipPermsFlag} "@${nextStageFile}" "开始执行 Stage ${nextStage}"`;
    }

    console.log(chalk.cyan('Executing:'));
    console.log(chalk.gray(claudeCommand));

    // Execute command
    if (!options.dryRun) {
      exec(claudeCommand, (error, stdout, stderr) => {
        if (error) {
          console.error(chalk.red(`Failed to execute claude: ${error.message}`));
        } else {
          console.log(chalk.green('Claude command executed successfully'));
        }
      });

      // Send notification
      notifier.notify({
        title: 'ccAutoRun - Stage Triggered',
        message: `Starting stage ${nextStage}/${totalStages} for task "${taskName}"`,
        timeout: 5
      });

      console.log(chalk.green(`✓ Stage ${nextStage} triggered successfully`));
    } else {
      console.log(chalk.yellow('[Dry run] Command not executed'));
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
  }
}

export default triggerCommand;

/**
 * Reset Command
 *
 * Reset session state and optionally reset to a specific stage
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import {
  readSession,
  updateSession,
  deleteSession,
  createSession
} from '../core/session-manager.js';
import {
  parsePlan,
  updateProgress,
  detectArchitecture
} from '../core/plan-parser.js';

/**
 * Reset session
 * @param {string} taskName - Task name
 * @param {Object} options - Command options
 */
export async function resetCommand(taskName, options = {}) {
  try {
    console.log(chalk.blue(`[reset] Resetting session for task: ${taskName}`));

    // Read session
    const session = readSession(taskName);

    if (!session) {
      console.error(chalk.red(`Session not found: ${taskName}`));
      return;
    }

    console.log(chalk.gray('Current session:'));
    console.log(chalk.gray(`  Status: ${session.status}`));
    console.log(chalk.gray(`  Current stage: ${session.currentStage}`));
    console.log(chalk.gray(`  Count: ${session.count}`));

    // Confirm reset
    if (!options.yes) {
      const answer = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Are you sure you want to reset this session?',
          default: false
        }
      ]);

      if (!answer.confirm) {
        console.log(chalk.yellow('Reset cancelled'));
        return;
      }
    }

    // Handle --stage option
    if (options.stage !== undefined) {
      const stageNum = parseInt(options.stage, 10);

      if (isNaN(stageNum) || stageNum < 1) {
        console.error(chalk.red('Invalid stage number'));
        return;
      }

      console.log(chalk.blue(`Resetting to stage ${stageNum}...`));

      // Find plan path
      let planPath = taskName;

      if (!taskName.includes('/') && !taskName.includes('\\')) {
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
          return;
        }
      }

      // Validate stage number
      const planData = parsePlan(planPath);
      const totalStages = planData.config.stages || 0;

      if (stageNum > totalStages) {
        console.error(chalk.red(`Stage ${stageNum} exceeds total stages (${totalStages})`));
        return;
      }

      // Update plan progress
      try {
        updateProgress(planPath, stageNum);
        console.log(chalk.green(`✓ Plan progress reset to stage ${stageNum}`));
      } catch (error) {
        console.error(chalk.red(`Failed to update plan: ${error.message}`));
        return;
      }

      // Reset session with new stage
      updateSession(taskName, {
        currentStage: stageNum,
        count: 0,
        status: 'active',
        lastError: null
      });

      console.log(chalk.green(`✓ Session reset to stage ${stageNum}`));
    } else {
      // Full reset
      console.log(chalk.blue('Performing full reset...'));

      // Reset count and status
      updateSession(taskName, {
        count: 0,
        status: 'active',
        lastError: null
      });

      console.log(chalk.green('✓ Session reset successfully'));
    }

    // Show new state
    const newSession = readSession(taskName);
    console.log(chalk.cyan('\nNew session state:'));
    console.log(chalk.gray(`  Status: ${newSession.status}`));
    console.log(chalk.gray(`  Current stage: ${newSession.currentStage}`));
    console.log(chalk.gray(`  Count: ${newSession.count}`));
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
  }
}

/**
 * Reset all sessions
 */
export async function resetAllCommand(options = {}) {
  try {
    console.log(chalk.blue('[reset-all] Resetting all sessions'));

    // Confirm
    if (!options.yes) {
      const answer = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: chalk.red('This will reset ALL sessions. Are you sure?'),
          default: false
        }
      ]);

      if (!answer.confirm) {
        console.log(chalk.yellow('Reset cancelled'));
        return;
      }
    }

    // Get sessions directory
    const { listSessions } = await import('../core/session-manager.js');
    const sessions = listSessions();

    if (sessions.length === 0) {
      console.log(chalk.yellow('No sessions to reset'));
      return;
    }

    console.log(chalk.gray(`Found ${sessions.length} sessions`));

    // Reset each session
    for (const session of sessions) {
      updateSession(session.taskName, {
        count: 0,
        status: 'active',
        lastError: null
      });

      console.log(chalk.gray(`  ✓ Reset: ${session.taskName}`));
    }

    console.log(chalk.green(`\n✓ All ${sessions.length} sessions reset successfully`));
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
  }
}

export default resetCommand;

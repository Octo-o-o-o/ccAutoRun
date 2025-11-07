/**
 * Recovery Manager
 *
 * Manage error recovery, snapshots, and plan state restoration
 * Supports multiple recovery strategies: Retry, Skip, Rollback, Abort
 */

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import os from 'os';
import { SessionManager } from './session-manager.js';
import { getLogger } from '../utils/logger.js';
import { Errors } from '../utils/error-handler.js';

const logger = getLogger();

/**
 * Recovery strategies
 */
export const RecoveryStrategy = {
  RETRY: 'retry',       // Retry current stage
  SKIP: 'skip',         // Skip current stage and continue
  ROLLBACK: 'rollback', // Rollback to previous stage snapshot
  ABORT: 'abort',       // Abort plan and preserve state
};

/**
 * Recovery point status
 */
export const RecoveryPointStatus = {
  AVAILABLE: 'available',
  CORRUPTED: 'corrupted',
  MISSING: 'missing',
};

/**
 * RecoveryManager class
 */
export class RecoveryManager {
  constructor(options = {}) {
    this.ccDir = options.ccDir || path.join(os.homedir(), '.ccautorun');
    this.recoveryDir = path.join(this.ccDir, 'recovery');
    this.snapshotsDir = path.join(this.ccDir, 'snapshots');
    this.ensureDirectories();
  }

  /**
   * Ensure recovery and snapshots directories exist
   */
  ensureDirectories() {
    if (!fsSync.existsSync(this.recoveryDir)) {
      fsSync.mkdirSync(this.recoveryDir, { recursive: true });
    }
    if (!fsSync.existsSync(this.snapshotsDir)) {
      fsSync.mkdirSync(this.snapshotsDir, { recursive: true });
    }
  }

  /**
   * Get recovery point path for a plan and stage
   * @param {string} planId - Plan ID
   * @param {number} stage - Stage number
   * @returns {string} Recovery point path
   */
  getRecoveryPointPath(planId, stage) {
    return path.join(this.recoveryDir, planId, `stage-${stage}.json`);
  }

  /**
   * Detect if a session has failed
   * @param {string} taskName - Task name
   * @returns {Promise<Object|null>} Failure details or null if not failed
   */
  async detectFailure(taskName) {
    try {
      const session = SessionManager.read(taskName);

      if (!session) {
        logger.debug(`No session found for task: ${taskName}`);
        return null;
      }

      // Check if session status is failed
      if (session.status === 'failed') {
        logger.info(`Detected failed session for task: ${taskName}`);

        return {
          taskName,
          status: session.status,
          currentStage: session.currentStage,
          lastError: session.lastError,
          lastExecuted: session.lastExecuted,
          failedAt: new Date().toISOString(),
        };
      }

      return null;
    } catch (error) {
      logger.error(`Error detecting failure for task ${taskName}:`, { error: error.message });
      throw error;
    }
  }

  /**
   * Create a recovery point for a specific stage
   * @param {string} planId - Plan ID
   * @param {number} stage - Stage number
   * @param {Object} metadata - Recovery point metadata
   * @returns {Promise<Object>} Recovery point data
   */
  async createRecoveryPoint(planId, stage, metadata = {}) {
    try {
      const recoveryPointPath = this.getRecoveryPointPath(planId, stage);
      const recoveryPointDir = path.dirname(recoveryPointPath);

      // Ensure directory exists
      if (!fsSync.existsSync(recoveryPointDir)) {
        await fs.mkdir(recoveryPointDir, { recursive: true });
      }

      const recoveryPoint = {
        planId,
        stage,
        createdAt: new Date().toISOString(),
        status: RecoveryPointStatus.AVAILABLE,
        ...metadata,
      };

      // Write recovery point atomically
      const tmpPath = `${recoveryPointPath}.tmp`;
      await fs.writeFile(tmpPath, JSON.stringify(recoveryPoint, null, 2), 'utf-8');
      await fs.rename(tmpPath, recoveryPointPath);

      logger.debug(`Created recovery point for plan ${planId} stage ${stage}`);

      return recoveryPoint;
    } catch (error) {
      logger.error(`Error creating recovery point for plan ${planId} stage ${stage}:`, {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * List all recovery points for a plan
   * @param {string} planId - Plan ID
   * @returns {Promise<Array>} Array of recovery points
   */
  async listRecoveryPoints(planId) {
    try {
      const planRecoveryDir = path.join(this.recoveryDir, planId);

      // Check if directory exists
      if (!fsSync.existsSync(planRecoveryDir)) {
        logger.debug(`No recovery points found for plan: ${planId}`);
        return [];
      }

      const files = await fs.readdir(planRecoveryDir);
      const recoveryPoints = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const filePath = path.join(planRecoveryDir, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const recoveryPoint = JSON.parse(content);
            recoveryPoints.push(recoveryPoint);
          } catch (error) {
            logger.warn(`Failed to read recovery point ${file}:`, { error: error.message });
          }
        }
      }

      // Sort by stage number
      recoveryPoints.sort((a, b) => a.stage - b.stage);

      return recoveryPoints;
    } catch (error) {
      logger.error(`Error listing recovery points for plan ${planId}:`, { error: error.message });
      throw error;
    }
  }

  /**
   * Get recovery point details
   * @param {string} planId - Plan ID
   * @param {number} stage - Stage number
   * @returns {Promise<Object|null>} Recovery point or null if not found
   */
  async getRecoveryPoint(planId, stage) {
    try {
      const recoveryPointPath = this.getRecoveryPointPath(planId, stage);

      if (!fsSync.existsSync(recoveryPointPath)) {
        return null;
      }

      const content = await fs.readFile(recoveryPointPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      logger.error(`Error reading recovery point for plan ${planId} stage ${stage}:`, {
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Execute recovery using specified strategy
   * @param {string} taskName - Task name (plan ID)
   * @param {string} strategy - Recovery strategy (retry|skip|rollback|abort)
   * @param {Object} options - Recovery options
   * @returns {Promise<Object>} Recovery result
   */
  async recover(taskName, strategy, options = {}) {
    try {
      logger.info(`Starting recovery for task: ${taskName} with strategy: ${strategy}`);

      // Validate strategy
      if (!Object.values(RecoveryStrategy).includes(strategy)) {
        throw Errors.invalidArgument({
          argument: 'strategy',
          expected: Object.values(RecoveryStrategy).join('|'),
          received: strategy,
        });
      }

      // Read current session
      const session = SessionManager.read(taskName);
      if (!session) {
        throw Errors.sessionNotFound({ taskName });
      }

      // Execute recovery based on strategy
      let result;
      switch (strategy) {
        case RecoveryStrategy.RETRY:
          result = await this.executeRetry(session, options);
          break;

        case RecoveryStrategy.SKIP:
          result = await this.executeSkip(session, options);
          break;

        case RecoveryStrategy.ROLLBACK:
          result = await this.executeRollback(session, options);
          break;

        case RecoveryStrategy.ABORT:
          result = await this.executeAbort(session, options);
          break;

        default:
          throw new Error(`Unsupported recovery strategy: ${strategy}`);
      }

      logger.success(`Recovery completed for task: ${taskName}`);

      return {
        success: true,
        strategy,
        taskName,
        ...result,
      };
    } catch (error) {
      logger.error(`Recovery failed for task ${taskName}:`, { error: error.message });
      throw error;
    }
  }

  /**
   * Execute RETRY recovery strategy
   * Resets current stage and allows retry
   * @param {Object} session - Session data
   * @param {Object} options - Options
   * @returns {Promise<Object>} Result
   */
  async executeRetry(session, options = {}) {
    logger.info(`Executing RETRY for task: ${session.taskName} at stage ${session.currentStage}`);

    // Reset session status and error
    SessionManager.update(session.taskName, {
      status: 'active',
      lastError: null,
      count: 0, // Reset count to allow retry
    });

    return {
      message: `Stage ${session.currentStage} reset for retry`,
      currentStage: session.currentStage,
      nextAction: 'resume execution',
    };
  }

  /**
   * Execute SKIP recovery strategy
   * Skips current stage and moves to next
   * @param {Object} session - Session data
   * @param {Object} options - Options
   * @returns {Promise<Object>} Result
   */
  async executeSkip(session, options = {}) {
    logger.info(`Executing SKIP for task: ${session.taskName} at stage ${session.currentStage}`);

    const skippedStage = session.currentStage;
    const nextStage = session.currentStage + 1;

    // Update session to next stage
    SessionManager.update(session.taskName, {
      status: 'active',
      currentStage: nextStage,
      lastError: null,
      count: 0,
      skippedStages: [...(session.skippedStages || []), skippedStage],
    });

    // Log skip reason
    const skipReason = options.reason || 'User requested skip';
    logger.warn(`Skipped stage ${skippedStage}: ${skipReason}`);

    return {
      message: `Stage ${skippedStage} skipped, proceeding to stage ${nextStage}`,
      skippedStage,
      currentStage: nextStage,
      skipReason,
      nextAction: 'resume execution',
    };
  }

  /**
   * Execute ROLLBACK recovery strategy
   * Restores previous stage snapshot
   * @param {Object} session - Session data
   * @param {Object} options - Options (targetStage)
   * @returns {Promise<Object>} Result
   */
  async executeRollback(session, options = {}) {
    const currentStage = session.currentStage;
    const targetStage = options.targetStage || currentStage - 1;

    logger.info(
      `Executing ROLLBACK for task: ${session.taskName} from stage ${currentStage} to stage ${targetStage}`
    );

    // Validate target stage
    if (targetStage < 1) {
      throw Errors.invalidArgument({
        argument: 'targetStage',
        expected: '>= 1',
        received: targetStage,
      });
    }

    // Check if recovery point exists
    const recoveryPoint = await this.getRecoveryPoint(session.taskName, targetStage);
    if (!recoveryPoint) {
      throw Errors.recoveryPointNotFound({
        planId: session.taskName,
        stage: targetStage,
      });
    }

    // Update session to target stage
    SessionManager.update(session.taskName, {
      status: 'active',
      currentStage: targetStage,
      lastError: null,
      count: 0,
      rolledBackFrom: currentStage,
    });

    logger.warn(`Rolled back from stage ${currentStage} to stage ${targetStage}`);

    return {
      message: `Rolled back from stage ${currentStage} to stage ${targetStage}`,
      rolledBackFrom: currentStage,
      currentStage: targetStage,
      recoveryPoint,
      nextAction: 'resume execution from target stage',
    };
  }

  /**
   * Execute ABORT recovery strategy
   * Marks plan as aborted, preserves state
   * @param {Object} session - Session data
   * @param {Object} options - Options
   * @returns {Promise<Object>} Result
   */
  async executeAbort(session, options = {}) {
    logger.info(`Executing ABORT for task: ${session.taskName} at stage ${session.currentStage}`);

    const abortReason = options.reason || 'User requested abort';

    // Update session to aborted status
    SessionManager.update(session.taskName, {
      status: 'aborted',
      abortedAt: new Date().toISOString(),
      abortReason,
    });

    logger.warn(`Plan aborted: ${abortReason}`);

    return {
      message: `Plan aborted at stage ${session.currentStage}`,
      currentStage: session.currentStage,
      abortReason,
      nextAction: 'plan preserved, can be resumed or deleted',
    };
  }

  /**
   * Get failure details for a task
   * @param {string} taskName - Task name
   * @returns {Promise<Object|null>} Failure details or null
   */
  async getFailureDetails(taskName) {
    try {
      const session = SessionManager.read(taskName);
      if (!session) {
        return null;
      }

      if (session.status !== 'failed') {
        return null;
      }

      return {
        taskName,
        currentStage: session.currentStage,
        lastError: session.lastError,
        lastExecuted: session.lastExecuted,
        count: session.count,
        recoveryPoints: await this.listRecoveryPoints(taskName),
      };
    } catch (error) {
      logger.error(`Error getting failure details for task ${taskName}:`, {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Clean up recovery points for a plan
   * @param {string} planId - Plan ID
   * @returns {Promise<void>}
   */
  async cleanupRecoveryPoints(planId) {
    try {
      const planRecoveryDir = path.join(this.recoveryDir, planId);

      if (fsSync.existsSync(planRecoveryDir)) {
        await fs.rm(planRecoveryDir, { recursive: true, force: true });
        logger.debug(`Cleaned up recovery points for plan: ${planId}`);
      }
    } catch (error) {
      logger.error(`Error cleaning up recovery points for plan ${planId}:`, {
        error: error.message,
      });
      throw error;
    }
  }
}

/**
 * Default RecoveryManager instance (singleton)
 */
let defaultRecoveryManager = null;

export function getRecoveryManager(options = {}) {
  if (!defaultRecoveryManager) {
    defaultRecoveryManager = new RecoveryManager(options);
  }
  return defaultRecoveryManager;
}

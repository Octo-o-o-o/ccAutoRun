/**
 * Pause/Resume Manager
 *
 * Manage plan pause and resume operations
 * - Save and restore execution state
 * - Handle session continuity
 * - Support graceful interruption
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
 * Pause reason types
 */
export const PauseReason = {
  USER_REQUEST: 'user_request',
  SIGNAL_INTERRUPT: 'signal_interrupt', // Ctrl+C
  ERROR: 'error',
  SAFETY_LIMIT: 'safety_limit',
  MANUAL: 'manual',
};

/**
 * Execution state structure
 */
export class ExecutionState {
  constructor(data = {}) {
    this.planId = data.planId || null;
    this.currentStage = data.currentStage || 1;
    this.totalStages = data.totalStages || 0;
    this.sessionId = data.sessionId || null;
    this.claudeSessionId = data.claudeSessionId || null;
    this.startedAt = data.startedAt || new Date().toISOString();
    this.pausedAt = data.pausedAt || null;
    this.completedStages = data.completedStages || [];
    this.skippedStages = data.skippedStages || [];
    this.environment = data.environment || {};
    this.metadata = data.metadata || {};
  }

  /**
   * Serialize to JSON
   */
  toJSON() {
    return {
      planId: this.planId,
      currentStage: this.currentStage,
      totalStages: this.totalStages,
      sessionId: this.sessionId,
      claudeSessionId: this.claudeSessionId,
      startedAt: this.startedAt,
      pausedAt: this.pausedAt,
      completedStages: this.completedStages,
      skippedStages: this.skippedStages,
      environment: this.environment,
      metadata: this.metadata,
    };
  }

  /**
   * Create from JSON
   */
  static fromJSON(data) {
    return new ExecutionState(data);
  }
}

/**
 * PauseResumeManager class
 */
export class PauseResumeManager {
  constructor(options = {}) {
    this.ccDir = options.ccDir || path.join(os.homedir(), '.ccautorun');
    this.stateDir = path.join(this.ccDir, 'state');
    this.plansDir = options.plansDir || path.join(this.ccDir, 'plans');
    this.ensureDirectories();
  }

  /**
   * Ensure state directory exists
   */
  ensureDirectories() {
    if (!fsSync.existsSync(this.stateDir)) {
      fsSync.mkdirSync(this.stateDir, { recursive: true });
    }
  }

  /**
   * Get state file path for a plan
   * @param {string} planId - Plan ID
   * @returns {string} State file path
   */
  getStatePath(planId) {
    return path.join(this.stateDir, `${planId}.json`);
  }

  /**
   * Get plan metadata path
   * @param {string} planId - Plan ID
   * @returns {string} Metadata file path
   */
  getMetadataPath(planId) {
    return path.join(this.plansDir, planId, 'metadata.json');
  }

  /**
   * Pause a running plan
   * @param {string} planId - Plan ID
   * @param {string} reason - Pause reason
   * @param {Object} options - Pause options
   * @returns {Promise<Object>} Pause result
   */
  async pause(planId, reason = PauseReason.USER_REQUEST, options = {}) {
    try {
      logger.info(`Pausing plan: ${planId}, reason: ${reason}`);

      // Read current session
      const session = SessionManager.read(planId);
      if (!session) {
        throw Errors.sessionNotFound({ taskName: planId });
      }

      // Check if already paused
      if (session.status === 'paused') {
        logger.warn(`Plan ${planId} is already paused`);
        return {
          success: true,
          alreadyPaused: true,
          planId,
        };
      }

      // Save execution state
      const state = await this.saveExecutionState(planId, {
        sessionId: session.lastSessionId,
        claudeSessionId: options.claudeSessionId,
        ...options,
      });

      // Update session status
      SessionManager.setStatus(planId, 'paused');

      // Update plan metadata
      await this.updatePlanMetadata(planId, {
        status: 'paused',
        pausedAt: new Date().toISOString(),
        pauseReason: reason,
      });

      logger.success(`Plan ${planId} paused successfully`);

      return {
        success: true,
        planId,
        reason,
        state,
        message: 'Plan paused. Use "ccautorun resume" to continue.',
      };
    } catch (error) {
      logger.error(`Error pausing plan ${planId}:`, { error: error.message });
      throw error;
    }
  }

  /**
   * Resume a paused plan
   * @param {string} planId - Plan ID
   * @param {Object} options - Resume options
   * @returns {Promise<Object>} Resume result
   */
  async resume(planId, options = {}) {
    try {
      logger.info(`Resuming plan: ${planId}`);

      // Check if plan can be resumed
      const canResumeResult = await this.canResume(planId);
      if (!canResumeResult.canResume) {
        throw new Error(`Cannot resume plan ${planId}: ${canResumeResult.reason}`);
      }

      // Load execution state
      const state = await this.loadExecutionState(planId);
      if (!state) {
        throw new Error(`Execution state not found for plan ${planId}`);
      }

      // Update session status
      SessionManager.setStatus(planId, 'active');

      // Update plan metadata
      await this.updatePlanMetadata(planId, {
        status: 'running',
        resumedAt: new Date().toISOString(),
        pausedAt: null,
        pauseReason: null,
      });

      logger.success(`Plan ${planId} resumed successfully`);

      return {
        success: true,
        planId,
        state,
        resumeFrom: {
          stage: state.currentStage,
          claudeSessionId: state.claudeSessionId,
        },
        message: `Resuming from stage ${state.currentStage}`,
      };
    } catch (error) {
      logger.error(`Error resuming plan ${planId}:`, { error: error.message });
      throw error;
    }
  }

  /**
   * Save execution state
   * @param {string} planId - Plan ID
   * @param {Object} stateData - State data
   * @returns {Promise<ExecutionState>} Saved state
   */
  async saveExecutionState(planId, stateData = {}) {
    try {
      logger.debug(`Saving execution state for plan ${planId}`);

      // Read current session and metadata
      const session = SessionManager.read(planId);
      const metadata = await this.loadPlanMetadata(planId);

      // Create execution state
      const state = new ExecutionState({
        planId,
        currentStage: session?.currentStage || metadata?.currentStage || 1,
        totalStages: metadata?.totalStages || 0,
        sessionId: session?.lastSessionId,
        completedStages: metadata?.completedStages || [],
        skippedStages: session?.skippedStages || [],
        ...stateData,
        pausedAt: new Date().toISOString(),
      });

      // Write state atomically
      const statePath = this.getStatePath(planId);
      const tmpPath = `${statePath}.tmp`;
      await fs.writeFile(tmpPath, JSON.stringify(state.toJSON(), null, 2), 'utf-8');
      await fs.rename(tmpPath, statePath);

      logger.debug(`Saved execution state for plan ${planId}`);

      return state;
    } catch (error) {
      logger.error(`Error saving execution state for plan ${planId}:`, {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Load execution state
   * @param {string} planId - Plan ID
   * @returns {Promise<ExecutionState|null>} Loaded state or null
   */
  async loadExecutionState(planId) {
    try {
      const statePath = this.getStatePath(planId);

      if (!fsSync.existsSync(statePath)) {
        logger.debug(`No execution state found for plan ${planId}`);
        return null;
      }

      const content = await fs.readFile(statePath, 'utf-8');
      const data = JSON.parse(content);
      const state = ExecutionState.fromJSON(data);

      logger.debug(`Loaded execution state for plan ${planId}`);

      return state;
    } catch (error) {
      logger.error(`Error loading execution state for plan ${planId}:`, {
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Check if a plan can be resumed
   * @param {string} planId - Plan ID
   * @returns {Promise<Object>} Check result
   */
  async canResume(planId) {
    try {
      // Check if session exists
      const session = SessionManager.read(planId);
      if (!session) {
        return {
          canResume: false,
          reason: 'Session not found',
        };
      }

      // Check session status
      if (session.status !== 'paused' && session.status !== 'failed') {
        return {
          canResume: false,
          reason: `Invalid session status: ${session.status} (expected: paused or failed)`,
        };
      }

      // Check if execution state exists
      const state = await this.loadExecutionState(planId);
      if (!state) {
        return {
          canResume: false,
          reason: 'Execution state not found',
        };
      }

      // Check if plan metadata exists
      const metadata = await this.loadPlanMetadata(planId);
      if (!metadata) {
        return {
          canResume: false,
          reason: 'Plan metadata not found',
        };
      }

      return {
        canResume: true,
        reason: null,
        state,
        metadata,
      };
    } catch (error) {
      logger.error(`Error checking if plan ${planId} can be resumed:`, {
        error: error.message,
      });
      return {
        canResume: false,
        reason: `Error: ${error.message}`,
      };
    }
  }

  /**
   * Load plan metadata
   * @param {string} planId - Plan ID
   * @returns {Promise<Object|null>} Metadata or null
   */
  async loadPlanMetadata(planId) {
    try {
      const metadataPath = this.getMetadataPath(planId);

      if (!fsSync.existsSync(metadataPath)) {
        return null;
      }

      const content = await fs.readFile(metadataPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      logger.warn(`Failed to load plan metadata for ${planId}:`, { error: error.message });
      return null;
    }
  }

  /**
   * Update plan metadata
   * @param {string} planId - Plan ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated metadata
   */
  async updatePlanMetadata(planId, updates) {
    try {
      const metadata = await this.loadPlanMetadata(planId);
      if (!metadata) {
        throw new Error(`Plan metadata not found: ${planId}`);
      }

      const updated = {
        ...metadata,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      const metadataPath = this.getMetadataPath(planId);

      // Atomic write
      const tmpPath = `${metadataPath}.tmp`;
      await fs.writeFile(tmpPath, JSON.stringify(updated, null, 2), 'utf-8');
      await fs.rename(tmpPath, metadataPath);

      return updated;
    } catch (error) {
      logger.error(`Error updating plan metadata for ${planId}:`, { error: error.message });
      throw error;
    }
  }

  /**
   * Clear execution state for a plan
   * @param {string} planId - Plan ID
   * @returns {Promise<void>}
   */
  async clearExecutionState(planId) {
    try {
      const statePath = this.getStatePath(planId);

      if (fsSync.existsSync(statePath)) {
        await fs.unlink(statePath);
        logger.debug(`Cleared execution state for plan ${planId}`);
      }
    } catch (error) {
      logger.error(`Error clearing execution state for plan ${planId}:`, {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get pause/resume history for a plan
   * @param {string} planId - Plan ID
   * @returns {Promise<Object>} History
   */
  async getHistory(planId) {
    try {
      const state = await this.loadExecutionState(planId);
      const metadata = await this.loadPlanMetadata(planId);
      const session = SessionManager.read(planId);

      return {
        planId,
        state,
        metadata: {
          status: metadata?.status,
          pausedAt: metadata?.pausedAt,
          resumedAt: metadata?.resumedAt,
          pauseReason: metadata?.pauseReason,
        },
        session: {
          status: session?.status,
          lastExecuted: session?.lastExecuted,
        },
      };
    } catch (error) {
      logger.error(`Error getting history for plan ${planId}:`, { error: error.message });
      throw error;
    }
  }
}

/**
 * Default PauseResumeManager instance (singleton)
 */
let defaultPauseResumeManager = null;

export function getPauseResumeManager(options = {}) {
  if (!defaultPauseResumeManager) {
    defaultPauseResumeManager = new PauseResumeManager(options);
  }
  return defaultPauseResumeManager;
}

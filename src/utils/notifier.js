/**
 * Cross-platform Notification Utility
 *
 * Send desktop notifications using node-notifier
 */

import notifier from 'node-notifier';
import path from 'path';
import { fileURLToPath } from 'url';
import { Config } from './config.js';
import { logger } from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class Notifier {
  constructor() {
    this.config = null;
    this.notificationsEnabled = true;
    this.soundEnabled = true;
  }

  /**
   * Initialize notifier with configuration
   */
  async init() {
    try {
      const configManager = new Config();
      const { config } = await configManager.loadOrDefault();
      this.config = config;

      this.notificationsEnabled = config.notifications?.enabled !== false;
      this.soundEnabled = config.notifications?.sound !== false;
    } catch (error) {
      // If config fails to load, use defaults
      logger.debug('Failed to load notification config, using defaults', error);
      this.notificationsEnabled = true;
      this.soundEnabled = true;
    }
  }

  /**
   * Send a notification
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {object} options - Additional options
   */
  async notify(title, message, options = {}) {
    // Initialize config if not already done
    if (this.config === null) {
      await this.init();
    }

    // Skip if notifications disabled
    if (!this.notificationsEnabled) {
      logger.debug('Notifications disabled, skipping');
      return;
    }

    try {
      await new Promise((resolve, reject) => {
        notifier.notify(
          {
            title: title || 'ccAutoRun',
            message: message || '',
            icon: options.icon || path.join(__dirname, '../../assets/icon.png'),
            sound: options.sound !== false && this.soundEnabled,
            wait: false,
            timeout: options.timeout || 10,
            ...options,
          },
          (error, response) => {
            if (error) {
              // Don't fail the main flow if notification fails
              logger.debug('Notification failed', error);
              reject(error);
            } else {
              resolve(response);
            }
          }
        );
      });
    } catch (error) {
      // Silently fail - notifications are not critical
      logger.debug('Failed to send notification', error);
    }
  }

  /**
   * Send progress notification
   * @param {string} taskName - Name of the task
   * @param {number} stage - Current stage number
   * @param {number} total - Total number of stages
   */
  async notifyProgress(taskName, stage, total) {
    const percentage = Math.round((stage / total) * 100);
    const progressBar = this._createProgressBar(stage, total);

    await this.notify(
      `Progress: ${taskName}`,
      `Stage ${stage}/${total} (${percentage}%)\n${progressBar}`,
      { icon: null }
    );
  }

  /**
   * Send error notification
   * @param {string} taskName - Name of the task
   * @param {string} error - Error message
   * @param {string} suggestion - Suggestion for fixing
   */
  async notifyError(taskName, error, suggestion = '') {
    const message = suggestion
      ? `${error}\n\nSuggestion: ${suggestion}`
      : error;

    await this.notify(
      `Error: ${taskName}`,
      message,
      { sound: true, timeout: 30 } // Longer timeout for errors
    );
  }

  /**
   * Send completion notification
   * @param {string} taskName - Name of the task
   * @param {object} stats - Task statistics
   */
  async notifyComplete(taskName, stats = {}) {
    const { stages, duration, success = true } = stats;

    let message = 'Task completed successfully!';
    if (stages) {
      message += `\n${stages} stages completed`;
    }
    if (duration) {
      message += `\nDuration: ${duration}`;
    }

    await this.notify(
      `Complete: ${taskName}`,
      message,
      { sound: success, timeout: 15 }
    );
  }

  /**
   * Send warning notification
   * @param {string} taskName - Name of the task
   * @param {string} message - Warning message
   */
  async notifyWarning(taskName, message) {
    await this.notify(
      `Warning: ${taskName}`,
      message,
      { timeout: 20 }
    );
  }

  /**
   * Send stage started notification
   * @param {string} taskName - Name of the task
   * @param {number} stage - Stage number
   * @param {string} stageName - Stage name/title
   */
  async notifyStageStart(taskName, stage, stageName = '') {
    const message = stageName
      ? `Starting Stage ${stage}: ${stageName}`
      : `Starting Stage ${stage}`;

    await this.notify(
      taskName,
      message,
      { timeout: 5 }
    );
  }

  /**
   * Send stage completed notification
   * @param {string} taskName - Name of the task
   * @param {number} stage - Stage number
   * @param {number} total - Total stages
   */
  async notifyStageComplete(taskName, stage, total) {
    const percentage = Math.round((stage / total) * 100);

    await this.notify(
      `${taskName}`,
      `Stage ${stage}/${total} completed (${percentage}%)`,
      { timeout: 8 }
    );
  }

  /**
   * Check if should notify based on progress frequency
   * @param {number} stage - Current stage
   * @returns {boolean}
   */
  shouldNotifyProgress(stage) {
    if (!this.config) {
      return true; // Default to notifying
    }

    const frequency = this.config.notifications?.progress_frequency || 'every-stage';

    if (frequency === 'off') {
      return false;
    }

    if (frequency === 'every-2-stages') {
      return stage % 2 === 0;
    }

    // 'every-stage' or default
    return true;
  }

  /**
   * Create a simple progress bar
   * @private
   */
  _createProgressBar(current, total, width = 10) {
    const percentage = current / total;
    const filled = Math.round(percentage * width);
    const empty = width - filled;

    return '█'.repeat(filled) + '░'.repeat(empty);
  }
}

// Singleton instance
let notifierInstance = null;

/**
 * Get shared notifier instance
 */
export function getNotifier() {
  if (!notifierInstance) {
    notifierInstance = new Notifier();
  }
  return notifierInstance;
}

/**
 * Convenience functions using singleton instance
 */
export async function notifyProgress(taskName, stage, total) {
  return getNotifier().notifyProgress(taskName, stage, total);
}

export async function notifyError(taskName, error, suggestion) {
  return getNotifier().notifyError(taskName, error, suggestion);
}

export async function notifyComplete(taskName, stats) {
  return getNotifier().notifyComplete(taskName, stats);
}

export async function notifyWarning(taskName, message) {
  return getNotifier().notifyWarning(taskName, message);
}

export async function notifyStageStart(taskName, stage, stageName) {
  return getNotifier().notifyStageStart(taskName, stage, stageName);
}

export async function notifyStageComplete(taskName, stage, total) {
  return getNotifier().notifyStageComplete(taskName, stage, total);
}

/**
 * Safety Limiter
 *
 * Implement safety_limit feature to prevent infinite loops
 */

import { readSession, incrementCount } from './session-manager.js';

/**
 * Check if should continue execution
 * @param {string} taskName - Task name
 * @param {number} limit - Safety limit (0 = no limit)
 * @returns {Object} { shouldContinue, count, limit, message }
 */
export function checkLimit(taskName, limit = 0) {
  // No limit if 0
  if (limit === 0) {
    return {
      shouldContinue: true,
      count: 0,
      limit: 0,
      message: 'No safety limit configured'
    };
  }

  // Read session count
  const session = readSession(taskName);
  const count = session ? session.count : 0;

  if (count >= limit) {
    return {
      shouldContinue: false,
      count,
      limit,
      message: `Safety limit reached (${count}/${limit}). Auto-continue stopped.`
    };
  }

  return {
    shouldContinue: true,
    count,
    limit,
    message: `Within safety limit (${count}/${limit})`
  };
}

/**
 * Increment and check limit
 * @param {string} taskName - Task name
 * @param {number} limit - Safety limit
 * @returns {Object} { shouldContinue, count, limit, message }
 */
export function incrementAndCheck(taskName, limit = 0) {
  // Increment count first
  incrementCount(taskName);

  // Then check limit
  return checkLimit(taskName, limit);
}

/**
 * Get warning threshold (80% of limit)
 * @param {string} taskName - Task name
 * @param {number} limit - Safety limit
 * @returns {Object} { isWarning, count, limit, threshold, message }
 */
export function getWarningStatus(taskName, limit = 0) {
  if (limit === 0) {
    return {
      isWarning: false,
      count: 0,
      limit: 0,
      threshold: 0,
      message: 'No safety limit configured'
    };
  }

  const session = readSession(taskName);
  const count = session ? session.count : 0;
  const threshold = Math.floor(limit * 0.8);

  if (count >= threshold && count < limit) {
    return {
      isWarning: true,
      count,
      limit,
      threshold,
      message: `Warning: Approaching safety limit (${count}/${limit}). ${limit - count} iterations remaining.`
    };
  }

  return {
    isWarning: false,
    count,
    limit,
    threshold,
    message: `Within safe range (${count}/${limit})`
  };
}

export class SafetyLimiter {
  constructor(taskName, limit = 0) {
    this.taskName = taskName;
    this.limit = limit;
  }

  /**
   * Check if should continue
   */
  shouldContinue() {
    const result = checkLimit(this.taskName, this.limit);
    return result.shouldContinue;
  }

  /**
   * Increment and check
   */
  incrementAndCheck() {
    return incrementAndCheck(this.taskName, this.limit);
  }

  /**
   * Get warning status
   */
  getWarningStatus() {
    return getWarningStatus(this.taskName, this.limit);
  }

  /**
   * Get current count
   */
  getCurrentCount() {
    const session = readSession(this.taskName);
    return session ? session.count : 0;
  }
}

/**
 * Session Manager
 *
 * Manage execution sessions and state
 * Simple CRUD operations with atomic writes
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Get sessions directory path
 */
function getSessionsDir() {
  const ccDir = path.join(os.homedir(), '.ccautorun');
  const sessionsDir = path.join(ccDir, 'sessions');

  // Ensure directory exists
  if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(sessionsDir, { recursive: true });
  }

  return sessionsDir;
}

/**
 * Get session file path
 */
function getSessionPath(taskName) {
  return path.join(getSessionsDir(), `${taskName}.json`);
}

/**
 * Create new session
 * @param {string} taskName - Task name
 * @param {Object} data - Session data
 */
export function createSession(taskName, data = {}) {
  const sessionPath = getSessionPath(taskName);

  const session = {
    taskName,
    count: 0,
    status: 'active',
    currentStage: 1,
    lastExecuted: new Date().toISOString(),
    lastSessionId: null,
    lastError: null,
    ...data
  };

  // Atomic write
  const tmpPath = `${sessionPath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(session, null, 2), 'utf-8');
  fs.renameSync(tmpPath, sessionPath);

  return session;
}

/**
 * Read session
 * @param {string} taskName - Task name
 * @returns {Object|null} Session data or null if not found
 */
export function readSession(taskName) {
  const sessionPath = getSessionPath(taskName);

  if (!fs.existsSync(sessionPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(sessionPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Failed to read session ${taskName}:`, error.message);
    return null;
  }
}

/**
 * Update session
 * @param {string} taskName - Task name
 * @param {Object} updates - Fields to update
 */
export function updateSession(taskName, updates) {
  const session = readSession(taskName);

  if (!session) {
    throw new Error(`Session not found: ${taskName}`);
  }

  const updated = {
    ...session,
    ...updates,
    lastExecuted: new Date().toISOString()
  };

  const sessionPath = getSessionPath(taskName);

  // Atomic write
  const tmpPath = `${sessionPath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(updated, null, 2), 'utf-8');
  fs.renameSync(tmpPath, sessionPath);

  return updated;
}

/**
 * Delete session
 * @param {string} taskName - Task name
 */
export function deleteSession(taskName) {
  const sessionPath = getSessionPath(taskName);

  if (fs.existsSync(sessionPath)) {
    fs.unlinkSync(sessionPath);
  }
}

/**
 * List all sessions
 * @returns {Array} Array of session data
 */
export function listSessions() {
  const sessionsDir = getSessionsDir();
  const files = fs.readdirSync(sessionsDir);

  const sessions = [];
  for (const file of files) {
    if (file.endsWith('.json') && !file.endsWith('.tmp')) {
      const taskName = path.basename(file, '.json');
      const session = readSession(taskName);
      if (session) {
        sessions.push(session);
      }
    }
  }

  return sessions;
}

/**
 * Increment session count
 * @param {string} taskName - Task name
 */
export function incrementCount(taskName) {
  const session = readSession(taskName);

  if (!session) {
    throw new Error(`Session not found: ${taskName}`);
  }

  return updateSession(taskName, { count: session.count + 1 });
}

/**
 * Set session status
 * @param {string} taskName - Task name
 * @param {string} status - Status: active|paused|failed|completed
 * @param {string|null} error - Error message (for failed status)
 */
export function setStatus(taskName, status, error = null) {
  const updates = { status };

  if (status === 'failed' && error) {
    updates.lastError = error;
  }

  return updateSession(taskName, updates);
}

export class SessionManager {
  static create(taskName, data) {
    return createSession(taskName, data);
  }

  static read(taskName) {
    return readSession(taskName);
  }

  static update(taskName, updates) {
    return updateSession(taskName, updates);
  }

  static delete(taskName) {
    return deleteSession(taskName);
  }

  static list() {
    return listSessions();
  }

  static incrementCount(taskName) {
    return incrementCount(taskName);
  }

  static setStatus(taskName, status, error = null) {
    return setStatus(taskName, status, error);
  }
}

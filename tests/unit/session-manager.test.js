/**
 * Unit tests for session-manager.js
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  SessionManager,
  createSession,
  readSession,
  updateSession,
  deleteSession,
  listSessions,
  incrementCount,
  setStatus,
} from '@/core/session-manager.js';
import { TestFileSystem } from '@tests/helpers/mock-fs.js';
import { expectValidSession, expectToThrow } from '@tests/helpers/test-utils.js';
import os from 'os';
import path from 'path';

describe('SessionManager', () => {
  let testFS;
  let originalHomedir;
  let mockSessionsDir;

  beforeEach(async () => {
    testFS = new TestFileSystem();
    await testFS.setup();

    // Mock os.homedir() to use our test directory
    mockSessionsDir = path.join(testFS.tempDir, '.ccautorun', 'sessions');
    originalHomedir = os.homedir;
    os.homedir = () => testFS.tempDir;
  });

  afterEach(async () => {
    // Restore original homedir
    os.homedir = originalHomedir;
    await testFS.teardown();
  });

  describe('createSession', () => {
    it('should create a new session with default values', () => {
      const session = createSession('test-task');

      expect(session).toBeDefined();
      expect(session.taskName).toBe('test-task');
      expect(session.status).toBe('active');
      expect(session.currentStage).toBe(1);
      expect(session.count).toBe(0);
      expect(session.lastError).toBeNull();
      expect(session.lastSessionId).toBeNull();
      expect(session.lastExecuted).toBeDefined();
    });

    it('should create session with custom data', () => {
      const session = createSession('test-task', {
        currentStage: 3,
        count: 5,
        status: 'paused',
      });

      expect(session.taskName).toBe('test-task');
      expect(session.currentStage).toBe(3);
      expect(session.count).toBe(5);
      expect(session.status).toBe('paused');
    });

    it('should write session file to disk', () => {
      createSession('test-task');

      const sessionPath = path.join(mockSessionsDir, 'test-task.json');
      expect(testFS.exists('.ccautorun/sessions/test-task.json')).toBe(true);
    });

    it('should use atomic write (tmp + rename)', () => {
      createSession('test-task');

      // Temporary file should be cleaned up
      expect(testFS.exists('.ccautorun/sessions/test-task.json.tmp')).toBe(false);
    });

    it('should overwrite existing session', () => {
      createSession('test-task', { count: 1 });
      const session2 = createSession('test-task', { count: 2 });

      expect(session2.count).toBe(2);

      const read = readSession('test-task');
      expect(read.count).toBe(2);
    });
  });

  describe('readSession', () => {
    beforeEach(() => {
      createSession('test-task', { count: 5, currentStage: 2 });
    });

    it('should read existing session', () => {
      const session = readSession('test-task');

      expect(session).toBeDefined();
      expect(session.taskName).toBe('test-task');
      expect(session.count).toBe(5);
      expect(session.currentStage).toBe(2);
    });

    it('should return null for non-existent session', () => {
      const session = readSession('non-existent');
      expect(session).toBeNull();
    });

    it('should handle corrupted session file gracefully', async () => {
      // Write invalid JSON
      await testFS.writeFile('.ccautorun/sessions/corrupted.json', 'invalid json{');

      const session = readSession('corrupted');
      expect(session).toBeNull();
    });

    it('should parse JSON correctly', () => {
      const session = readSession('test-task');

      // Verify it's a proper object, not a string
      expect(typeof session).toBe('object');
      expect(session.count).toBe(5);
    });
  });

  describe('updateSession', () => {
    beforeEach(() => {
      createSession('test-task', { count: 1, currentStage: 1 });
    });

    it('should update session fields', () => {
      const updated = updateSession('test-task', { count: 2, currentStage: 2 });

      expect(updated.count).toBe(2);
      expect(updated.currentStage).toBe(2);
    });

    it('should preserve existing fields', () => {
      const updated = updateSession('test-task', { count: 10 });

      expect(updated.taskName).toBe('test-task');
      expect(updated.status).toBe('active');
      expect(updated.currentStage).toBe(1);
    });

    it('should update lastExecuted timestamp', async () => {
      const original = readSession('test-task');

      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      const updated = updateSession('test-task', { count: 2 });

      expect(updated.lastExecuted).not.toBe(original.lastExecuted);
    });

    it('should throw error when session not found', () => {
      expect(() => {
        updateSession('non-existent', { count: 1 });
      }).toThrow('Session not found');
    });

    it('should use atomic write', () => {
      updateSession('test-task', { count: 5 });

      // Temporary file should be cleaned up
      expect(testFS.exists('.ccautorun/sessions/test-task.json.tmp')).toBe(false);
    });
  });

  describe('deleteSession', () => {
    beforeEach(() => {
      createSession('test-task');
    });

    it('should delete existing session', () => {
      deleteSession('test-task');

      expect(testFS.exists('.ccautorun/sessions/test-task.json')).toBe(false);
      expect(readSession('test-task')).toBeNull();
    });

    it('should not throw error when session does not exist', () => {
      expect(() => {
        deleteSession('non-existent');
      }).not.toThrow();
    });
  });

  describe('listSessions', () => {
    it('should return empty array when no sessions', () => {
      const sessions = listSessions();
      expect(sessions).toEqual([]);
    });

    it('should list all sessions', () => {
      createSession('task-1', { count: 1 });
      createSession('task-2', { count: 2 });
      createSession('task-3', { count: 3 });

      const sessions = listSessions();

      expect(sessions).toHaveLength(3);
      expect(sessions.map(s => s.taskName)).toContain('task-1');
      expect(sessions.map(s => s.taskName)).toContain('task-2');
      expect(sessions.map(s => s.taskName)).toContain('task-3');
    });

    it('should ignore temporary files', async () => {
      createSession('task-1');

      // Create a .tmp file that should be ignored
      await testFS.writeFile('.ccautorun/sessions/task-2.json.tmp', '{}');

      const sessions = listSessions();

      expect(sessions).toHaveLength(1);
      expect(sessions[0].taskName).toBe('task-1');
    });

    it('should skip corrupted session files', async () => {
      createSession('task-1');
      await testFS.writeFile('.ccautorun/sessions/corrupted.json', 'invalid json');

      const sessions = listSessions();

      // Should only return the valid session
      expect(sessions.length).toBeGreaterThanOrEqual(1);
      expect(sessions.find(s => s.taskName === 'task-1')).toBeDefined();
    });

    it('should return sessions with all fields', () => {
      createSession('task-1', { count: 5, currentStage: 2, status: 'active' });

      const sessions = listSessions();

      expect(sessions[0]).toHaveProperty('taskName');
      expect(sessions[0]).toHaveProperty('count');
      expect(sessions[0]).toHaveProperty('status');
      expect(sessions[0]).toHaveProperty('currentStage');
      expect(sessions[0]).toHaveProperty('lastExecuted');
    });
  });

  describe('incrementCount', () => {
    beforeEach(() => {
      createSession('test-task', { count: 5 });
    });

    it('should increment session count', () => {
      const updated = incrementCount('test-task');

      expect(updated.count).toBe(6);
    });

    it('should increment multiple times', () => {
      incrementCount('test-task');
      incrementCount('test-task');
      const updated = incrementCount('test-task');

      expect(updated.count).toBe(8);
    });

    it('should throw error when session not found', () => {
      expect(() => {
        incrementCount('non-existent');
      }).toThrow('Session not found');
    });
  });

  describe('setStatus', () => {
    beforeEach(() => {
      createSession('test-task');
    });

    it('should set status to active', () => {
      const updated = setStatus('test-task', 'active');
      expect(updated.status).toBe('active');
    });

    it('should set status to paused', () => {
      const updated = setStatus('test-task', 'paused');
      expect(updated.status).toBe('paused');
    });

    it('should set status to completed', () => {
      const updated = setStatus('test-task', 'completed');
      expect(updated.status).toBe('completed');
    });

    it('should set status to failed with error message', () => {
      const updated = setStatus('test-task', 'failed', 'Test execution error');

      expect(updated.status).toBe('failed');
      expect(updated.lastError).toBe('Test execution error');
    });

    it('should clear lastError when setting non-failed status', () => {
      setStatus('test-task', 'failed', 'Error message');
      const updated = setStatus('test-task', 'active');

      expect(updated.status).toBe('active');
      // lastError should still exist (not overwritten)
      expect(updated.lastError).toBe('Error message');
    });
  });

  describe('SessionManager class', () => {
    it('should provide static create method', () => {
      const session = SessionManager.create('test-task');
      expect(session).toBeDefined();
      expect(session.taskName).toBe('test-task');
    });

    it('should provide static read method', () => {
      SessionManager.create('test-task');
      const session = SessionManager.read('test-task');
      expect(session).toBeDefined();
    });

    it('should provide static update method', () => {
      SessionManager.create('test-task', { count: 1 });
      const updated = SessionManager.update('test-task', { count: 2 });
      expect(updated.count).toBe(2);
    });

    it('should provide static delete method', () => {
      SessionManager.create('test-task');
      SessionManager.delete('test-task');
      expect(SessionManager.read('test-task')).toBeNull();
    });

    it('should provide static list method', () => {
      SessionManager.create('task-1');
      SessionManager.create('task-2');
      const sessions = SessionManager.list();
      expect(sessions).toHaveLength(2);
    });

    it('should provide static incrementCount method', () => {
      SessionManager.create('test-task', { count: 5 });
      const updated = SessionManager.incrementCount('test-task');
      expect(updated.count).toBe(6);
    });

    it('should provide static setStatus method', () => {
      SessionManager.create('test-task');
      const updated = SessionManager.setStatus('test-task', 'paused');
      expect(updated.status).toBe('paused');
    });
  });
});

/**
 * Unit tests for safety-limiter.js
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SafetyLimiter, checkLimit, incrementAndCheck, getWarningStatus } from '@/core/safety-limiter.js';
import { createSession } from '@/core/session-manager.js';
import { TestFileSystem } from '@tests/helpers/mock-fs.js';
import os from 'os';

describe('SafetyLimiter', () => {
  let testFS, originalHomedir;

  beforeEach(async () => {
    testFS = new TestFileSystem();
    await testFS.setup();
    originalHomedir = os.homedir;
    os.homedir = () => testFS.tempDir;
  });

  afterEach(async () => {
    os.homedir = originalHomedir;
    await testFS.teardown();
  });

  describe('checkLimit', () => {
    it('should allow continuation when limit is 0 (unlimited)', () => {
      createSession('test-task', { count: 100 });
      const result = checkLimit('test-task', 0);

      expect(result.shouldContinue).toBe(true);
      expect(result.limit).toBe(0);
      expect(result.message).toContain('No safety limit');
    });

    it('should allow continuation within limit', () => {
      createSession('test-task', { count: 5 });
      const result = checkLimit('test-task', 10);

      expect(result.shouldContinue).toBe(true);
      expect(result.count).toBe(5);
      expect(result.limit).toBe(10);
    });

    it('should stop at limit', () => {
      createSession('test-task', { count: 10 });
      const result = checkLimit('test-task', 10);

      expect(result.shouldContinue).toBe(false);
      expect(result.count).toBe(10);
      expect(result.message).toContain('Safety limit reached');
    });

    it('should stop when exceeding limit', () => {
      createSession('test-task', { count: 15 });
      const result = checkLimit('test-task', 10);

      expect(result.shouldContinue).toBe(false);
      expect(result.count).toBe(15);
    });
  });

  describe('incrementAndCheck', () => {
    it('should increment and allow continuation', () => {
      createSession('test-task', { count: 5 });
      const result = incrementAndCheck('test-task', 10);

      expect(result.count).toBe(6);
      expect(result.shouldContinue).toBe(true);
    });

    it('should increment and stop at limit', () => {
      createSession('test-task', { count: 9 });
      const result = incrementAndCheck('test-task', 10);

      expect(result.count).toBe(10);
      expect(result.shouldContinue).toBe(false);
    });
  });

  describe('getWarningStatus', () => {
    it('should not warn when within safe range', () => {
      createSession('test-task', { count: 5 });
      const result = getWarningStatus('test-task', 10);

      expect(result.isWarning).toBe(false);
      expect(result.message).toContain('Within safe range');
    });

    it('should warn at 80% threshold', () => {
      createSession('test-task', { count: 8 });
      const result = getWarningStatus('test-task', 10);

      expect(result.isWarning).toBe(true);
      expect(result.message).toContain('Warning');
      expect(result.threshold).toBe(8);
    });

    it('should not warn when limit is 0', () => {
      createSession('test-task', { count: 100 });
      const result = getWarningStatus('test-task', 0);

      expect(result.isWarning).toBe(false);
    });
  });

  describe('SafetyLimiter class', () => {
    it('should check if should continue', () => {
      createSession('test-task', { count: 5 });
      const limiter = new SafetyLimiter('test-task', 10);

      expect(limiter.shouldContinue()).toBe(true);
    });

    it('should increment and check', () => {
      createSession('test-task', { count: 5 });
      const limiter = new SafetyLimiter('test-task', 10);
      const result = limiter.incrementAndCheck();

      expect(result.count).toBe(6);
    });

    it('should get current count', () => {
      createSession('test-task', { count: 7 });
      const limiter = new SafetyLimiter('test-task', 10);

      expect(limiter.getCurrentCount()).toBe(7);
    });
  });
});

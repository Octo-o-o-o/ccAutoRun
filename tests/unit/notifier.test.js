/**
 * Unit tests for notifier.js
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Notifier } from '@/utils/notifier.js';

// Mock node-notifier
vi.mock('node-notifier', () => ({
  default: {
    notify: vi.fn((options, callback) => {
      if (callback) callback(null, 'success');
    }),
  },
}));

describe('Notifier', () => {
  let notifier;

  beforeEach(() => {
    notifier = new Notifier();
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should create notifier instance', () => {
      expect(notifier).toBeDefined();
      expect(notifier.notificationsEnabled).toBe(true);
      expect(notifier.soundEnabled).toBe(true);
    });

    it('should have null config initially', () => {
      expect(notifier.config).toBeNull();
    });
  });

  describe('notify', () => {
    it('should not throw error when calling notify', async () => {
      let error = null;
      try {
        await notifier.notify('Test', 'Message');
      } catch (e) {
        error = e;
      }
      // Verify no error thrown
      expect(error).toBeNull();
    });

    it('should handle title and message parameters', async () => {
      let error = null;
      try {
        await notifier.notify('Test Title', 'Test Message');
      } catch (e) {
        error = e;
      }
      expect(error).toBeNull();
    });

    it('should accept options parameter', async () => {
      let error = null;
      try {
        await notifier.notify('Test', 'Message', { icon: 'icon.png' });
      } catch (e) {
        error = e;
      }
      expect(error).toBeNull();
    });

    it('should handle empty title', async () => {
      let error = null;
      try {
        await notifier.notify('', 'Message');
      } catch (e) {
        error = e;
      }
      expect(error).toBeNull();
    });

    it('should handle empty message', async () => {
      let error = null;
      try {
        await notifier.notify('Title', '');
      } catch (e) {
        error = e;
      }
      expect(error).toBeNull();
    });
  });
});

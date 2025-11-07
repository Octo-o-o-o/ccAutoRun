/**
 * Unit tests for plan-parser.js
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  PlanParser,
  parsePlan,
  detectArchitecture,
  updateConfigHeader,
  getNextStageFile,
  updateProgress,
  extractTaskName,
} from '@/core/plan-parser.js';
import { TestFileSystem } from '@tests/helpers/mock-fs.js';
import {
  SPLIT_ARCHITECTURE_README,
  SPLIT_ARCHITECTURE_STAGE_1,
  SPLIT_ARCHITECTURE_STAGE_2,
  SPLIT_ARCHITECTURE_STAGE_3,
  SINGLE_ARCHITECTURE_PLAN,
  PLAN_WITHOUT_CONFIG,
  PLAN_WITH_INVALID_CONFIG,
  createSplitArchitectureFiles,
  createSingleArchitectureFiles,
} from '@tests/helpers/fixtures.js';
import { expectToThrow, expectValidConfig } from '@tests/helpers/test-utils.js';
import { join } from 'path';

describe('PlanParser', () => {
  let testFS;

  beforeEach(async () => {
    testFS = new TestFileSystem();
    await testFS.setup();
  });

  afterEach(async () => {
    await testFS.teardown();
  });

  describe('parseMetadata', () => {
    it('should parse valid configuration header', () => {
      const config = PlanParser.parseMetadata(SPLIT_ARCHITECTURE_README);

      expect(config).toBeDefined();
      expect(config.stages).toBe(3);
      expect(config.current).toBe(1);
      expect(config.auto_continue).toBe(true);
      expect(config.safety_limit).toBe(10);
      expect(config.task_type).toBe('feature');
      expect(config.estimated_time).toBe('4-6h');
      expect(config.architecture).toBe('split');
    });

    it('should return null for missing configuration header', () => {
      const config = PlanParser.parseMetadata(PLAN_WITHOUT_CONFIG);
      expect(config).toBeNull();
    });

    it('should parse boolean values correctly', () => {
      const content = `<!-- AUTO-RUN-CONFIG
auto_continue: true
enabled: false
-->`;
      const config = PlanParser.parseMetadata(content);

      expect(config.auto_continue).toBe(true);
      expect(config.enabled).toBe(false);
    });

    it('should parse numeric values correctly', () => {
      const content = `<!-- AUTO-RUN-CONFIG
stages: 5
current: 2
safety_limit: 0
-->`;
      const config = PlanParser.parseMetadata(content);

      expect(config.stages).toBe(5);
      expect(config.current).toBe(2);
      expect(config.safety_limit).toBe(0);
    });

    it('should skip comment lines in config', () => {
      const content = `<!-- AUTO-RUN-CONFIG
# This is a comment
stages: 3
# Another comment
current: 1
-->`;
      const config = PlanParser.parseMetadata(content);

      expect(config.stages).toBe(3);
      expect(config.current).toBe(1);
    });

    it('should handle multiline config with various formatting', () => {
      const content = `<!-- AUTO-RUN-CONFIG
stages:    5
  current: 2
auto_continue:true
-->`;
      const config = PlanParser.parseMetadata(content);

      expect(config.stages).toBe(5);
      expect(config.current).toBe(2);
      expect(config.auto_continue).toBe(true);
    });
  });

  describe('updateConfigHeader', () => {
    it('should update single field in config header', () => {
      const updated = updateConfigHeader(SPLIT_ARCHITECTURE_README, { current: 2 });

      expect(updated).toContain('current: 2');
      expect(updated).toContain('stages: 3');
      expect(updated).toContain('auto_continue: true');
    });

    it('should update multiple fields in config header', () => {
      const updated = updateConfigHeader(SPLIT_ARCHITECTURE_README, {
        current: 3,
        safety_limit: 20,
      });

      expect(updated).toContain('current: 3');
      expect(updated).toContain('safety_limit: 20');
    });

    it('should preserve indentation when updating', () => {
      const content = `<!-- AUTO-RUN-CONFIG
  stages: 5
  current: 1
-->`;
      const updated = updateConfigHeader(content, { current: 2 });

      expect(updated).toContain('  current: 2');
      expect(updated).toContain('  stages: 5');
    });

    it('should throw error when config header not found', () => {
      expect(() => {
        updateConfigHeader(PLAN_WITHOUT_CONFIG, { current: 2 });
      }).toThrow('Configuration header not found');
    });

    it('should preserve comment lines when updating', () => {
      const content = `<!-- AUTO-RUN-CONFIG
# Comment line
stages: 3
current: 1
-->`;
      const updated = updateConfigHeader(content, { current: 2 });

      expect(updated).toContain('# Comment line');
      expect(updated).toContain('current: 2');
    });
  });

  describe('detectArchitecture', () => {
    it('should detect split architecture with README.md', async () => {
      const planDir = join(testFS.tempDir, 'test-plan');
      await testFS.writeFile('test-plan/README.md', SPLIT_ARCHITECTURE_README);

      const archType = detectArchitecture(planDir);
      expect(archType).toBe('split');
    });

    it('should detect split architecture with EXECUTION_PLAN.md', async () => {
      const planDir = join(testFS.tempDir, 'test-plan');
      await testFS.writeFile('test-plan/EXECUTION_PLAN.md', SPLIT_ARCHITECTURE_README);

      const archType = detectArchitecture(planDir);
      expect(archType).toBe('split');
    });

    it('should detect single file architecture', async () => {
      await testFS.writeFile('simple-task.md', SINGLE_ARCHITECTURE_PLAN);

      const planFile = join(testFS.tempDir, 'simple-task.md');
      const archType = detectArchitecture(planFile);
      expect(archType).toBe('single');
    });

    it('should return null for non-existent path', () => {
      const archType = detectArchitecture('/non/existent/path');
      expect(archType).toBeNull();
    });

    it('should return null for directory without plan files', async () => {
      const emptyDir = join(testFS.tempDir, 'empty');
      await testFS.writeFile('empty/other-file.txt', 'content');

      const archType = detectArchitecture(emptyDir);
      expect(archType).toBeNull();
    });

    it('should return null for non-markdown file', async () => {
      await testFS.writeFile('file.txt', 'content');

      const filePath = join(testFS.tempDir, 'file.txt');
      const archType = detectArchitecture(filePath);
      expect(archType).toBeNull();
    });
  });

  describe('parsePlan - split architecture', () => {
    beforeEach(async () => {
      // Create split architecture structure
      await testFS.writeFile('test-plan/README.md', SPLIT_ARCHITECTURE_README);
      await testFS.writeFile('test-plan/stages/01-database-design.md', SPLIT_ARCHITECTURE_STAGE_1);
      await testFS.writeFile('test-plan/stages/02-api-implementation.md', SPLIT_ARCHITECTURE_STAGE_2);
      await testFS.writeFile('test-plan/stages/03-frontend-integration.md', SPLIT_ARCHITECTURE_STAGE_3);
    });

    it('should parse split architecture plan successfully', () => {
      const planDir = join(testFS.tempDir, 'test-plan');
      const planData = parsePlan(planDir);

      expect(planData.type).toBe('split');
      expectValidConfig(planData.config);
      expect(planData.config.stages).toBe(3);
      expect(planData.config.current).toBe(1);
    });

    it('should identify current stage file correctly', () => {
      const planDir = join(testFS.tempDir, 'test-plan');
      const planData = parsePlan(planDir);

      expect(planData.currentStageFile).toContain('01-database-design.md');
    });

    it('should list all stage files in order', () => {
      const planDir = join(testFS.tempDir, 'test-plan');
      const planData = parsePlan(planDir);

      expect(planData.allStageFiles).toHaveLength(3);
      expect(planData.allStageFiles[0]).toContain('01-database-design.md');
      expect(planData.allStageFiles[1]).toContain('02-api-implementation.md');
      expect(planData.allStageFiles[2]).toContain('03-frontend-integration.md');
    });

    it('should calculate progress correctly', () => {
      const planDir = join(testFS.tempDir, 'test-plan');
      const planData = parsePlan(planDir);

      expect(planData.progress.completed).toBe(0);
      expect(planData.progress.total).toBe(3);
      expect(planData.progress.percentage).toBe(0);
      expect(planData.progress.current).toBe(1);
    });

    it('should throw error when stages directory missing', async () => {
      await testFS.writeFile('bad-plan/README.md', SPLIT_ARCHITECTURE_README);

      const planDir = join(testFS.tempDir, 'bad-plan');
      await expectToThrow(() => parsePlan(planDir), 'Stages directory not found');
    });

    it('should throw error when current stage file not found', async () => {
      const content = SPLIT_ARCHITECTURE_README.replace('current: 1', 'current: 10');
      await testFS.writeFile('bad-plan2/README.md', content);
      await testFS.writeFile('bad-plan2/stages/01-test.md', SPLIT_ARCHITECTURE_STAGE_1);

      const planDir = join(testFS.tempDir, 'bad-plan2');
      await expectToThrow(() => parsePlan(planDir), 'Current stage file not found');
    });
  });

  describe('parsePlan - single architecture', () => {
    beforeEach(async () => {
      await testFS.writeFile('simple-task.md', SINGLE_ARCHITECTURE_PLAN);
    });

    it('should parse single file architecture successfully', () => {
      const planFile = join(testFS.tempDir, 'simple-task.md');
      const planData = parsePlan(planFile);

      expect(planData.type).toBe('single');
      expectValidConfig(planData.config);
      expect(planData.config.stages).toBe(2);
      expect(planData.config.current).toBe(1);
    });

    it('should set current stage file to plan file', () => {
      const planFile = join(testFS.tempDir, 'simple-task.md');
      const planData = parsePlan(planFile);

      expect(planData.currentStageFile).toBe(planFile);
    });

    it('should have null allStageFiles for single architecture', () => {
      const planFile = join(testFS.tempDir, 'simple-task.md');
      const planData = parsePlan(planFile);

      expect(planData.allStageFiles).toBeNull();
      expect(planData.readmePath).toBeNull();
    });

    it('should calculate progress correctly', () => {
      const planFile = join(testFS.tempDir, 'simple-task.md');
      const planData = parsePlan(planFile);

      expect(planData.progress.completed).toBe(0);
      expect(planData.progress.total).toBe(2);
      expect(planData.progress.percentage).toBe(0);
      expect(planData.progress.current).toBe(1);
    });

    it('should throw error when config header missing', async () => {
      await testFS.writeFile('no-config.md', PLAN_WITHOUT_CONFIG);

      const planFile = join(testFS.tempDir, 'no-config.md');
      await expectToThrow(() => parsePlan(planFile), 'Configuration header not found');
    });
  });

  describe('getNextStageFile', () => {
    beforeEach(async () => {
      await testFS.writeFile('test-plan/README.md', SPLIT_ARCHITECTURE_README);
      await testFS.writeFile('test-plan/stages/01-database-design.md', SPLIT_ARCHITECTURE_STAGE_1);
      await testFS.writeFile('test-plan/stages/02-api-implementation.md', SPLIT_ARCHITECTURE_STAGE_2);
      await testFS.writeFile('test-plan/stages/03-frontend-integration.md', SPLIT_ARCHITECTURE_STAGE_3);
    });

    it('should return next stage file for split architecture', () => {
      const planDir = join(testFS.tempDir, 'test-plan');
      const planData = parsePlan(planDir);

      const nextStage = getNextStageFile(planData);
      expect(nextStage).toContain('02-api-implementation.md');
    });

    it('should return null when all stages completed', () => {
      const planDir = join(testFS.tempDir, 'test-plan');
      let planData = parsePlan(planDir);

      // Simulate stage 3 (last stage)
      planData.config.current = 3;

      const nextStage = getNextStageFile(planData);
      expect(nextStage).toBeNull();
    });

    it('should return same file for single architecture', async () => {
      await testFS.writeFile('simple.md', SINGLE_ARCHITECTURE_PLAN);

      const planFile = join(testFS.tempDir, 'simple.md');
      const planData = parsePlan(planFile);

      const nextStage = getNextStageFile(planData);
      expect(nextStage).toBe(planFile);
    });
  });

  describe('updateProgress', () => {
    beforeEach(async () => {
      await testFS.writeFile('test-plan/README.md', SPLIT_ARCHITECTURE_README);
      await testFS.writeFile('test-plan/stages/01-test.md', SPLIT_ARCHITECTURE_STAGE_1);
    });

    it('should update progress in split architecture', async () => {
      const planDir = join(testFS.tempDir, 'test-plan');

      updateProgress(planDir, 2);

      const updatedContent = await testFS.readFile('test-plan/README.md');
      expect(updatedContent).toContain('current: 2');
    });

    it('should update progress in single architecture', async () => {
      await testFS.writeFile('simple.md', SINGLE_ARCHITECTURE_PLAN);

      const planFile = join(testFS.tempDir, 'simple.md');

      updateProgress(planFile, 2);

      const updatedContent = await testFS.readFile('simple.md');
      expect(updatedContent).toContain('current: 2');
    });

    it('should use atomic write (tmp + rename)', async () => {
      await testFS.writeFile('simple.md', SINGLE_ARCHITECTURE_PLAN);

      const planFile = join(testFS.tempDir, 'simple.md');

      updateProgress(planFile, 2);

      // Temporary file should be cleaned up
      expect(testFS.exists('simple.md.tmp')).toBe(false);
    });
  });

  describe('extractTaskName', () => {
    it('should extract task name from split architecture path', () => {
      const taskName = extractTaskName('/path/to/myproject/stages/02-api.md');
      expect(taskName).toBe('myproject');
    });

    it('should extract task name from single file path', () => {
      const taskName = extractTaskName('/path/to/simple-task.md');
      expect(taskName).toBe('simple-task');
    });

    it('should handle Windows paths', () => {
      const taskName = extractTaskName('C:\\projects\\myproject\\stages\\02-api.md');
      expect(taskName).toBe('myproject');
    });

    it('should handle relative paths', () => {
      const taskName = extractTaskName('stages/03-testing.md');
      expect(taskName).toBe('03-testing');
    });
  });

  describe('error handling', () => {
    it('should throw error for invalid plan path', () => {
      expect(() => {
        parsePlan('/non/existent/path');
      }).toThrow('Invalid plan path');
    });

    it('should throw error when README not found', async () => {
      const planDir = join(testFS.tempDir, 'empty-plan');
      await testFS.writeFile('empty-plan/some-file.txt', 'content');

      await expectToThrow(() => parsePlan(planDir), 'Invalid plan path');
    });
  });
});

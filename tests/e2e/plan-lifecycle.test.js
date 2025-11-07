/**
 * E2E 测试：计划完整生命周期
 * 场景1: 从零开始创建计划并执行
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { E2ETestEnv } from '../helpers/e2e-test.js';
import { waitFor } from '../helpers/test-utils.js';

describe('[E2E] Plan Lifecycle', () => {
  let env;

  beforeEach(async () => {
    env = new E2ETestEnv();
    await env.setup();
  });

  afterEach(async () => {
    await env.teardown();
  });

  test('should initialize ccautorun in a new project', async () => {
    const cli = env.getCLI();
    const fs = env.getFS();

    // 执行 init 命令（非交互模式）
    const result = await cli.init({ nonInteractive: true });

    // 验证命令成功
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('initialized successfully');

    // 验证目录结构创建
    expect(fs.exists('.ccautorun')).toBe(true);
    expect(fs.exists('.ccautorun/plans')).toBe(true);
    expect(fs.exists('.ccautorun/sessions')).toBe(true);
    expect(fs.exists('.ccautorun/config.yaml')).toBe(true);

    // 验证 Claude Code hooks 创建
    expect(fs.exists('.claude/hooks')).toBe(true);
    expect(fs.exists('.claude/commands')).toBe(true);
  });

  test('should show empty list initially', async () => {
    const cli = env.getCLI();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 列出计划
    const result = await cli.list();

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('No plans found');
  });

  test('should create and list a new plan', async () => {
    const cli = env.getCLI();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 创建测试计划
    await env.createTestPlan('20250107-143022', {
      name: 'Test Feature Implementation',
      status: 'planning',
    });

    // 列出计划
    const result = await cli.list();

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('20250107-143022');
    expect(result.stdout).toContain('Test Feature Implementation');
  });

  test('should show plan status', async () => {
    const cli = env.getCLI();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 创建测试计划
    await env.createTestPlan('20250107-143022', {
      name: 'Test Feature',
      status: 'running',
      currentStage: 2,
      totalStages: 5,
    });

    // 查看状态
    const result = await cli.status('20250107-143022');

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Test Feature');
    expect(result.stdout).toContain('running');
    expect(result.stdout).toContain('Stage 2/5');
  });

  test('should track plan progress through multiple stages', async () => {
    const cli = env.getCLI();
    const fs = env.getFS();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 创建计划
    const planId = '20250107-150000';
    await env.createTestPlan(planId, {
      name: 'Multi-Stage Test',
      status: 'running',
      currentStage: 1,
      totalStages: 3,
    });

    // 验证初始状态
    let metadata = await env.readPlanMetadata(planId);
    expect(metadata.currentStage).toBe(1);
    expect(metadata.status).toBe('running');

    // 模拟 Stage 1 完成
    await fs.writeFile(
      `.ccautorun/plans/${planId}/metadata.json`,
      JSON.stringify({
        ...metadata,
        currentStage: 2,
        updatedAt: new Date().toISOString(),
      }, null, 2)
    );

    // 验证 Stage 2
    metadata = await env.readPlanMetadata(planId);
    expect(metadata.currentStage).toBe(2);

    // 模拟 Stage 2 完成
    await fs.writeFile(
      `.ccautorun/plans/${planId}/metadata.json`,
      JSON.stringify({
        ...metadata,
        currentStage: 3,
        updatedAt: new Date().toISOString(),
      }, null, 2)
    );

    // 验证 Stage 3
    metadata = await env.readPlanMetadata(planId);
    expect(metadata.currentStage).toBe(3);

    // 模拟所有 Stage 完成
    await fs.writeFile(
      `.ccautorun/plans/${planId}/metadata.json`,
      JSON.stringify({
        ...metadata,
        status: 'completed',
        completedAt: new Date().toISOString(),
      }, null, 2)
    );

    // 验证完成状态
    metadata = await env.readPlanMetadata(planId);
    expect(metadata.status).toBe('completed');
    expect(metadata).toHaveProperty('completedAt');
  });

  test('should handle plan completion and archiving', async () => {
    const cli = env.getCLI();
    const fs = env.getFS();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 创建已完成的计划
    const planId = '20250107-160000';
    await env.createTestPlan(planId, {
      name: 'Completed Plan',
      status: 'completed',
      currentStage: 3,
      totalStages: 3,
      completedAt: new Date().toISOString(),
    });

    // 归档计划
    const result = await cli.archive(planId, { force: true });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('archived successfully');

    // 验证归档后的状态（计划应该仍然存在，但标记为 archived）
    const metadata = await env.readPlanMetadata(planId);
    expect(metadata.status).toBe('archived');
  });

  test('should run doctor command and check environment', async () => {
    const cli = env.getCLI();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 运行 doctor 命令
    const result = await cli.doctor();

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Environment Check');
    expect(result.stdout).toMatch(/Node\.js.*✓/);
    expect(result.stdout).toMatch(/npm.*✓/);
  });

  test('should manage configuration', async () => {
    const cli = env.getCLI();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 设置配置
    let result = await cli.config('set', 'defaults.auto_continue', 'false');
    expect(result.exitCode).toBe(0);

    // 获取配置
    result = await cli.config('get', 'defaults.auto_continue');
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('false');

    // 列出所有配置
    result = await cli.config('list');
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('defaults.auto_continue');
  });

  test('should create session logs', async () => {
    const cli = env.getCLI();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 创建计划和会话
    const planId = '20250107-170000';
    const sessionId = 'test-session-001';

    await env.createTestPlan(planId, {
      name: 'Session Test',
      status: 'running',
    });

    await env.createTestSession(sessionId, {
      planId,
      stage: 1,
      status: 'active',
    });

    // 验证会话存在
    expect(env.sessionExists(sessionId)).toBe(true);

    // 读取会话日志
    const logs = await env.readSessionLog(sessionId);
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].sessionId).toBe(sessionId);
    expect(logs[0].planId).toBe(planId);
  });

  test('should handle multiple plans', async () => {
    const cli = env.getCLI();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 创建多个计划
    await env.createTestPlan('20250107-180001', {
      name: 'Plan A',
      status: 'running',
    });

    await env.createTestPlan('20250107-180002', {
      name: 'Plan B',
      status: 'paused',
    });

    await env.createTestPlan('20250107-180003', {
      name: 'Plan C',
      status: 'completed',
    });

    // 列出所有计划
    const result = await cli.list();

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Plan A');
    expect(result.stdout).toContain('Plan B');
    expect(result.stdout).toContain('Plan C');
    expect(result.stdout).toContain('running');
    expect(result.stdout).toContain('paused');
    expect(result.stdout).toContain('completed');
  });

  test('should validate plan ID format', async () => {
    const cli = env.getCLI();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 尝试查看不存在的计划
    const result = await cli.status('invalid-plan-id');

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain('not found');
  });

  test('should handle config reset', async () => {
    const cli = env.getCLI();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 修改配置
    await cli.config('set', 'defaults.safety_limit', '20');

    // 验证修改
    let result = await cli.config('get', 'defaults.safety_limit');
    expect(result.stdout).toContain('20');

    // 重置配置
    result = await cli.config('reset');
    expect(result.exitCode).toBe(0);

    // 验证重置后的值
    result = await cli.config('get', 'defaults.safety_limit');
    expect(result.stdout).toContain('10'); // 默认值
  });
});

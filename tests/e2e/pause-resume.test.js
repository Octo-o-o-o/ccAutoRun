/**
 * E2E 测试：计划中断和恢复
 * 场景3: 执行到中间阶段 → 人工中断 → 恢复执行
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { E2ETestEnv } from '../helpers/e2e-test.js';
import { delay, waitFor } from '../helpers/test-utils.js';

describe('[E2E] Plan Pause and Resume', () => {
  let env;

  beforeEach(async () => {
    env = new E2ETestEnv();
    await env.setup();
  });

  afterEach(async () => {
    await env.teardown();
  });

  test('should pause a running plan', async () => {
    const cli = env.getCLI();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 创建运行中的计划
    const planId = '20250107-200000';
    await env.createTestPlan(planId, {
      name: 'Test Plan for Pause',
      status: 'running',
      currentStage: 3,
      totalStages: 7,
    });

    // 暂停计划
    const result = await cli.pause(planId);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('paused');

    // 等待状态更新
    await delay(100);

    // 验证计划状态变为 paused
    const metadata = await env.readPlanMetadata(planId);
    expect(metadata.status).toBe('paused');
    expect(metadata.currentStage).toBe(3); // 保持在当前阶段
  });

  test('should resume a paused plan', async () => {
    const cli = env.getCLI();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 创建暂停的计划
    const planId = '20250107-201000';
    await env.createTestPlan(planId, {
      name: 'Test Plan for Resume',
      status: 'paused',
      currentStage: 4,
      totalStages: 7,
    });

    // 恢复计划
    const result = await cli.resume(planId);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('resumed');

    // 等待状态更新
    await delay(100);

    // 验证计划状态变为 running
    const metadata = await env.readPlanMetadata(planId);
    expect(metadata.status).toBe('running');
    expect(metadata.currentStage).toBe(4); // 从暂停的阶段继续
  });

  test('should preserve execution context after pause and resume', async () => {
    const cli = env.getCLI();
    const fs = env.getFS();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 创建计划和会话
    const planId = '20250107-202000';
    const sessionId = 'session-pause-resume-001';

    await env.createTestPlan(planId, {
      name: 'Context Preservation Test',
      status: 'running',
      currentStage: 2,
      totalStages: 5,
    });

    // 创建会话记录
    await fs.writeFile(
      `.ccautorun/sessions/${sessionId}.jsonl`,
      [
        JSON.stringify({
          timestamp: new Date().toISOString(),
          type: 'start',
          sessionId,
          planId,
          stage: 1,
        }),
        JSON.stringify({
          timestamp: new Date().toISOString(),
          type: 'completed',
          sessionId,
          stage: 1,
        }),
        JSON.stringify({
          timestamp: new Date().toISOString(),
          type: 'start',
          sessionId,
          stage: 2,
        }),
      ].join('\n') + '\n'
    );

    // 暂停计划
    await cli.pause(planId);
    await delay(100);

    // 验证会话日志保留
    const logsBeforeResume = await env.readSessionLog(sessionId);
    expect(logsBeforeResume).toHaveLength(3);

    // 恢复计划
    await cli.resume(planId);
    await delay(100);

    // 验证会话日志中添加了恢复记录
    const logsAfterResume = await env.readSessionLog(sessionId);
    expect(logsAfterResume.length).toBeGreaterThan(3);

    // 查找恢复记录
    const resumeLog = logsAfterResume.find(log => log.type === 'resumed');
    expect(resumeLog).toBeDefined();
    expect(resumeLog.planId).toBe(planId);
  });

  test('should handle multiple pause-resume cycles', async () => {
    const cli = env.getCLI();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 创建计划
    const planId = '20250107-203000';
    await env.createTestPlan(planId, {
      name: 'Multiple Pause-Resume Test',
      status: 'running',
      currentStage: 1,
      totalStages: 5,
    });

    // 第一次暂停
    await cli.pause(planId);
    await delay(100);
    let metadata = await env.readPlanMetadata(planId);
    expect(metadata.status).toBe('paused');

    // 第一次恢复
    await cli.resume(planId);
    await delay(100);
    metadata = await env.readPlanMetadata(planId);
    expect(metadata.status).toBe('running');

    // 模拟进度推进
    await env.getFS().writeFile(
      `.ccautorun/plans/${planId}/metadata.json`,
      JSON.stringify({
        ...metadata,
        currentStage: 3,
      }, null, 2)
    );

    // 第二次暂停
    await cli.pause(planId);
    await delay(100);
    metadata = await env.readPlanMetadata(planId);
    expect(metadata.status).toBe('paused');
    expect(metadata.currentStage).toBe(3);

    // 第二次恢复
    await cli.resume(planId);
    await delay(100);
    metadata = await env.readPlanMetadata(planId);
    expect(metadata.status).toBe('running');
    expect(metadata.currentStage).toBe(3);
  });

  test('should not pause an already paused plan', async () => {
    const cli = env.getCLI();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 创建已暂停的计划
    const planId = '20250107-204000';
    await env.createTestPlan(planId, {
      name: 'Already Paused Plan',
      status: 'paused',
      currentStage: 2,
    });

    // 尝试再次暂停
    const result = await cli.pause(planId);

    // 应该提示已经暂停或成功（幂等操作）
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/already paused|paused successfully/i);
  });

  test('should not resume a running plan', async () => {
    const cli = env.getCLI();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 创建运行中的计划
    const planId = '20250107-205000';
    await env.createTestPlan(planId, {
      name: 'Already Running Plan',
      status: 'running',
      currentStage: 3,
    });

    // 尝试恢复
    const result = await cli.resume(planId);

    // 应该提示已经在运行或成功（幂等操作）
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/already running|resumed successfully/i);
  });

  test('should pause plan without specifying plan ID (use active plan)', async () => {
    const cli = env.getCLI();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 创建活跃计划
    const planId = '20250107-206000';
    await env.createTestPlan(planId, {
      name: 'Active Plan',
      status: 'running',
      currentStage: 2,
    });

    // 设置为活跃计划（假设有这个配置）
    const fs = env.getFS();
    const config = await fs.readFile('.ccautorun/config.yaml');
    await fs.writeFile(
      '.ccautorun/config.yaml',
      config + `\nactive_plan: ${planId}\n`
    );

    // 不指定 plan ID，暂停活跃计划
    const result = await cli.pause(null);

    // 应该成功暂停活跃计划
    expect(result.exitCode).toBe(0);

    await delay(100);
    const metadata = await env.readPlanMetadata(planId);
    expect(metadata.status).toBe('paused');
  });

  test('should handle pause during stage execution', async () => {
    const cli = env.getCLI();
    const fs = env.getFS();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 创建计划
    const planId = '20250107-207000';
    const sessionId = 'session-interrupt-001';

    await env.createTestPlan(planId, {
      name: 'Interrupt Test',
      status: 'running',
      currentStage: 3,
      totalStages: 5,
    });

    // 创建正在执行的会话
    await env.createTestSession(sessionId, {
      planId,
      stage: 3,
      status: 'active',
      startedAt: new Date().toISOString(),
    });

    // 暂停计划（模拟 Ctrl+C）
    await cli.pause(planId);
    await delay(100);

    // 验证计划暂停
    const metadata = await env.readPlanMetadata(planId);
    expect(metadata.status).toBe('paused');

    // 验证会话记录中有暂停标记
    const logs = await env.readSessionLog(sessionId);
    const pauseLog = logs.find(log => log.type === 'paused');
    expect(pauseLog).toBeDefined();
  });

  test('should resume from exact interruption point', async () => {
    const cli = env.getCLI();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 创建在 Stage 4 中断的计划
    const planId = '20250107-208000';
    await env.createTestPlan(planId, {
      name: 'Resume from Interruption',
      status: 'paused',
      currentStage: 4,
      totalStages: 7,
      lastCompletedStage: 3, // Stage 3 已完成，Stage 4 中断
    });

    // 恢复执行
    const result = await cli.resume(planId);
    expect(result.exitCode).toBe(0);

    await delay(100);

    // 验证从 Stage 4 继续
    const metadata = await env.readPlanMetadata(planId);
    expect(metadata.currentStage).toBe(4);
    expect(metadata.status).toBe('running');
  });

  test('should update pause timestamp and resume timestamp', async () => {
    const cli = env.getCLI();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 创建计划
    const planId = '20250107-209000';
    await env.createTestPlan(planId, {
      name: 'Timestamp Test',
      status: 'running',
      currentStage: 2,
    });

    // 暂停计划
    const pauseTime = Date.now();
    await cli.pause(planId);
    await delay(100);

    // 验证暂停时间戳
    let metadata = await env.readPlanMetadata(planId);
    expect(metadata).toHaveProperty('pausedAt');
    expect(new Date(metadata.pausedAt).getTime()).toBeGreaterThanOrEqual(pauseTime);

    // 等待一段时间
    await delay(200);

    // 恢复计划
    const resumeTime = Date.now();
    await cli.resume(planId);
    await delay(100);

    // 验证恢复时间戳
    metadata = await env.readPlanMetadata(planId);
    expect(metadata).toHaveProperty('resumedAt');
    expect(new Date(metadata.resumedAt).getTime()).toBeGreaterThanOrEqual(resumeTime);

    // 验证暂停时长
    if (metadata.totalPausedDuration !== undefined) {
      expect(metadata.totalPausedDuration).toBeGreaterThan(0);
    }
  });

  test('should handle failed plan resumption', async () => {
    const cli = env.getCLI();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 尝试恢复不存在的计划
    const result = await cli.resume('non-existent-plan');

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain('not found');
  });

  test('should preserve stage progress during pause-resume', async () => {
    const cli = env.getCLI();
    const fs = env.getFS();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 创建计划
    const planId = '20250107-210000';
    await env.createTestPlan(planId, {
      name: 'Progress Preservation Test',
      status: 'running',
      currentStage: 2,
      totalStages: 5,
      stageProgress: {
        stage1: { completed: true, duration: 120 },
        stage2: { completed: false, progress: 45 }, // Stage 2 进行到 45%
      },
    });

    // 暂停计划
    await cli.pause(planId);
    await delay(100);

    // 验证进度保留
    let metadata = await env.readPlanMetadata(planId);
    expect(metadata.stageProgress.stage2.progress).toBe(45);

    // 恢复计划
    await cli.resume(planId);
    await delay(100);

    // 验证恢复后进度仍然保留
    metadata = await env.readPlanMetadata(planId);
    expect(metadata.stageProgress.stage2.progress).toBe(45);
    expect(metadata.currentStage).toBe(2);
  });
});

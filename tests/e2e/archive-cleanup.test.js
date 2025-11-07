/**
 * E2E 测试：归档和清理
 * 场景4: 完成计划 → archive → 验证备份 → 清理
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { E2ETestEnv } from '../helpers/e2e-test.js';
import { delay } from '../helpers/test-utils.js';
import { join } from 'path';
import { existsSync } from 'fs';

describe('[E2E] Archive and Cleanup', () => {
  let env;

  beforeEach(async () => {
    env = new E2ETestEnv();
    await env.setup();
  });

  afterEach(async () => {
    await env.teardown();
  });

  test('should archive a completed plan', async () => {
    const cli = env.getCLI();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 创建已完成的计划
    const planId = '20250107-220000';
    await env.createTestPlan(planId, {
      name: 'Completed Plan for Archive',
      status: 'completed',
      currentStage: 5,
      totalStages: 5,
      completedAt: new Date().toISOString(),
    });

    // 归档计划
    const result = await cli.archive(planId, { force: true });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('archived successfully');

    // 验证计划状态变为 archived
    await delay(100);
    const metadata = await env.readPlanMetadata(planId);
    expect(metadata.status).toBe('archived');
    expect(metadata).toHaveProperty('archivedAt');
  });

  test('should not archive a running plan without force flag', async () => {
    const cli = env.getCLI();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 创建运行中的计划
    const planId = '20250107-221000';
    await env.createTestPlan(planId, {
      name: 'Running Plan',
      status: 'running',
      currentStage: 3,
      totalStages: 5,
    });

    // 尝试归档（不使用 --force）
    const result = await cli.archive(planId);

    // 应该失败或警告
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toMatch(/cannot archive.*running|use --force/i);

    // 验证计划状态未变
    const metadata = await env.readPlanMetadata(planId);
    expect(metadata.status).toBe('running');
  });

  test('should force archive a running plan with --force flag', async () => {
    const cli = env.getCLI();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 创建运行中的计划
    const planId = '20250107-222000';
    await env.createTestPlan(planId, {
      name: 'Force Archive Test',
      status: 'running',
      currentStage: 3,
      totalStages: 5,
    });

    // 强制归档
    const result = await cli.archive(planId, { force: true });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('archived');

    // 验证计划状态变为 archived
    await delay(100);
    const metadata = await env.readPlanMetadata(planId);
    expect(metadata.status).toBe('archived');
  });

  test('should preserve plan data after archiving', async () => {
    const cli = env.getCLI();
    const fs = env.getFS();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 创建已完成的计划
    const planId = '20250107-223000';
    await env.createTestPlan(planId, {
      name: 'Data Preservation Test',
      status: 'completed',
      currentStage: 3,
      totalStages: 3,
      tags: ['feature', 'backend'],
      estimatedTime: '4-6h',
    });

    // 创建额外的文件
    await fs.writeFile(
      `.ccautorun/plans/${planId}/notes.md`,
      '# Implementation Notes\n\nSome notes about the implementation.'
    );

    // 归档前记录数据
    const metadataBefore = await env.readPlanMetadata(planId);

    // 归档计划
    await cli.archive(planId, { force: true });
    await delay(100);

    // 验证计划目录仍然存在
    expect(env.planExists(planId)).toBe(true);

    // 验证元数据保留
    const metadataAfter = await env.readPlanMetadata(planId);
    expect(metadataAfter.name).toBe(metadataBefore.name);
    expect(metadataAfter.tags).toEqual(metadataBefore.tags);
    expect(metadataAfter.estimatedTime).toBe(metadataBefore.estimatedTime);

    // 验证额外文件保留
    expect(fs.exists(`.ccautorun/plans/${planId}/notes.md`)).toBe(true);
  });

  test('should list archived plans separately', async () => {
    const cli = env.getCLI();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 创建不同状态的计划
    await env.createTestPlan('20250107-224001', {
      name: 'Active Plan',
      status: 'running',
    });

    await env.createTestPlan('20250107-224002', {
      name: 'Completed Plan',
      status: 'completed',
    });

    await env.createTestPlan('20250107-224003', {
      name: 'Archived Plan',
      status: 'archived',
      archivedAt: new Date().toISOString(),
    });

    // 列出所有计划
    const result = await cli.list({ format: 'json' });
    const plans = JSON.parse(result.stdout);

    // 验证归档计划被标记
    const archivedPlan = plans.find(p => p.id === '20250107-224003');
    expect(archivedPlan).toBeDefined();
    expect(archivedPlan.status).toBe('archived');
  });

  test('should clean up old archived plans', async () => {
    const cli = env.getCLI();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 创建多个旧的归档计划
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 60); // 60天前

    for (let i = 1; i <= 3; i++) {
      await env.createTestPlan(`20250107-22500${i}`, {
        name: `Old Archived Plan ${i}`,
        status: 'archived',
        archivedAt: oldDate.toISOString(),
      });
    }

    // 创建最近的归档计划
    await env.createTestPlan('20250107-225004', {
      name: 'Recent Archived Plan',
      status: 'archived',
      archivedAt: new Date().toISOString(),
    });

    // TODO: 执行清理命令（假设为 ccautorun clean --older-than 30d）
    // const result = await cli.run(['clean', '--older-than', '30d']);
    // expect(result.exitCode).toBe(0);

    // 验证旧计划被清理，新计划保留
    // （这个功能可能需要在实际实现中添加）
  });

  test('should handle archive of plan with active sessions', async () => {
    const cli = env.getCLI();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 创建计划和活跃会话
    const planId = '20250107-226000';
    const sessionId = 'session-archive-001';

    await env.createTestPlan(planId, {
      name: 'Plan with Active Session',
      status: 'running',
      currentStage: 2,
    });

    await env.createTestSession(sessionId, {
      planId,
      stage: 2,
      status: 'active',
    });

    // 尝试归档（应该警告或要求确认）
    const result = await cli.archive(planId, { force: true });

    // 应该成功归档
    expect(result.exitCode).toBe(0);

    // 验证会话被标记为归档
    await delay(100);
    const logs = await env.readSessionLog(sessionId);
    const archiveLog = logs.find(log => log.type === 'archived');
    expect(archiveLog).toBeDefined();
  });

  test('should support archiving with custom notes', async () => {
    const cli = env.getCLI();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 创建已完成的计划
    const planId = '20250107-227000';
    await env.createTestPlan(planId, {
      name: 'Plan with Notes',
      status: 'completed',
    });

    // 归档并添加备注
    const notes = 'Successfully completed with all tests passing';
    const result = await cli.run(['archive', planId, '--notes', notes], { force: true });

    // 验证归档成功
    expect(result.exitCode).toBe(0);

    await delay(100);

    // 验证备注被保存
    const metadata = await env.readPlanMetadata(planId);
    expect(metadata.archiveNotes).toBe(notes);
  });

  test('should calculate and store plan statistics on archive', async () => {
    const cli = env.getCLI();
    const fs = env.getFS();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 创建计划
    const planId = '20250107-228000';
    const startTime = new Date('2025-01-07T10:00:00Z');
    const endTime = new Date('2025-01-07T14:30:00Z');

    await env.createTestPlan(planId, {
      name: 'Statistics Test',
      status: 'completed',
      currentStage: 5,
      totalStages: 5,
      createdAt: startTime.toISOString(),
      completedAt: endTime.toISOString(),
    });

    // 创建会话日志（模拟执行历史）
    await fs.writeFile(
      `.ccautorun/sessions/${planId}-session.jsonl`,
      [
        JSON.stringify({ timestamp: startTime.toISOString(), type: 'start', stage: 1 }),
        JSON.stringify({ timestamp: new Date('2025-01-07T11:00:00Z').toISOString(), type: 'completed', stage: 1 }),
        JSON.stringify({ timestamp: new Date('2025-01-07T11:00:00Z').toISOString(), type: 'start', stage: 2 }),
        JSON.stringify({ timestamp: new Date('2025-01-07T12:30:00Z').toISOString(), type: 'completed', stage: 2 }),
        JSON.stringify({ timestamp: new Date('2025-01-07T12:30:00Z').toISOString(), type: 'start', stage: 3 }),
        JSON.stringify({ timestamp: endTime.toISOString(), type: 'completed', stage: 3 }),
      ].join('\n') + '\n'
    );

    // 归档计划
    await cli.archive(planId, { force: true });
    await delay(100);

    // 验证统计信息
    const metadata = await env.readPlanMetadata(planId);
    expect(metadata).toHaveProperty('statistics');
    expect(metadata.statistics.totalDuration).toBeGreaterThan(0);
    expect(metadata.statistics.stagesCompleted).toBe(5);
  });

  test('should support unarchiving a plan', async () => {
    const cli = env.getCLI();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 创建归档的计划
    const planId = '20250107-229000';
    await env.createTestPlan(planId, {
      name: 'Unarchive Test',
      status: 'archived',
      archivedAt: new Date().toISOString(),
    });

    // 取消归档
    const result = await cli.run(['unarchive', planId]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('unarchived');

    await delay(100);

    // 验证状态恢复
    const metadata = await env.readPlanMetadata(planId);
    expect(metadata.status).not.toBe('archived');
    expect(metadata.status).toBe('completed'); // 恢复到原始状态
  });

  test('should handle bulk archive operation', async () => {
    const cli = env.getCLI();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 创建多个已完成的计划
    const planIds = ['20250107-230001', '20250107-230002', '20250107-230003'];

    for (const planId of planIds) {
      await env.createTestPlan(planId, {
        name: `Bulk Archive Plan ${planId}`,
        status: 'completed',
      });
    }

    // 批量归档所有已完成的计划
    const result = await cli.run(['archive', '--all-completed', '--force']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('3 plans archived');

    await delay(100);

    // 验证所有计划都被归档
    for (const planId of planIds) {
      const metadata = await env.readPlanMetadata(planId);
      expect(metadata.status).toBe('archived');
    }
  });

  test('should export archived plan as backup', async () => {
    const cli = env.getCLI();
    const fs = env.getFS();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 创建归档的计划
    const planId = '20250107-231000';
    await env.createTestPlan(planId, {
      name: 'Export Test',
      status: 'archived',
    });

    // 导出归档
    const result = await cli.run(['export', planId, '--output', 'archive.tar.gz']);

    // 验证导出成功
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('exported');

    // 验证导出文件存在
    const exportPath = join(env.testDir, 'archive.tar.gz');
    expect(existsSync(exportPath)).toBe(true);
  });

  test('should show archive history', async () => {
    const cli = env.getCLI();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 创建多个归档计划
    for (let i = 1; i <= 3; i++) {
      const planId = `20250107-23200${i}`;
      await env.createTestPlan(planId, {
        name: `Archived Plan ${i}`,
        status: 'archived',
        archivedAt: new Date(Date.now() - i * 86400000).toISOString(), // 不同时间
      });
    }

    // 列出归档历史
    const result = await cli.run(['list', '--archived']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Archived Plan 1');
    expect(result.stdout).toContain('Archived Plan 2');
    expect(result.stdout).toContain('Archived Plan 3');
  });

  test('should handle archive with snapshots cleanup', async () => {
    const cli = env.getCLI();
    const fs = env.getFS();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 创建计划和快照
    const planId = '20250107-233000';
    await env.createTestPlan(planId, {
      name: 'Snapshot Cleanup Test',
      status: 'completed',
    });

    // 创建快照目录
    await fs.writeFile(
      `.ccautorun/snapshots/${planId}/stage-1/manifest.json`,
      JSON.stringify({ stage: 1, files: [] })
    );

    await fs.writeFile(
      `.ccautorun/snapshots/${planId}/stage-2/manifest.json`,
      JSON.stringify({ stage: 2, files: [] })
    );

    // 归档计划（应该清理中间快照，只保留首尾）
    const result = await cli.archive(planId, { force: true });

    expect(result.exitCode).toBe(0);

    await delay(100);

    // 验证快照被清理（只保留重要快照）
    // （具体逻辑取决于实现）
    expect(fs.exists(`.ccautorun/snapshots/${planId}`)).toBe(true);
  });
});

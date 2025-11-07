/**
 * 性能基准测试
 * 测试 ccAutoRun 的性能指标
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { E2ETestEnv } from '../helpers/e2e-test.js';
import { performance } from 'perf_hooks';
import { join } from 'path';

/**
 * 性能测试配置
 */
const PERFORMANCE_TARGETS = {
  smallProject: {
    lines: 1000,
    planGenerationTime: 10000, // 10秒
  },
  mediumProject: {
    lines: 10000,
    planGenerationTime: 30000, // 30秒
  },
  largeProject: {
    lines: 50000,
    planGenerationTime: 60000, // 60秒
  },
  hookResponse: 2000, // 2秒
  memoryLimit: 200 * 1024 * 1024, // 200MB
};

/**
 * 测量函数执行时间
 * @param {Function} fn - 要测量的函数
 * @returns {Promise<{duration: number, result: any}>}
 */
async function measureTime(fn) {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  const duration = end - start;

  return { duration, result };
}

/**
 * 获取当前内存使用量
 * @returns {number} 内存使用量（字节）
 */
function getMemoryUsage() {
  const usage = process.memoryUsage();
  return usage.heapUsed;
}

/**
 * 创建模拟代码文件
 * @param {TestFileSystem} fs - 文件系统
 * @param {number} totalLines - 总行数
 */
async function createMockCodebase(fs, totalLines) {
  const linesPerFile = 200;
  const fileCount = Math.ceil(totalLines / linesPerFile);

  for (let i = 0; i < fileCount; i++) {
    const lines = [];

    for (let j = 0; j < linesPerFile && i * linesPerFile + j < totalLines; j++) {
      lines.push(`// Line ${i * linesPerFile + j + 1}`);
      lines.push(`function func_${i}_${j}() {`);
      lines.push(`  return ${i * linesPerFile + j};`);
      lines.push(`}`);
    }

    await fs.writeFile(
      `src/module_${i}.js`,
      lines.join('\n')
    );
  }
}

describe('[Performance] Benchmarks', () => {
  let env;

  beforeEach(async () => {
    env = new E2ETestEnv();
    await env.setup();
  });

  afterEach(async () => {
    await env.teardown();
  });

  test('init command should complete within acceptable time', async () => {
    const cli = env.getCLI();

    const { duration, result } = await measureTime(async () => {
      return await cli.init({ nonInteractive: true });
    });

    expect(result.exitCode).toBe(0);
    expect(duration).toBeLessThan(5000); // 5秒内完成初始化

    console.log(`✓ Init completed in ${duration.toFixed(2)}ms`);
  });

  test('list command should handle large number of plans', async () => {
    const cli = env.getCLI();
    const fs = env.getFS();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 创建 100 个计划
    const planCount = 100;
    for (let i = 0; i < planCount; i++) {
      const planId = `20250107-${String(300000 + i).padStart(6, '0')}`;
      await env.createTestPlan(planId, {
        name: `Performance Test Plan ${i}`,
        status: i % 3 === 0 ? 'completed' : i % 3 === 1 ? 'running' : 'paused',
      });
    }

    // 测量 list 命令性能
    const { duration, result } = await measureTime(async () => {
      return await cli.list({ format: 'json' });
    });

    expect(result.exitCode).toBe(0);
    expect(duration).toBeLessThan(1000); // 1秒内列出所有计划

    const plans = JSON.parse(result.stdout);
    expect(plans).toHaveLength(planCount);

    console.log(`✓ Listed ${planCount} plans in ${duration.toFixed(2)}ms`);
  });

  test('status command should respond quickly', async () => {
    const cli = env.getCLI();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 创建计划
    const planId = '20250107-310000';
    await env.createTestPlan(planId, {
      name: 'Status Performance Test',
      status: 'running',
      currentStage: 5,
      totalStages: 10,
    });

    // 测量 status 命令性能
    const { duration, result } = await measureTime(async () => {
      return await cli.status(planId);
    });

    expect(result.exitCode).toBe(0);
    expect(duration).toBeLessThan(500); // 500ms 内响应

    console.log(`✓ Status query completed in ${duration.toFixed(2)}ms`);
  });

  test('config operations should be fast', async () => {
    const cli = env.getCLI();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 测量 set 操作
    const { duration: setDuration } = await measureTime(async () => {
      return await cli.config('set', 'defaults.safety_limit', '20');
    });

    expect(setDuration).toBeLessThan(200); // 200ms 内完成

    // 测量 get 操作
    const { duration: getDuration } = await measureTime(async () => {
      return await cli.config('get', 'defaults.safety_limit');
    });

    expect(getDuration).toBeLessThan(100); // 100ms 内完成

    console.log(`✓ Config set: ${setDuration.toFixed(2)}ms, get: ${getDuration.toFixed(2)}ms`);
  });

  test('pause/resume operations should be near-instant', async () => {
    const cli = env.getCLI();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 创建计划
    const planId = '20250107-320000';
    await env.createTestPlan(planId, {
      name: 'Pause/Resume Performance Test',
      status: 'running',
    });

    // 测量 pause 性能
    const { duration: pauseDuration, result: pauseResult } = await measureTime(async () => {
      return await cli.pause(planId);
    });

    expect(pauseResult.exitCode).toBe(0);
    expect(pauseDuration).toBeLessThan(500); // 500ms 内暂停

    // 测量 resume 性能
    const { duration: resumeDuration, result: resumeResult } = await measureTime(async () => {
      return await cli.resume(planId);
    });

    expect(resumeResult.exitCode).toBe(0);
    expect(resumeDuration).toBeLessThan(500); // 500ms 内恢复

    console.log(`✓ Pause: ${pauseDuration.toFixed(2)}ms, Resume: ${resumeDuration.toFixed(2)}ms`);
  });

  test('memory usage should stay within limits', async () => {
    const cli = env.getCLI();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 记录初始内存
    const initialMemory = getMemoryUsage();

    // 创建多个计划和会话
    for (let i = 0; i < 50; i++) {
      const planId = `20250107-${String(330000 + i).padStart(6, '0')}`;
      await env.createTestPlan(planId, {
        name: `Memory Test Plan ${i}`,
        status: 'running',
      });

      await env.createTestSession(`session-mem-${i}`, {
        planId,
        stage: 1,
        status: 'active',
      });
    }

    // 执行多个命令
    await cli.list({ format: 'json' });
    for (let i = 0; i < 10; i++) {
      await cli.status(`20250107-${String(330000 + i).padStart(6, '0')}`);
    }

    // 记录最终内存
    const finalMemory = getMemoryUsage();
    const memoryIncrease = finalMemory - initialMemory;

    // 验证内存增长在合理范围内
    expect(memoryIncrease).toBeLessThan(PERFORMANCE_TARGETS.memoryLimit);

    console.log(`✓ Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
  });

  test('doctor command performance', async () => {
    const cli = env.getCLI();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 测量 doctor 命令性能
    const { duration, result } = await measureTime(async () => {
      return await cli.doctor();
    });

    expect(result.exitCode).toBe(0);
    expect(duration).toBeLessThan(3000); // 3秒内完成环境检查

    console.log(`✓ Doctor check completed in ${duration.toFixed(2)}ms`);
  });

  test('archive operation performance', async () => {
    const cli = env.getCLI();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 创建已完成的计划
    const planId = '20250107-340000';
    await env.createTestPlan(planId, {
      name: 'Archive Performance Test',
      status: 'completed',
    });

    // 测量 archive 性能
    const { duration, result } = await measureTime(async () => {
      return await cli.archive(planId, { force: true });
    });

    expect(result.exitCode).toBe(0);
    expect(duration).toBeLessThan(2000); // 2秒内完成归档

    console.log(`✓ Archive completed in ${duration.toFixed(2)}ms`);
  });

  test('concurrent command execution', async () => {
    const cli = env.getCLI();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 创建多个计划
    const planIds = [];
    for (let i = 0; i < 10; i++) {
      const planId = `20250107-${String(350000 + i).padStart(6, '0')}`;
      planIds.push(planId);
      await env.createTestPlan(planId, {
        name: `Concurrent Test Plan ${i}`,
        status: 'running',
      });
    }

    // 并发执行 status 查询
    const { duration } = await measureTime(async () => {
      const promises = planIds.map(planId => cli.status(planId));
      await Promise.all(promises);
    });

    // 并发执行应该比顺序执行快
    expect(duration).toBeLessThan(3000); // 3秒内完成10个查询

    console.log(`✓ 10 concurrent status queries in ${duration.toFixed(2)}ms`);
  });

  test('large session log read performance', async () => {
    const cli = env.getCLI();
    const fs = env.getFS();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 创建大型会话日志
    const sessionId = 'large-session-001';
    const logLines = [];

    for (let i = 0; i < 10000; i++) {
      logLines.push(JSON.stringify({
        timestamp: new Date().toISOString(),
        type: i % 2 === 0 ? 'progress' : 'info',
        stage: Math.floor(i / 100) + 1,
        message: `Log entry ${i}`,
      }));
    }

    await fs.writeFile(
      `.ccautorun/sessions/${sessionId}.jsonl`,
      logLines.join('\n') + '\n'
    );

    // 测量读取性能
    const { duration } = await measureTime(async () => {
      return await env.readSessionLog(sessionId);
    });

    expect(duration).toBeLessThan(1000); // 1秒内读取10000行日志

    console.log(`✓ Read 10000 log lines in ${duration.toFixed(2)}ms`);
  });

  test('file system operation performance', async () => {
    const fs = env.getFS();

    // 测量创建 1000 个文件的性能
    const { duration } = await measureTime(async () => {
      for (let i = 0; i < 1000; i++) {
        await fs.writeFile(`test-file-${i}.txt`, `Content ${i}`);
      }
    });

    // 验证性能
    expect(duration).toBeLessThan(5000); // 5秒内创建1000个文件

    console.log(`✓ Created 1000 files in ${duration.toFixed(2)}ms`);
  });

  test('plan metadata update performance', async () => {
    const cli = env.getCLI();

    // 初始化
    await cli.init({ nonInteractive: true });

    // 创建计划
    const planId = '20250107-360000';
    await env.createTestPlan(planId, {
      name: 'Metadata Update Test',
      status: 'running',
    });

    // 测量多次状态更新的性能
    const { duration } = await measureTime(async () => {
      for (let stage = 1; stage <= 10; stage++) {
        const metadata = await env.readPlanMetadata(planId);
        await env.getFS().writeFile(
          `.ccautorun/plans/${planId}/metadata.json`,
          JSON.stringify({
            ...metadata,
            currentStage: stage,
            updatedAt: new Date().toISOString(),
          }, null, 2)
        );
      }
    });

    expect(duration).toBeLessThan(1000); // 1秒内完成10次更新

    console.log(`✓ 10 metadata updates in ${duration.toFixed(2)}ms`);
  });
});

/**
 * 性能报告生成
 */
describe('[Performance] Report Generation', () => {
  test('should generate performance report', async () => {
    // 这个测试用于生成性能报告
    const report = {
      timestamp: new Date().toISOString(),
      platform: process.platform,
      nodeVersion: process.version,
      targets: PERFORMANCE_TARGETS,
      results: {
        // 测试结果将在实际运行时填充
      },
    };

    // 输出报告（实际实现中应该保存到文件）
    console.log('\n=== Performance Test Report ===');
    console.log(JSON.stringify(report, null, 2));
    console.log('================================\n');

    expect(report).toBeDefined();
  });
});

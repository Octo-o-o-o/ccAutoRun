/**
 * E2E 测试辅助工具
 * 提供完整的 CLI 命令测试环境
 */

import { spawn } from 'child_process';
import { join } from 'path';
import { TestFileSystem } from './mock-fs.js';
import { waitFor } from './test-utils.js';
import { existsSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';

/**
 * CLI 执行结果
 * @typedef {Object} CLIResult
 * @property {number} exitCode - 退出码
 * @property {string} stdout - 标准输出
 * @property {string} stderr - 标准错误
 * @property {number} duration - 执行时间（毫秒）
 */

/**
 * CLI 测试执行器
 */
export class CLIRunner {
  constructor(testDir) {
    this.testDir = testDir;
    this.binPath = join(process.cwd(), 'bin/ccautorun.js');
    this.env = {
      ...process.env,
      CCAUTORUN_HOME: testDir,
      NODE_ENV: 'test',
    };
  }

  /**
   * 执行 CLI 命令
   * @param {string[]} args - 命令参数
   * @param {Object} options - 选项
   * @returns {Promise<CLIResult>} 执行结果
   */
  async run(args, options = {}) {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const child = spawn('node', [this.binPath, ...args], {
        cwd: options.cwd || this.testDir,
        env: { ...this.env, ...options.env },
        timeout: options.timeout || 30000,
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      // 处理输入（用于交互式命令）
      if (options.input) {
        child.stdin?.write(options.input);
        child.stdin?.end();
      }

      child.on('close', (exitCode) => {
        const duration = Date.now() - startTime;

        resolve({
          exitCode: exitCode || 0,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          duration,
        });
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * 执行 init 命令
   * @param {Object} options - 选项
   * @returns {Promise<CLIResult>}
   */
  async init(options = {}) {
    const args = ['init'];
    if (options.nonInteractive) {
      args.push('--non-interactive');
    }
    return this.run(args, options);
  }

  /**
   * 执行 list 命令
   * @param {Object} options - 选项
   * @returns {Promise<CLIResult>}
   */
  async list(options = {}) {
    const args = ['list'];
    if (options.format) {
      args.push('--format', options.format);
    }
    return this.run(args, options);
  }

  /**
   * 执行 status 命令
   * @param {string} planId - 计划 ID
   * @param {Object} options - 选项
   * @returns {Promise<CLIResult>}
   */
  async status(planId, options = {}) {
    const args = ['status'];
    if (planId) {
      args.push(planId);
    }
    return this.run(args, options);
  }

  /**
   * 执行 pause 命令
   * @param {string} planId - 计划 ID
   * @param {Object} options - 选项
   * @returns {Promise<CLIResult>}
   */
  async pause(planId, options = {}) {
    const args = ['pause'];
    if (planId) {
      args.push(planId);
    }
    return this.run(args, options);
  }

  /**
   * 执行 resume 命令
   * @param {string} planId - 计划 ID
   * @param {Object} options - 选项
   * @returns {Promise<CLIResult>}
   */
  async resume(planId, options = {}) {
    const args = ['resume'];
    if (planId) {
      args.push(planId);
    }
    return this.run(args, options);
  }

  /**
   * 执行 archive 命令
   * @param {string} planId - 计划 ID
   * @param {Object} options - 选项
   * @returns {Promise<CLIResult>}
   */
  async archive(planId, options = {}) {
    const args = ['archive', planId];
    if (options.force) {
      args.push('--force');
    }
    return this.run(args, options);
  }

  /**
   * 执行 doctor 命令
   * @param {Object} options - 选项
   * @returns {Promise<CLIResult>}
   */
  async doctor(options = {}) {
    const args = ['doctor'];
    if (options.verbose) {
      args.push('--verbose');
    }
    return this.run(args, options);
  }

  /**
   * 执行 config 命令
   * @param {string} action - 动作 (get/set/list/reset)
   * @param {string} key - 配置键
   * @param {string} value - 配置值
   * @param {Object} options - 选项
   * @returns {Promise<CLIResult>}
   */
  async config(action, key, value, options = {}) {
    const args = ['config', action];
    if (key) {
      args.push(key);
    }
    if (value) {
      args.push(value);
    }
    return this.run(args, options);
  }

  /**
   * 执行 logs 命令
   * @param {string} planId - 计划 ID
   * @param {Object} options - 选项
   * @returns {Promise<CLIResult>}
   */
  async logs(planId, options = {}) {
    const args = ['logs'];
    if (planId) {
      args.push(planId);
    }
    if (options.tail) {
      args.push('--tail', options.tail.toString());
    }
    return this.run(args, options);
  }
}

/**
 * E2E 测试环境
 * 提供完整的测试环境管理
 */
export class E2ETestEnv {
  constructor() {
    this.fs = new TestFileSystem();
    this.cli = null;
    this.testDir = null;
  }

  /**
   * 设置测试环境
   */
  async setup() {
    this.testDir = await this.fs.setup();
    this.cli = new CLIRunner(this.testDir);
    return this.testDir;
  }

  /**
   * 清理测试环境
   */
  async teardown() {
    await this.fs.teardown();
    this.cli = null;
    this.testDir = null;
  }

  /**
   * 获取 CLI 执行器
   * @returns {CLIRunner}
   */
  getCLI() {
    return this.cli;
  }

  /**
   * 获取文件系统
   * @returns {TestFileSystem}
   */
  getFS() {
    return this.fs;
  }

  /**
   * 等待计划状态变化
   * @param {string} planId - 计划 ID
   * @param {string} expectedStatus - 期望的状态
   * @param {number} timeout - 超时时间
   * @returns {Promise<boolean>}
   */
  async waitForPlanStatus(planId, expectedStatus, timeout = 10000) {
    return await waitFor(async () => {
      const metadataPath = join(
        this.testDir,
        '.ccautorun/plans',
        planId,
        'metadata.json'
      );

      if (!existsSync(metadataPath)) {
        return false;
      }

      const content = await readFile(metadataPath, 'utf-8');
      const metadata = JSON.parse(content);

      return metadata.status === expectedStatus;
    }, timeout);
  }

  /**
   * 等待会话状态变化
   * @param {string} sessionId - Session ID
   * @param {string} expectedStatus - 期望的状态
   * @param {number} timeout - 超时时间
   * @returns {Promise<boolean>}
   */
  async waitForSessionStatus(sessionId, expectedStatus, timeout = 10000) {
    return await waitFor(async () => {
      const sessionPath = join(
        this.testDir,
        '.ccautorun/sessions',
        `${sessionId}.jsonl`
      );

      if (!existsSync(sessionPath)) {
        return false;
      }

      const content = await readFile(sessionPath, 'utf-8');
      const lines = content.trim().split('\n');
      const lastLine = lines[lines.length - 1];
      const data = JSON.parse(lastLine);

      return data.status === expectedStatus;
    }, timeout);
  }

  /**
   * 创建测试计划
   * @param {string} planId - 计划 ID
   * @param {Object} metadata - 元数据
   * @returns {Promise<void>}
   */
  async createTestPlan(planId, metadata = {}) {
    const planDir = join(this.testDir, '.ccautorun/plans', planId);
    const dirs = this.fs.getDir('plans');

    // 使用 TestFileSystem 创建目录和文件
    await this.fs.writeFile(
      `.ccautorun/plans/${planId}/metadata.json`,
      JSON.stringify({
        id: planId,
        name: 'Test Plan',
        status: 'planning',
        architecture: 'split',
        currentStage: 1,
        totalStages: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...metadata,
      }, null, 2)
    );

    // 创建主计划文件
    await this.fs.writeFile(
      `.ccautorun/plans/${planId}/EXECUTION_PLAN.md`,
      `# Test Execution Plan

<!-- AUTO-RUN-CONFIG
stages: 3
current: 1
auto_continue: true
safety_limit: 10
architecture: split
-->

## Test Plan
This is a test plan.
`
    );

    // 创建 stages 目录
    await this.fs.writeFile(
      `.ccautorun/plans/${planId}/docs/stages/stage-1.md`,
      '# Stage 1\n\nTest stage 1'
    );
  }

  /**
   * 创建测试会话
   * @param {string} sessionId - Session ID
   * @param {Object} data - Session 数据
   * @returns {Promise<void>}
   */
  async createTestSession(sessionId, data = {}) {
    await this.fs.writeFile(
      `.ccautorun/sessions/${sessionId}.jsonl`,
      JSON.stringify({
        timestamp: new Date().toISOString(),
        type: 'start',
        sessionId,
        ...data,
      }) + '\n'
    );
  }

  /**
   * 读取计划元数据
   * @param {string} planId - 计划 ID
   * @returns {Promise<Object>} 元数据对象
   */
  async readPlanMetadata(planId) {
    const content = await this.fs.readFile(
      `.ccautorun/plans/${planId}/metadata.json`
    );
    return JSON.parse(content);
  }

  /**
   * 读取会话记录
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object[]>} Session 记录数组
   */
  async readSessionLog(sessionId) {
    const content = await this.fs.readFile(
      `.ccautorun/sessions/${sessionId}.jsonl`
    );
    const lines = content.trim().split('\n');
    return lines.map(line => JSON.parse(line));
  }

  /**
   * 检查计划是否存在
   * @param {string} planId - 计划 ID
   * @returns {boolean}
   */
  planExists(planId) {
    return this.fs.exists(`.ccautorun/plans/${planId}/metadata.json`);
  }

  /**
   * 检查会话是否存在
   * @param {string} sessionId - Session ID
   * @returns {boolean}
   */
  sessionExists(sessionId) {
    return this.fs.exists(`.ccautorun/sessions/${sessionId}.jsonl`);
  }

  /**
   * 获取所有计划
   * @returns {Promise<string[]>} 计划 ID 列表
   */
  async getAllPlans() {
    const plansDir = join(this.testDir, '.ccautorun/plans');
    if (!existsSync(plansDir)) {
      return [];
    }

    const { readdir } = await import('fs/promises');
    return await readdir(plansDir);
  }

  /**
   * 模拟用户输入（用于交互式命令）
   * @param {string[]} answers - 答案列表
   * @returns {string} 输入字符串
   */
  mockInteractiveInput(answers) {
    return answers.join('\n') + '\n';
  }
}

/**
 * 创建 E2E 测试套件
 * @param {string} description - 测试描述
 * @param {Function} testSuite - 测试套件函数
 */
export function describeE2E(description, testSuite) {
  describe(`[E2E] ${description}`, testSuite);
}

/**
 * Claude Code Transcript Mock
 * 模拟 Claude Code 的 transcript 文件和标记机制
 */

import { writeFile, mkdir, utimes } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

/**
 * 创建 Claude Code transcript 文件
 * @param {string} baseDir - 基础目录
 * @param {Object} data - Transcript 数据
 * @returns {Promise<string>} Transcript 文件路径
 */
export async function createClaudeTranscript(baseDir, data) {
  const claudeDir = join(baseDir, '.claude');
  const transcriptFile = join(claudeDir, 'transcript.json');

  // 确保目录存在
  if (!existsSync(claudeDir)) {
    await mkdir(claudeDir, { recursive: true });
  }

  // 写入 transcript
  await writeFile(transcriptFile, JSON.stringify(data, null, 2), 'utf-8');

  return transcriptFile;
}

/**
 * 创建 Stage 完成标记文件
 * @param {string} baseDir - 基础目录
 * @param {number} stage - Stage 编号
 * @param {string} status - 状态 ('completed' 或 'failed')
 * @param {string} [error] - 错误信息（失败时）
 * @returns {Promise<string>} 标记文件路径
 */
export async function createStageMarker(baseDir, stage, status = 'completed', error = null) {
  const markerDir = join(baseDir, '.ccautorun/.markers');

  // 确保目录存在
  if (!existsSync(markerDir)) {
    await mkdir(markerDir, { recursive: true });
  }

  // 创建标记文件
  const markerFile = join(markerDir, `stage-${stage}.marker`);
  const content = error ? `${status.toUpperCase()}:${error}` : status.toUpperCase();

  await writeFile(markerFile, content, 'utf-8');

  return markerFile;
}

/**
 * 模拟文件修改时间（用于测试降级策略）
 * @param {string} filePath - 文件路径
 * @param {Date} mtime - 修改时间
 */
export async function setFileModificationTime(filePath, mtime) {
  const atime = new Date(); // 访问时间使用当前时间
  await utimes(filePath, atime, mtime);
}

/**
 * 创建模拟的 Claude Code 环境
 * @param {string} baseDir - 基础目录
 * @returns {Promise<Object>} Claude 环境对象
 */
export async function createMockClaudeEnvironment(baseDir) {
  const claudeDir = join(baseDir, '.claude');
  const hooksDir = join(claudeDir, 'hooks');
  const commandsDir = join(claudeDir, 'commands');

  // 创建目录
  await mkdir(hooksDir, { recursive: true });
  await mkdir(commandsDir, { recursive: true });

  const env = {
    claudeDir,
    hooksDir,
    commandsDir,
  };

  return env;
}

/**
 * 模拟 Hook 执行环境变量
 * @param {string} baseDir - 基础目录
 * @param {string} planId - 计划 ID
 * @param {number} stage - 当前 Stage
 * @returns {Object} 环境变量对象
 */
export function createMockHookEnv(baseDir, planId, stage) {
  return {
    CCAUTORUN_PROJECT_DIR: baseDir,
    CCAUTORUN_PLAN_ID: planId,
    CCAUTORUN_CURRENT_STAGE: String(stage),
    CCAUTORUN_DATA_DIR: join(baseDir, '.ccautorun'),
    NODE_ENV: 'test',
  };
}

/**
 * 创建完整的 transcript 数据
 * @param {number} stage - Stage 编号
 * @param {string} status - 状态
 * @param {string[]} messages - 消息列表
 * @returns {Object} Transcript 对象
 */
export function createTranscriptData(stage, status = 'completed', messages = []) {
  const defaultMessages = [
    { role: 'user', content: `Execute Stage ${stage}`, timestamp: Date.now() - 60000 },
    { role: 'assistant', content: `Starting Stage ${stage}...`, timestamp: Date.now() - 30000 },
    { role: 'assistant', content: `✅ Stage ${stage} completed successfully`, timestamp: Date.now() },
  ];

  return {
    stage,
    status,
    timestamp: Date.now(),
    messages: messages.length > 0 ? messages : defaultMessages,
  };
}

/**
 * 创建失败状态的 transcript
 * @param {number} stage - Stage 编号
 * @param {string} errorMessage - 错误信息
 * @returns {Object} Transcript 对象
 */
export function createFailedTranscript(stage, errorMessage) {
  return {
    stage,
    status: 'failed',
    timestamp: Date.now(),
    error: {
      message: errorMessage,
      code: 'EXECUTION_ERROR',
      timestamp: Date.now(),
    },
    messages: [
      { role: 'user', content: `Execute Stage ${stage}`, timestamp: Date.now() - 60000 },
      { role: 'assistant', content: `Starting Stage ${stage}...`, timestamp: Date.now() - 30000 },
      { role: 'assistant', content: `❌ Error: ${errorMessage}`, timestamp: Date.now() },
    ],
  };
}

/**
 * Mock Transcript 管理器
 * 提供更高级的 transcript 操作
 */
export class MockTranscriptManager {
  constructor(baseDir) {
    this.baseDir = baseDir;
    this.claudeDir = join(baseDir, '.claude');
    this.transcriptFile = join(this.claudeDir, 'transcript.json');
  }

  /**
   * 初始化 Claude 环境
   */
  async setup() {
    await mkdir(this.claudeDir, { recursive: true });
  }

  /**
   * 写入 transcript
   * @param {Object} data - Transcript 数据
   */
  async writeTranscript(data) {
    await writeFile(this.transcriptFile, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * 模拟 Stage 完成
   * @param {number} stage - Stage 编号
   */
  async completeStage(stage) {
    const data = createTranscriptData(stage, 'completed');
    await this.writeTranscript(data);
  }

  /**
   * 模拟 Stage 失败
   * @param {number} stage - Stage 编号
   * @param {string} errorMessage - 错误信息
   */
  async failStage(stage, errorMessage) {
    const data = createFailedTranscript(stage, errorMessage);
    await this.writeTranscript(data);
  }

  /**
   * 模拟 Stage 进行中
   * @param {number} stage - Stage 编号
   */
  async startStage(stage) {
    const data = {
      stage,
      status: 'in_progress',
      timestamp: Date.now(),
      messages: [
        { role: 'user', content: `Execute Stage ${stage}`, timestamp: Date.now() - 30000 },
        { role: 'assistant', content: `Starting Stage ${stage}...`, timestamp: Date.now() },
      ],
    };
    await this.writeTranscript(data);
  }

  /**
   * 清理 transcript
   */
  async clear() {
    if (existsSync(this.transcriptFile)) {
      await writeFile(this.transcriptFile, '{}', 'utf-8');
    }
  }
}

/**
 * 辅助函数：等待一段时间（用于测试定时器）
 * @param {number} ms - 毫秒数
 */
export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 辅助函数：创建 Mock 定时器环境
 * 在测试中使用 vi.useFakeTimers() 和这个辅助函数
 */
export function createMockTimers() {
  return {
    /**
     * 快进时间
     * @param {number} ms - 毫秒数
     */
    advance(ms) {
      vi.advanceTimersByTime(ms);
    },

    /**
     * 快进到下一个定时器
     */
    async next() {
      await vi.runOnlyPendingTimersAsync();
    },

    /**
     * 运行所有定时器
     */
    async runAll() {
      await vi.runAllTimersAsync();
    },

    /**
     * 清理定时器
     */
    clear() {
      vi.clearAllTimers();
    },
  };
}

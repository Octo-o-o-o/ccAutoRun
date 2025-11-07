/**
 * 文件系统 Mock 和测试工具
 * 使用真实的临时目录（避免 mock-fs 库的兼容性问题）
 */

import { mkdtemp, rm, mkdir, writeFile, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

/**
 * 创建临时测试目录
 * @returns {Promise<string>} 临时目录路径
 */
export async function createTempDir() {
  const prefix = join(tmpdir(), 'ccautorun-test-');
  const tempDir = await mkdtemp(prefix);
  return tempDir;
}

/**
 * 清理临时测试目录
 * @param {string} tempDir - 临时目录路径
 */
export async function cleanupTempDir(tempDir) {
  if (existsSync(tempDir)) {
    await rm(tempDir, { recursive: true, force: true });
  }
}

/**
 * 在临时目录中创建文件结构
 * @param {string} baseDir - 基础目录
 * @param {Object} files - 文件路径到内容的映射
 * @example
 * await createFileStructure(tempDir, {
 *   'config.json': '{"key": "value"}',
 *   'src/index.js': 'console.log("hello")',
 * });
 */
export async function createFileStructure(baseDir, files) {
  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = join(baseDir, filePath);
    const dir = fullPath.substring(0, fullPath.lastIndexOf('/'));

    // 创建目录（如果不存在）
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    // 写入文件
    await writeFile(fullPath, content, 'utf-8');
  }
}

/**
 * 读取文件内容
 * @param {string} filePath - 文件路径
 * @returns {Promise<string>} 文件内容
 */
export async function readFileContent(filePath) {
  return await readFile(filePath, 'utf-8');
}

/**
 * 检查文件是否存在
 * @param {string} filePath - 文件路径
 * @returns {boolean} 是否存在
 */
export function fileExists(filePath) {
  return existsSync(filePath);
}

/**
 * 创建完整的 ccAutoRun 项目结构
 * @param {string} baseDir - 基础目录
 * @returns {Promise<Object>} 创建的目录路径
 */
export async function createCCAutoRunStructure(baseDir) {
  const dirs = {
    root: baseDir,
    ccautorun: join(baseDir, '.ccautorun'),
    plans: join(baseDir, '.ccautorun/plans'),
    sessions: join(baseDir, '.ccautorun/sessions'),
    snapshots: join(baseDir, '.ccautorun/snapshots'),
    logs: join(baseDir, '.ccautorun/logs'),
    claude: join(baseDir, '.claude'),
    claudeHooks: join(baseDir, '.claude/hooks'),
    claudeCommands: join(baseDir, '.claude/commands'),
  };

  // 创建所有目录
  for (const dir of Object.values(dirs)) {
    await mkdir(dir, { recursive: true });
  }

  // 创建基础配置文件
  await writeFile(
    join(dirs.ccautorun, 'config.yaml'),
    `# ccAutoRun Configuration
version: 1.0.0
defaults:
  auto_continue: true
  safety_limit: 10
`,
    'utf-8'
  );

  return dirs;
}

/**
 * 创建测试计划目录
 * @param {string} baseDir - 基础目录
 * @param {string} planId - 计划 ID
 * @param {string} architecture - 架构类型 ('split' 或 'single')
 * @returns {Promise<string>} 计划目录路径
 */
export async function createTestPlan(baseDir, planId, architecture = 'split') {
  const planDir = join(baseDir, '.ccautorun/plans', planId);
  await mkdir(planDir, { recursive: true });

  if (architecture === 'split') {
    // 创建拆分架构的目录结构
    await mkdir(join(planDir, 'docs/stages'), { recursive: true });
  }

  return planDir;
}

/**
 * 创建测试 Session
 * @param {string} baseDir - 基础目录
 * @param {string} sessionId - Session ID
 * @param {Object} data - Session 数据
 * @returns {Promise<string>} Session 文件路径
 */
export async function createTestSession(baseDir, sessionId, data) {
  const sessionDir = join(baseDir, '.ccautorun/sessions');
  await mkdir(sessionDir, { recursive: true });

  const sessionFile = join(sessionDir, `${sessionId}.jsonl`);

  // 写入 Session 数据（JSONL 格式）
  const lines = Array.isArray(data) ? data : [data];
  const content = lines.map(line => JSON.stringify(line)).join('\n') + '\n';

  await writeFile(sessionFile, content, 'utf-8');

  return sessionFile;
}

/**
 * 等待文件创建（用于测试异步文件操作）
 * @param {string} filePath - 文件路径
 * @param {number} timeout - 超时时间（毫秒）
 * @param {number} interval - 检查间隔（毫秒）
 * @returns {Promise<boolean>} 文件是否在超时前创建
 */
export async function waitForFile(filePath, timeout = 5000, interval = 100) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (existsSync(filePath)) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  return false;
}

/**
 * 测试套件辅助类
 * 自动管理测试目录的创建和清理
 */
export class TestFileSystem {
  constructor() {
    this.tempDir = null;
    this.dirs = null;
  }

  /**
   * 初始化测试文件系统
   */
  async setup() {
    this.tempDir = await createTempDir();
    this.dirs = await createCCAutoRunStructure(this.tempDir);
    return this.tempDir;
  }

  /**
   * 清理测试文件系统
   */
  async teardown() {
    if (this.tempDir) {
      await cleanupTempDir(this.tempDir);
      this.tempDir = null;
      this.dirs = null;
    }
  }

  /**
   * 获取目录路径
   * @param {string} name - 目录名称
   * @returns {string} 目录路径
   */
  getDir(name) {
    return this.dirs?.[name] || this.tempDir;
  }

  /**
   * 创建文件
   * @param {string} relativePath - 相对路径
   * @param {string} content - 文件内容
   */
  async writeFile(relativePath, content) {
    const fullPath = join(this.tempDir, relativePath);
    const dir = fullPath.substring(0, fullPath.lastIndexOf('/'));

    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    await writeFile(fullPath, content, 'utf-8');
  }

  /**
   * 读取文件
   * @param {string} relativePath - 相对路径
   * @returns {Promise<string>} 文件内容
   */
  async readFile(relativePath) {
    const fullPath = join(this.tempDir, relativePath);
    return await readFile(fullPath, 'utf-8');
  }

  /**
   * 检查文件是否存在
   * @param {string} relativePath - 相对路径
   * @returns {boolean} 是否存在
   */
  exists(relativePath) {
    const fullPath = join(this.tempDir, relativePath);
    return existsSync(fullPath);
  }
}

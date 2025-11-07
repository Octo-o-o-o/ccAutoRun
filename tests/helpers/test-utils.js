/**
 * 通用测试工具函数
 */

import { expect } from 'vitest';

/**
 * 断言函数抛出特定错误
 * @param {Function} fn - 要测试的函数
 * @param {string} expectedError - 期望的错误消息（部分匹配）
 */
export async function expectToThrow(fn, expectedError) {
  let error = null;

  try {
    await fn();
  } catch (e) {
    error = e;
  }

  expect(error).not.toBeNull();
  if (expectedError) {
    expect(error.message).toContain(expectedError);
  }
}

/**
 * 断言对象包含指定属性
 * @param {Object} obj - 要测试的对象
 * @param {string[]} props - 期望的属性列表
 */
export function expectToHaveProperties(obj, props) {
  for (const prop of props) {
    expect(obj).toHaveProperty(prop);
  }
}

/**
 * 断言数组包含特定项（部分匹配）
 * @param {Array} array - 数组
 * @param {Object} item - 期望包含的项（部分属性）
 */
export function expectArrayToContain(array, item) {
  const found = array.some(arrItem =>
    Object.entries(item).every(([key, value]) => arrItem[key] === value)
  );
  expect(found).toBe(true);
}

/**
 * 等待条件满足
 * @param {Function} condition - 条件函数
 * @param {number} timeout - 超时时间（毫秒）
 * @param {number} interval - 检查间隔（毫秒）
 * @returns {Promise<boolean>} 是否在超时前满足条件
 */
export async function waitFor(condition, timeout = 5000, interval = 100) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  return false;
}

/**
 * 延迟执行
 * @param {number} ms - 毫秒数
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 捕获 console 输出
 * @returns {Object} Console spy 对象
 */
export function captureConsole() {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  const logs = [];
  const errors = [];
  const warnings = [];

  console.log = (...args) => {
    logs.push(args.join(' '));
  };

  console.error = (...args) => {
    errors.push(args.join(' '));
  };

  console.warn = (...args) => {
    warnings.push(args.join(' '));
  };

  return {
    logs,
    errors,
    warnings,

    /**
     * 恢复原始 console
     */
    restore() {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    },

    /**
     * 清空记录
     */
    clear() {
      logs.length = 0;
      errors.length = 0;
      warnings.length = 0;
    },
  };
}

/**
 * 创建 Mock 函数（简化的 spy）
 * @returns {Object} Mock 函数对象
 */
export function createMockFunction() {
  const calls = [];
  const mockFn = function (...args) {
    calls.push(args);
    return mockFn.mockReturnValue;
  };

  mockFn.calls = calls;
  mockFn.mockReturnValue = undefined;

  mockFn.mockImplementation = (fn) => {
    mockFn.mockReturnValue = fn;
    return mockFn;
  };

  mockFn.reset = () => {
    calls.length = 0;
  };

  return mockFn;
}

/**
 * 断言文件内容包含指定字符串
 * @param {string} content - 文件内容
 * @param {string} expected - 期望的字符串
 */
export function expectContentToContain(content, expected) {
  expect(content).toContain(expected);
}

/**
 * 断言文件内容匹配正则表达式
 * @param {string} content - 文件内容
 * @param {RegExp} pattern - 正则表达式
 */
export function expectContentToMatch(content, pattern) {
  expect(content).toMatch(pattern);
}

/**
 * 断言配置对象有效
 * @param {Object} config - 配置对象
 */
export function expectValidConfig(config) {
  expectToHaveProperties(config, [
    'stages',
    'current',
    'auto_continue',
    'safety_limit',
    'architecture',
  ]);

  expect(typeof config.stages).toBe('number');
  expect(typeof config.current).toBe('number');
  expect(typeof config.auto_continue).toBe('boolean');
  expect(typeof config.safety_limit).toBe('number');
  expect(['split', 'single']).toContain(config.architecture);
}

/**
 * 断言 Session 对象有效
 * @param {Object} session - Session 对象
 */
export function expectValidSession(session) {
  expectToHaveProperties(session, [
    'id',
    'planId',
    'stage',
    'status',
    'startedAt',
    'updatedAt',
    'executionCount',
  ]);

  expect(typeof session.id).toBe('string');
  expect(typeof session.planId).toBe('string');
  expect(typeof session.stage).toBe('number');
  expect(['active', 'paused', 'completed', 'failed']).toContain(session.status);
  expect(typeof session.executionCount).toBe('number');
}

/**
 * 断言计划元数据有效
 * @param {Object} metadata - 计划元数据
 */
export function expectValidMetadata(metadata) {
  expectToHaveProperties(metadata, [
    'id',
    'name',
    'status',
    'architecture',
    'currentStage',
    'totalStages',
    'createdAt',
    'updatedAt',
  ]);

  expect(typeof metadata.id).toBe('string');
  expect(typeof metadata.name).toBe('string');
  expect(['planning', 'running', 'paused', 'completed', 'failed']).toContain(metadata.status);
  expect(['split', 'single']).toContain(metadata.architecture);
  expect(typeof metadata.currentStage).toBe('number');
  expect(typeof metadata.totalStages).toBe('number');
}

/**
 * 生成随机字符串
 * @param {number} length - 长度
 * @returns {string} 随机字符串
 */
export function randomString(length = 10) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 生成测试用的计划 ID
 * @returns {string} 计划 ID（时间戳格式）
 */
export function generatePlanId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}-${hour}${minute}${second}`;
}

/**
 * 生成测试用的 Session ID
 * @returns {string} Session ID
 */
export function generateSessionId() {
  return `test-session-${randomString(8)}`;
}

/**
 * 规范化路径（转换为 Unix 风格）
 * @param {string} path - 路径
 * @returns {string} 规范化后的路径
 */
export function normalizePath(path) {
  return path.replace(/\\/g, '/');
}

/**
 * Mock 环境变量
 * @param {Object} env - 环境变量对象
 * @returns {Function} 恢复函数
 */
export function mockEnv(env) {
  const original = {};

  for (const [key, value] of Object.entries(env)) {
    original[key] = process.env[key];
    process.env[key] = value;
  }

  return function restore() {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  };
}

/**
 * 断言错误码
 * @param {Error} error - 错误对象
 * @param {string} expectedCode - 期望的错误码
 */
export function expectErrorCode(error, expectedCode) {
  expect(error).toHaveProperty('code');
  expect(error.code).toBe(expectedCode);
}

/**
 * 创建测试超时工具
 * @param {number} ms - 超时时间
 * @returns {Promise} 超时 Promise
 */
export function timeout(ms) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
  });
}

/**
 * 带超时的 Promise
 * @param {Promise} promise - 原始 Promise
 * @param {number} ms - 超时时间
 * @returns {Promise} 带超时的 Promise
 */
export function withTimeout(promise, ms) {
  return Promise.race([promise, timeout(ms)]);
}

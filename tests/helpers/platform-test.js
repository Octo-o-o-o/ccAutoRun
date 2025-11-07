/**
 * 跨平台测试辅助工具
 * 支持 macOS, Windows, Linux 平台的测试
 */

import { platform } from 'os';
import { join } from 'path';

/**
 * 获取当前平台
 * @returns {string} 'darwin' | 'win32' | 'linux'
 */
export function getPlatform() {
  return platform();
}

/**
 * 判断是否为 macOS
 * @returns {boolean}
 */
export function isMacOS() {
  return platform() === 'darwin';
}

/**
 * 判断是否为 Windows
 * @returns {boolean}
 */
export function isWindows() {
  return platform() === 'win32';
}

/**
 * 判断是否为 Linux
 * @returns {boolean}
 */
export function isLinux() {
  return platform() === 'linux';
}

/**
 * 在指定平台上运行测试
 * @param {string} targetPlatform - 目标平台 ('darwin' | 'win32' | 'linux')
 * @param {Function} testFn - 测试函数
 * @returns {Function} vitest 测试函数
 */
export function runOnPlatform(targetPlatform, testFn) {
  return platform() === targetPlatform ? testFn : testFn.skip;
}

/**
 * 在非指定平台上运行测试
 * @param {string} excludePlatform - 排除的平台
 * @param {Function} testFn - 测试函数
 * @returns {Function} vitest 测试函数
 */
export function runExceptPlatform(excludePlatform, testFn) {
  return platform() !== excludePlatform ? testFn : testFn.skip;
}

/**
 * 在多个平台上运行测试
 * @param {string[]} platforms - 平台列表
 * @param {Function} testFn - 测试函数
 * @returns {Function} vitest 测试函数
 */
export function runOnPlatforms(platforms, testFn) {
  return platforms.includes(platform()) ? testFn : testFn.skip;
}

/**
 * 获取平台特定的路径分隔符
 * @returns {string} '/' 或 '\\'
 */
export function getPlatformSeparator() {
  return isWindows() ? '\\' : '/';
}

/**
 * 规范化路径为平台特定格式
 * @param {string} path - 路径
 * @returns {string} 规范化后的路径
 */
export function toPlatformPath(path) {
  if (isWindows()) {
    return path.replace(/\//g, '\\');
  }
  return path.replace(/\\/g, '/');
}

/**
 * 规范化路径为 Unix 格式（用于测试对比）
 * @param {string} path - 路径
 * @returns {string} Unix 格式路径
 */
export function toUnixPath(path) {
  return path.replace(/\\/g, '/');
}

/**
 * 获取平台特定的可执行文件扩展名
 * @returns {string} '.exe' 或 ''
 */
export function getExecutableExtension() {
  return isWindows() ? '.exe' : '';
}

/**
 * 获取平台特定的 Shell 命令
 * @param {string} command - 命令
 * @returns {string} 平台特定的命令
 */
export function getPlatformCommand(command) {
  if (isWindows()) {
    // Windows 使用 PowerShell 或 cmd.exe
    const windowsCommands = {
      'ls': 'dir',
      'cat': 'type',
      'rm': 'del',
      'cp': 'copy',
      'mv': 'move',
      'clear': 'cls',
    };
    return windowsCommands[command] || command;
  }
  return command;
}

/**
 * 获取平台特定的通知系统名称
 * @returns {string} 通知系统名称
 */
export function getNotificationSystem() {
  if (isMacOS()) {
    return 'macOS Notification Center';
  } else if (isWindows()) {
    return 'Windows Toast Notifications';
  } else if (isLinux()) {
    return 'libnotify';
  }
  return 'Unknown';
}

/**
 * 模拟平台 API
 * @param {string} targetPlatform - 目标平台
 * @returns {Object} Mock 对象和恢复函数
 */
export function mockPlatformAPIs(targetPlatform) {
  const originalPlatform = platform();

  // 存储原始的 process.platform
  const platformDescriptor = Object.getOwnPropertyDescriptor(process, 'platform');

  // 覆盖 process.platform
  Object.defineProperty(process, 'platform', {
    value: targetPlatform,
    writable: true,
    configurable: true,
  });

  return {
    /**
     * 恢复原始平台
     */
    restore() {
      if (platformDescriptor) {
        Object.defineProperty(process, 'platform', platformDescriptor);
      }
    },

    /**
     * 获取当前 mock 的平台
     */
    getCurrentPlatform() {
      return targetPlatform;
    },
  };
}

/**
 * 获取平台特定的测试数据
 * @returns {Object} 测试数据对象
 */
export function getPlatformTestData() {
  const commonData = {
    projectPath: join(process.cwd(), 'test-project'),
    configPath: '.ccautorun/config.yaml',
    planId: '20250107-143022',
  };

  if (isWindows()) {
    return {
      ...commonData,
      homeDir: 'C:\\Users\\TestUser',
      tempDir: 'C:\\Temp',
      separator: '\\',
      executableExt: '.exe',
      shell: 'PowerShell',
    };
  } else if (isMacOS()) {
    return {
      ...commonData,
      homeDir: '/Users/testuser',
      tempDir: '/tmp',
      separator: '/',
      executableExt: '',
      shell: 'bash',
    };
  } else {
    // Linux
    return {
      ...commonData,
      homeDir: '/home/testuser',
      tempDir: '/tmp',
      separator: '/',
      executableExt: '',
      shell: 'bash',
    };
  }
}

/**
 * 创建跨平台路径测试用例
 * @param {string} unixPath - Unix 风格路径
 * @returns {Object} 平台特定的路径
 */
export function createPlatformPathTest(unixPath) {
  return {
    unix: unixPath,
    windows: unixPath.replace(/\//g, '\\'),
    current: toPlatformPath(unixPath),
  };
}

/**
 * 检查平台是否支持特定功能
 * @param {string} feature - 功能名称
 * @returns {boolean} 是否支持
 */
export function isPlatformFeatureSupported(feature) {
  const featureSupport = {
    symlinks: !isWindows(), // Windows 需要管理员权限
    colorTerminal: !isWindows(), // Windows cmd.exe 对颜色支持有限
    fsEvents: isMacOS(), // macOS 的 FSEvents
    inotify: isLinux(), // Linux 的 inotify
    windowsToast: isWindows(),
    macNotificationCenter: isMacOS(),
    libnotify: isLinux(),
  };

  return featureSupport[feature] ?? false;
}

/**
 * 跳过不支持的平台
 * @param {string[]} unsupportedPlatforms - 不支持的平台列表
 * @returns {boolean} 是否应该跳过测试
 */
export function shouldSkipOnPlatform(unsupportedPlatforms) {
  return unsupportedPlatforms.includes(platform());
}

/**
 * 获取平台特定的错误消息
 * @param {string} errorType - 错误类型
 * @returns {string} 错误消息
 */
export function getPlatformErrorMessage(errorType) {
  const errorMessages = {
    fileNotFound: {
      darwin: 'No such file or directory',
      linux: 'No such file or directory',
      win32: 'The system cannot find the file specified',
    },
    permissionDenied: {
      darwin: 'Permission denied',
      linux: 'Permission denied',
      win32: 'Access is denied',
    },
    pathTooLong: {
      darwin: 'File name too long',
      linux: 'File name too long',
      win32: 'The specified path is too long',
    },
  };

  return errorMessages[errorType]?.[platform()] || 'Unknown error';
}

/**
 * 创建平台测试环境
 * @param {Object} options - 选项
 * @returns {Object} 测试环境对象
 */
export function createPlatformTestEnv(options = {}) {
  const env = {
    platform: platform(),
    isMacOS: isMacOS(),
    isWindows: isWindows(),
    isLinux: isLinux(),
    separator: getPlatformSeparator(),
    executableExt: getExecutableExtension(),
    notificationSystem: getNotificationSystem(),
    testData: getPlatformTestData(),
    ...options,
  };

  return env;
}

/**
 * 平台测试装饰器（用于 describe 块）
 * @param {string[]} platforms - 支持的平台列表
 * @param {string} description - 测试描述
 * @param {Function} testSuite - 测试套件函数
 */
export function describePlatform(platforms, description, testSuite) {
  if (platforms.includes(platform())) {
    describe(description, testSuite);
  } else {
    describe.skip(`${description} (skipped on ${platform()})`, testSuite);
  }
}

/**
 * 条件测试装饰器
 * @param {boolean} condition - 条件
 * @param {string} description - 测试描述
 * @param {Function} testFn - 测试函数
 */
export function testIf(condition, description, testFn) {
  if (condition) {
    test(description, testFn);
  } else {
    test.skip(description, testFn);
  }
}

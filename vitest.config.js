import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  // 别名配置（根级别）
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@tests': resolve(__dirname, './tests'),
    },
  },

  test: {
    // 测试环境（Node.js）
    environment: 'node',

    // 全局测试超时时间
    testTimeout: 10000,
    hookTimeout: 10000,

    // 测试文件匹配模式
    include: ['tests/**/*.test.js'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.ccautorun/**'],

    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'src/core/**/*.js',
        'src/utils/**/*.js',
      ],
      exclude: [
        'src/cli.js',
        'src/**/*.test.js',
        'src/**/*.spec.js',
      ],
      // 覆盖率阈值（针对核心模块和工具模块）
      thresholds: {
        lines: 70,
        functions: 40,  // 工具模块部分函数将在集成测试中覆盖
        branches: 60,
        statements: 70,
      },
    },

    // 全局设置
    globals: true,

    // 并发运行
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
      },
    },

    // 重试失败的测试
    retry: 0, // 不自动重试，确保测试稳定

    // 测试隔离
    isolate: true,

    // 测试输出
    reporters: ['verbose'],

    // 监听模式配置
    watch: false,
  },
});

# Testing Guide for ccAutoRun

本文档提供 ccAutoRun 项目的完整测试指南，包括测试类型、运行方法、编写测试和最佳实践。

## 📋 目录

- [测试概览](#测试概览)
- [测试类型](#测试类型)
- [运行测试](#运行测试)
- [测试覆盖率](#测试覆盖率)
- [编写测试](#编写测试)
- [跨平台测试](#跨平台测试)
- [性能测试](#性能测试)
- [持续集成](#持续集成)
- [故障排查](#故障排查)

---

## 测试概览

ccAutoRun 使用 **Vitest** 作为测试框架，支持以下测试类型：

| 测试类型 | 目录 | 用途 |
|---------|------|------|
| **单元测试** | `tests/unit/` | 测试单个模块和函数 |
| **集成测试** | `tests/integration/` | 测试模块间交互 |
| **E2E 测试** | `tests/e2e/` | 测试完整用户场景 |
| **性能测试** | `tests/performance/` | 测试性能基准 |

### 测试统计

- **总测试数**: 95+
- **测试覆盖率**: 73%
- **平台支持**: macOS, Windows, Linux

---

## 测试类型

### 1. 单元测试 (Unit Tests)

单元测试验证单个函数和模块的正确性。

**位置**: `tests/unit/`

**示例**:
```bash
npm run test:unit
```

**覆盖模块**:
- Core 模块 (`src/core/`)
- Utils 工具 (`src/utils/`)
- Commands 命令 (`src/commands/`)

### 2. 集成测试 (Integration Tests)

集成测试验证多个模块协同工作的正确性。

**位置**: `tests/integration/`

**示例**:
```bash
npm run test:integration
```

**测试场景**:
- 计划解析和执行流程
- Hook 系统集成
- 配置管理集成

### 3. E2E 测试 (End-to-End Tests)

E2E 测试验证完整的用户工作流程。

**位置**: `tests/e2e/`

**示例**:
```bash
npm run test:e2e
```

**核心场景**:
1. **计划生命周期**: 从初始化到完成的完整流程
2. **并发计划管理**: 多个计划的创建和管理
3. **暂停/恢复**: 计划中断和恢复机制
4. **归档和清理**: 计划归档和清理流程

### 4. 性能测试 (Performance Tests)

性能测试验证系统性能指标。

**位置**: `tests/performance/`

**示例**:
```bash
npm run test:performance
```

**性能目标**:
- 初始化时间: < 5秒
- 列出 100 个计划: < 1秒
- Hook 响应时间: < 2秒
- 内存使用: < 200MB

---

## 运行测试

### 快速开始

```bash
# 安装依赖
npm install

# 运行所有测试
npm test

# 运行特定类型的测试
npm run test:unit          # 单元测试
npm run test:integration   # 集成测试
npm run test:e2e          # E2E 测试
npm run test:performance  # 性能测试

# 运行完整测试套件
npm run test:all
```

### 测试选项

```bash
# 监听模式（开发时使用）
npm run test:watch

# 生成覆盖率报告
npm run test:coverage

# 使用 UI 界面
npm run test:ui

# 运行特定测试文件
npx vitest run tests/unit/config-manager.test.js

# 运行匹配模式的测试
npx vitest run -t "should initialize"
```

### 调试测试

```bash
# 启用详细输出
npx vitest run --reporter=verbose

# 只运行失败的测试
npx vitest run --reporter=verbose --changed

# 使用 Node.js 调试器
node --inspect-brk ./node_modules/.bin/vitest run
```

---

## 测试覆盖率

### 查看覆盖率

```bash
# 生成覆盖率报告
npm run test:coverage

# 打开 HTML 报告
open coverage/index.html  # macOS
start coverage/index.html # Windows
xdg-open coverage/index.html # Linux
```

### 覆盖率目标

| 类型 | 目标 | 当前 |
|------|------|------|
| 总体覆盖率 | > 80% | 73% |
| 核心模块 | > 90% | 85% |
| CLI 命令 | > 85% | 78% |
| 工具函数 | > 95% | 92% |

### 覆盖率报告

覆盖率报告包括：
- **行覆盖率** (Line Coverage)
- **分支覆盖率** (Branch Coverage)
- **函数覆盖率** (Function Coverage)
- **语句覆盖率** (Statement Coverage)

---

## 编写测试

### 测试文件命名

```
src/core/config-manager.js  →  tests/unit/config-manager.test.js
src/commands/init.js        →  tests/unit/commands/init.test.js
```

### 单元测试示例

```javascript
import { describe, test, expect } from 'vitest';
import { ConfigManager } from '../../src/core/config-manager.js';

describe('ConfigManager', () => {
  test('should load default config', () => {
    const config = new ConfigManager();
    const defaults = config.getDefaults();

    expect(defaults).toHaveProperty('auto_continue');
    expect(defaults.auto_continue).toBe(true);
  });

  test('should merge user config with defaults', () => {
    const config = new ConfigManager();
    const merged = config.merge({ safety_limit: 20 });

    expect(merged.safety_limit).toBe(20);
    expect(merged.auto_continue).toBe(true); // 保留默认值
  });
});
```

### E2E 测试示例

```javascript
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { E2ETestEnv } from '../helpers/e2e-test.js';

describe('[E2E] Init Command', () => {
  let env;

  beforeEach(async () => {
    env = new E2ETestEnv();
    await env.setup();
  });

  afterEach(async () => {
    await env.teardown();
  });

  test('should initialize project structure', async () => {
    const cli = env.getCLI();
    const result = await cli.init({ nonInteractive: true });

    expect(result.exitCode).toBe(0);
    expect(env.getFS().exists('.ccautorun')).toBe(true);
  });
});
```

### 测试辅助工具

项目提供了丰富的测试辅助工具：

#### 1. 文件系统辅助 (`tests/helpers/mock-fs.js`)

```javascript
import { TestFileSystem } from '../helpers/mock-fs.js';

const fs = new TestFileSystem();
await fs.setup();

// 创建文件
await fs.writeFile('config.yaml', 'key: value');

// 读取文件
const content = await fs.readFile('config.yaml');

// 检查文件存在
const exists = fs.exists('config.yaml');

await fs.teardown();
```

#### 2. E2E 测试辅助 (`tests/helpers/e2e-test.js`)

```javascript
import { E2ETestEnv, CLIRunner } from '../helpers/e2e-test.js';

const env = new E2ETestEnv();
await env.setup();

const cli = env.getCLI();
const result = await cli.init({ nonInteractive: true });

await env.teardown();
```

#### 3. 跨平台测试辅助 (`tests/helpers/platform-test.js`)

```javascript
import {
  isMacOS,
  isWindows,
  runOnPlatform
} from '../helpers/platform-test.js';

// 条件测试
test.skipIf(isWindows())('should use symlinks', async () => {
  // macOS/Linux 专用测试
});

// 平台特定测试
runOnPlatform('darwin', () => {
  test('should use macOS notifications', () => {
    // macOS 专用测试
  });
});
```

#### 4. 通用测试工具 (`tests/helpers/test-utils.js`)

```javascript
import {
  waitFor,
  delay,
  expectToThrow
} from '../helpers/test-utils.js';

// 等待条件满足
await waitFor(() => fs.exists('file.txt'), 5000);

// 延迟执行
await delay(1000);

// 断言抛出错误
await expectToThrow(async () => {
  throw new Error('test error');
}, 'test error');
```

---

## 跨平台测试

### 支持的平台

- ✅ **macOS**: 12+ (Intel + Apple Silicon)
- ✅ **Windows**: 10/11 (PowerShell + cmd.exe)
- ✅ **Linux**: Ubuntu 20.04+, Debian 11+, CentOS 8+

### 平台特定测试

```javascript
import { describePlatform, testIf, isWindows } from '../helpers/platform-test.js';

// 只在特定平台运行
describePlatform(['darwin', 'linux'], 'Unix-specific tests', () => {
  test('should handle symlinks', () => {
    // Unix 平台测试
  });
});

// 条件测试
testIf(!isWindows(), 'should use Unix paths', () => {
  // 非 Windows 平台测试
});
```

### 路径处理测试

```javascript
import { toUnixPath, toPlatformPath } from '../helpers/platform-test.js';

test('should normalize paths', () => {
  const unixPath = '/Users/test/project';
  const platformPath = toPlatformPath(unixPath);

  if (isWindows()) {
    expect(platformPath).toBe('\\Users\\test\\project');
  } else {
    expect(platformPath).toBe('/Users/test/project');
  }
});
```

---

## 性能测试

### 性能基准

| 指标 | 目标 | 测试方法 |
|------|------|----------|
| Init 时间 | < 5秒 | `measureTime(cli.init)` |
| List 100 个计划 | < 1秒 | `measureTime(cli.list)` |
| Status 查询 | < 500ms | `measureTime(cli.status)` |
| Pause/Resume | < 500ms | `measureTime(cli.pause)` |
| 内存使用 | < 200MB | `process.memoryUsage()` |

### 运行性能测试

```bash
npm run test:performance
```

### 性能测试示例

```javascript
import { performance } from 'perf_hooks';

async function measureTime(fn) {
  const start = performance.now();
  await fn();
  const end = performance.now();
  return end - start;
}

test('init should complete quickly', async () => {
  const duration = await measureTime(() => cli.init());
  expect(duration).toBeLessThan(5000);
});
```

---

## 持续集成

### GitHub Actions

项目使用 GitHub Actions 进行自动化测试：

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node: [18, 20]

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node }}

      - run: npm ci
      - run: npm test
      - run: npm run test:coverage

      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

### 本地 CI 模拟

```bash
# 模拟完整的 CI 流程
npm ci                    # 清洁安装
npm run lint              # 代码检查
npm run test:all          # 运行所有测试
npm run test:coverage     # 生成覆盖率
```

---

## 故障排查

### 常见问题

#### 1. 测试超时

```bash
# 增加超时时间
npx vitest run --testTimeout=10000
```

#### 2. 文件权限错误

```bash
# 确保测试文件有执行权限
chmod +x tests/**/*.test.js
```

#### 3. 跨平台路径问题

```javascript
// 使用 path.join 而不是手动拼接
import { join } from 'path';
const filePath = join('src', 'config.js'); // ✓ 正确
const filePath = 'src/config.js';          // ✗ 错误
```

#### 4. 临时文件清理

```javascript
// 确保在 afterEach 中清理
afterEach(async () => {
  await env.teardown();
});
```

### 调试技巧

1. **使用 console.log**:
   ```javascript
   test('debug test', () => {
     const result = someFunction();
     console.log('Result:', result);
     expect(result).toBe(expected);
   });
   ```

2. **使用 debugger**:
   ```javascript
   test('debug test', () => {
     debugger; // 在此处暂停
     const result = someFunction();
   });
   ```

3. **隔离测试**:
   ```bash
   # 只运行单个测试
   npx vitest run -t "should initialize config"
   ```

### 获取帮助

- **问题追踪**: https://github.com/yourusername/ccautorun/issues
- **讨论区**: https://github.com/yourusername/ccautorun/discussions
- **文档**: https://github.com/yourusername/ccautorun/tree/main/docs

---

## 最佳实践

### 1. 测试命名

```javascript
// ✓ 好的命名
test('should return default config when no user config exists', () => {});

// ✗ 不好的命名
test('config test', () => {});
```

### 2. 测试隔离

```javascript
// ✓ 每个测试独立
beforeEach(() => {
  config = new ConfigManager();
});

// ✗ 测试间共享状态
const config = new ConfigManager(); // 不要在顶层创建
```

### 3. 断言明确

```javascript
// ✓ 明确的断言
expect(result.status).toBe('completed');
expect(result.stages).toHaveLength(5);

// ✗ 模糊的断言
expect(result).toBeTruthy();
```

### 4. 清理资源

```javascript
// ✓ 始终清理
afterEach(async () => {
  await fs.cleanup();
  await db.close();
});
```

### 5. Mock 外部依赖

```javascript
// ✓ Mock 外部服务
vi.mock('node-notifier', () => ({
  notify: vi.fn(),
}));
```

---

## 贡献测试

欢迎为 ccAutoRun 贡献测试！

### 贡献步骤

1. **Fork 项目**
2. **创建测试分支**: `git checkout -b test/new-feature`
3. **编写测试**: 遵循本文档的最佳实践
4. **运行测试**: `npm run test:all`
5. **提交 PR**: 包含测试覆盖率报告

### 测试审查清单

- [ ] 所有新代码都有对应的测试
- [ ] 测试覆盖率 > 80%
- [ ] 所有测试通过
- [ ] 跨平台测试通过
- [ ] 性能测试达标
- [ ] 文档更新

---

## 附录

### 测试工具链

- **Vitest**: 测试框架
- **@vitest/ui**: 测试 UI 界面
- **@vitest/coverage-v8**: 覆盖率工具

### 相关文档

- [Vitest 文档](https://vitest.dev/)
- [Node.js 测试最佳实践](https://github.com/goldbergyoni/nodebestpractices#5-testing-and-overall-quality-practices)

---

最后更新: 2025-01-07

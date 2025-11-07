# 错误处理规范

## 📋 概述

统一的错误处理规范确保 ccAutoRun 提供清晰、一致、可操作的错误信息，帮助用户快速诊断和解决问题。

---

## 🎯 设计原则

### 1. 清晰性（Clarity）
- 错误消息用简单的语言描述问题
- 避免技术术语和堆栈跟踪（除非 --debug 模式）
- 指明具体的文件、命令或配置项

### 2. 可操作性（Actionability）
- 每个错误必须包含至少一条修复建议
- 提供具体的命令或步骤
- 链接到相关文档

### 3. 一致性（Consistency）
- 统一的错误码系统
- 统一的错误消息格式
- 统一的错误处理流程

### 4. 可追溯性（Traceability）
- 所有错误记录到日志
- 包含时间戳和上下文信息
- 支持错误搜索和查询

---

## 🔢 错误码系统

### 错误码格式
```
E_<CATEGORY>_<NUMBER>
```
- `E_`: 错误前缀（固定）
- `CATEGORY`: 错误类别（见下表）
- `NUMBER`: 3位数字（001-999）

### 错误类别

| 类别代码 | 含义 | 错误码范围 | 示例 |
|---------|------|-----------|------|
| `CLI` | CLI 参数和使用错误 | E_CLI_001 - E_CLI_099 | 缺少必需参数 |
| `CONFIG` | 配置文件错误 | E_CONFIG_001 - E_CONFIG_099 | 配置格式无效 |
| `GIT` | Git 相关错误 | E_GIT_001 - E_GIT_099 | 未提交的更改 |
| `PLAN` | 计划文档错误 | E_PLAN_001 - E_PLAN_099 | 计划文件不存在 |
| `SESSION` | 会话管理错误 | E_SESSION_001 - E_SESSION_099 | 会话状态损坏 |
| `HOOK` | Hook 执行错误 | E_HOOK_001 - E_HOOK_099 | Hook 超时 |
| `SANDBOX` | 沙箱安全错误 | E_SANDBOX_001 - E_SANDBOX_099 | 路径访问被拒绝 |
| `ENV` | 环境检查错误 | E_ENV_001 - E_ENV_099 | Node.js 版本过低 |
| `NETWORK` | 网络相关错误 | E_NETWORK_001 - E_NETWORK_099 | 版本检查失败 |
| `FS` | 文件系统错误 | E_FS_001 - E_FS_099 | 权限不足 |
| `INTERNAL` | 内部错误（Bug） | E_INTERNAL_001 - E_INTERNAL_999 | 未预期的异常 |

---

## 📝 错误码定义

### CLI 错误 (E_CLI_XXX)

```javascript
// src/utils/error-codes.js
export const ERROR_CODES = {
  // CLI 参数错误
  E_CLI_001: {
    message: 'Missing required argument: {arg}',
    category: 'user',
    suggestions: [
      'Check command usage: ccautorun {command} --help',
      'Provide the required argument: {arg}'
    ]
  },

  E_CLI_002: {
    message: 'Invalid command: {command}',
    category: 'user',
    suggestions: [
      'Run "ccautorun --help" to see available commands',
      'Did you mean: {suggestion}?'
    ]
  },

  E_CLI_003: {
    message: 'Invalid option value: {option} = {value}',
    category: 'user',
    suggestions: [
      'Check valid values for {option}: {validValues}',
      'See: ccautorun {command} --help'
    ]
  },

  // ... 更多 CLI 错误
};
```

### 配置错误 (E_CONFIG_XXX)

```javascript
E_CONFIG_001: {
  message: 'Configuration file not found: {path}',
  category: 'user',
  suggestions: [
    'Run "ccautorun init" to create a new configuration',
    'Check if you are in the correct directory'
  ]
},

E_CONFIG_002: {
  message: 'Invalid configuration format: {details}',
  category: 'user',
  suggestions: [
    'Run "ccautorun config --validate" to check configuration',
    'See: https://docs.ccautorun.com/config-reference',
    'Reset to default: ccautorun config --reset'
  ]
},

E_CONFIG_003: {
  message: 'Configuration version mismatch: expected {expected}, got {actual}',
  category: 'user',
  suggestions: [
    'Run "ccautorun config --migrate" to upgrade configuration',
    'Backup your config and run: ccautorun init --force'
  ]
},
```

### Git 错误 (E_GIT_XXX)

```javascript
E_GIT_001: {
  message: 'Not a git repository',
  category: 'user',
  suggestions: [
    'Initialize a git repository: git init',
    'Or disable git checks: ccautorun run --no-git-check'
  ]
},

E_GIT_002: {
  message: 'You have uncommitted changes',
  category: 'user',
  suggestions: [
    'Commit your changes: git add . && git commit -m "WIP"',
    'Stash your changes: git stash',
    'Or bypass check: ccautorun run --allow-dirty'
  ]
},

E_GIT_003: {
  message: 'Sensitive file detected in staging area: {file}',
  category: 'security',
  suggestions: [
    'Remove from staging: git reset {file}',
    'Add to .gitignore: echo "{file}" >> .gitignore'
  ]
},

E_GIT_004: {
  message: 'Git conflict detected in: {files}',
  category: 'user',
  suggestions: [
    'Resolve conflicts manually in the listed files',
    'Then: git add <resolved-files>',
    'Resume task: ccautorun resume {taskName}'
  ]
},
```

### 计划文档错误 (E_PLAN_XXX)

```javascript
E_PLAN_001: {
  message: 'Plan file not found: {path}',
  category: 'user',
  suggestions: [
    'Check if the task name is correct: ccautorun list',
    'Generate a new plan: claude "/plan <description>"'
  ]
},

E_PLAN_002: {
  message: 'Invalid plan format: missing required field "{field}"',
  category: 'user',
  suggestions: [
    'Run validation: ccautorun validate {taskName}',
    'Regenerate plan: claude "/plan regenerate {taskName}"',
    'See: https://docs.ccautorun.com/plan-format'
  ]
},

E_PLAN_003: {
  message: 'Stage file not found: {file}',
  category: 'user',
  suggestions: [
    'Check stage files: ls {planDir}/stages/',
    'Ensure stage files follow naming convention: 01-name.md',
    'Run doctor: ccautorun doctor {taskName}'
  ]
},

E_PLAN_004: {
  message: 'Multiple stage files matched: {files}',
  category: 'user',
  suggestions: [
    'Remove backup/old files from stages/ directory',
    'Only keep files matching pattern: NN-name.md (e.g., 01-setup.md)',
    'Clean up: rm {planDir}/stages/*backup* {planDir}/stages/*old*'
  ]
},
```

### 会话错误 (E_SESSION_XXX)

```javascript
E_SESSION_001: {
  message: 'Session file corrupted: {path}',
  category: 'system',
  suggestions: [
    'Run recovery: ccautorun recover {taskName}',
    'Or reset session: ccautorun reset {taskName}',
    'If problem persists: rm {path} && ccautorun run {taskName}'
  ]
},

E_SESSION_002: {
  message: 'Session limit reached: {count}/{limit}',
  category: 'safety',
  suggestions: [
    'Reset count: ccautorun reset {taskName}',
    'Increase limit: ccautorun config --set safety_limit {newLimit}',
    'Or disable: ccautorun config --set safety_limit unlimited'
  ]
},

E_SESSION_003: {
  message: 'Task is in failed state: {reason}',
  category: 'user',
  suggestions: [
    'Retry current stage: ccautorun retry {taskName}',
    'Skip failed stage: ccautorun skip {taskName} {stageNumber}',
    'Rollback to previous stage: ccautorun rollback {taskName}',
    'Full recovery: ccautorun recover {taskName}'
  ]
},
```

### Hook 错误 (E_HOOK_XXX)

```javascript
E_HOOK_001: {
  message: 'Hook timeout after {timeout}s',
  category: 'system',
  suggestions: [
    'Check hook logs: ccautorun logs {taskName}',
    'Manually trigger next stage: ccautorun trigger {taskName}',
    'Increase timeout: ccautorun config --set hook_timeout {seconds}'
  ]
},

E_HOOK_002: {
  message: 'Stage completion marker not detected',
  category: 'user',
  suggestions: [
    'Ensure AI outputs [STAGE_COMPLETE:N] marker',
    'Or create marker file: touch .ccautorun/sessions/{taskName}.stage-complete',
    'Manually trigger: ccautorun trigger {taskName}'
  ]
},

E_HOOK_003: {
  message: 'Failed to update progress in plan file: {reason}',
  category: 'system',
  suggestions: [
    'Check file permissions: ls -l {planFile}',
    'Ensure plan file format is correct: ccautorun validate {taskName}',
    'Run doctor: ccautorun doctor {taskName}',
    'Manual recovery: ccautorun recover {taskName}'
  ]
},
```

### 沙箱错误 (E_SANDBOX_XXX)

```javascript
E_SANDBOX_001: {
  message: 'Path outside project directory: {path}',
  category: 'security',
  suggestions: [
    'Use relative paths within project',
    'Or bypass check: ccautorun run --dangerously-skip-permissions',
    'Add to allowed paths: ccautorun config --set security.allowed_paths [..., "{path}"]'
  ]
},

E_SANDBOX_002: {
  message: 'Access to system directory blocked: {path}',
  category: 'security',
  suggestions: [
    'System directories are protected for security',
    'Use --dangerously-skip-permissions only if you know what you are doing'
  ]
},

E_SANDBOX_003: {
  message: 'Dangerous command blocked: {command}',
  category: 'security',
  suggestions: [
    'Execute manually if needed: {command}',
    'Or bypass check: ccautorun run --dangerously-skip-permissions'
  ]
},

E_SANDBOX_004: {
  message: 'Command not in whitelist: {command}',
  category: 'security',
  suggestions: [
    'Add to whitelist: ccautorun config --set security.allowed_commands [..., "{command}"]',
    'Or bypass check: ccautorun run --dangerously-skip-permissions'
  ]
},
```

### 环境错误 (E_ENV_XXX)

```javascript
E_ENV_001: {
  message: 'Node.js version too old: {version} (required: >= {required})',
  category: 'user',
  suggestions: [
    'Upgrade Node.js: https://nodejs.org/en/download/',
    'Or use nvm: nvm install 20 && nvm use 20',
    'Check current version: node --version'
  ]
},

E_ENV_002: {
  message: 'Claude CLI not found',
  category: 'user',
  suggestions: [
    'Install Claude CLI: https://docs.anthropic.com/claude/docs/cli',
    'Check if installed: which claude',
    'Add to PATH if already installed'
  ]
},

E_ENV_003: {
  message: 'Claude CLI version too old: {version} (required: >= {required})',
  category: 'user',
  suggestions: [
    'Upgrade Claude CLI: follow instructions at https://...',
    'Check current version: claude --version'
  ]
},

E_ENV_004: {
  message: 'Claude Code hooks not enabled',
  category: 'user',
  suggestions: [
    'Run setup: ccautorun init --enable-hooks',
    'Manually enable in .claude/hooks.yaml',
    'See: https://docs.ccautorun.com/hooks-setup'
  ]
},
```

---

## 🏗️ 错误处理基础设施

### ErrorHandler 类

```javascript
// src/utils/error-handler.js
import { ERROR_CODES } from './error-codes.js';
import chalk from 'chalk';
import logger from './logger.js';

export class CCAutoRunError extends Error {
  constructor(code, context = {}) {
    const errorDef = ERROR_CODES[code];
    if (!errorDef) {
      super(`Unknown error code: ${code}`);
      this.code = 'E_INTERNAL_001';
      this.category = 'internal';
      return;
    }

    // 插值替换消息中的 {placeholder}
    let message = errorDef.message;
    for (const [key, value] of Object.entries(context)) {
      message = message.replace(`{${key}}`, value);
    }

    super(message);
    this.name = 'CCAutoRunError';
    this.code = code;
    this.category = errorDef.category;
    this.suggestions = errorDef.suggestions.map(s => {
      // 同样替换建议中的占位符
      let suggestion = s;
      for (const [key, value] of Object.entries(context)) {
        suggestion = suggestion.replace(`{${key}}`, value);
      }
      return suggestion;
    });
    this.context = context;
    this.timestamp = new Date().toISOString();
  }

  /**
   * 格式化输出（用户友好）
   */
  format() {
    const lines = [
      '',
      chalk.red.bold(`✗ Error: ${this.message}`),
      chalk.gray(`  Code: ${this.code}`),
      ''
    ];

    if (this.suggestions.length > 0) {
      lines.push(chalk.yellow.bold('  Suggestions:'));
      this.suggestions.forEach((suggestion, i) => {
        lines.push(chalk.yellow(`    ${i + 1}. ${suggestion}`));
      });
      lines.push('');
    }

    // 添加快速帮助链接
    lines.push(chalk.cyan(`  Learn more: ccautorun help ${this.code}`));
    lines.push('');

    return lines.join('\n');
  }

  /**
   * 记录到日志（详细信息）
   */
  logToFile() {
    logger.error({
      code: this.code,
      message: this.message,
      category: this.category,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack
    });
  }
}

/**
 * 全局错误处理器
 */
export function handleError(error) {
  if (error instanceof CCAutoRunError) {
    // ccAutoRun 错误：格式化输出
    console.error(error.format());
    error.logToFile();
    process.exit(1);
  } else {
    // 未预期的错误：完整堆栈
    console.error(chalk.red.bold('\n✗ Unexpected error:\n'));
    console.error(error);
    logger.error({
      code: 'E_INTERNAL_999',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    console.error(chalk.yellow('\nThis is likely a bug. Please report it at:'));
    console.error(chalk.cyan('https://github.com/yourusername/ccAutoRun/issues\n'));
    process.exit(1);
  }
}

/**
 * 便捷函数：抛出错误
 */
export function throwError(code, context = {}) {
  throw new CCAutoRunError(code, context);
}
```

### 在命令中使用

```javascript
// src/commands/status.js
import { throwError } from '../utils/error-handler.js';
import path from 'path';

export async function statusCommand(taskName, options) {
  const planPath = path.join('.ccautorun', 'plans', taskName, 'README.md');

  // 检查计划是否存在
  if (!fs.existsSync(planPath)) {
    throwError('E_PLAN_001', { path: planPath });
  }

  // 检查会话状态
  const session = sessionManager.read(taskName);
  if (!session) {
    throwError('E_SESSION_001', { path: `.../${taskName}.json` });
  }

  // ... 其他逻辑
}
```

### 在 CLI 顶层捕获

```javascript
// bin/ccautorun.js
#!/usr/bin/env node

import { program } from '../src/cli.js';
import { handleError } from '../src/utils/error-handler.js';

// 全局错误捕获
process.on('uncaughtException', handleError);
process.on('unhandledRejection', handleError);

try {
  await program.parseAsync(process.argv);
} catch (error) {
  handleError(error);
}
```

---

## 📚 错误帮助系统

### 实现 `ccautorun help <error-code>` 命令

```javascript
// src/commands/help-error.js
import { ERROR_CODES } from '../utils/error-codes.js';
import chalk from 'chalk';

export function helpErrorCommand(errorCode) {
  const errorDef = ERROR_CODES[errorCode];

  if (!errorDef) {
    console.error(chalk.red(`Unknown error code: ${errorCode}`));
    console.error(chalk.yellow('Run "ccautorun help errors" to see all error codes'));
    return;
  }

  console.log('');
  console.log(chalk.bold.cyan(`Error Code: ${errorCode}`));
  console.log(chalk.bold('Category:'), errorDef.category);
  console.log('');
  console.log(chalk.bold('Message:'));
  console.log(`  ${errorDef.message}`);
  console.log('');
  console.log(chalk.bold.yellow('How to fix:'));
  errorDef.suggestions.forEach((s, i) => {
    console.log(chalk.yellow(`  ${i + 1}. ${s}`));
  });
  console.log('');

  // 相关错误码
  const relatedCodes = Object.keys(ERROR_CODES)
    .filter(code => code.startsWith(errorCode.split('_')[1]) && code !== errorCode)
    .slice(0, 3);

  if (relatedCodes.length > 0) {
    console.log(chalk.bold('Related errors:'));
    relatedCodes.forEach(code => {
      console.log(chalk.gray(`  ${code}: ${ERROR_CODES[code].message}`));
    });
    console.log('');
  }

  console.log(chalk.cyan('Documentation: https://docs.ccautorun.com/errors/' + errorCode));
  console.log('');
}
```

---

## 🧪 测试错误处理

### 单元测试

```javascript
// tests/unit/error-handler.test.js
import { describe, it, expect } from 'vitest';
import { CCAutoRunError, throwError } from '../../src/utils/error-handler.js';

describe('Error Handler', () => {
  it('should create error with correct message', () => {
    const error = new CCAutoRunError('E_CLI_001', { arg: 'task-name' });
    expect(error.message).toBe('Missing required argument: task-name');
    expect(error.code).toBe('E_CLI_001');
  });

  it('should format suggestions with context', () => {
    const error = new CCAutoRunError('E_PLAN_001', { path: '/tmp/test.md' });
    expect(error.suggestions[0]).toContain('ccautorun list');
  });

  it('should throw error with throwError()', () => {
    expect(() => throwError('E_CONFIG_001', { path: 'config.yaml' }))
      .toThrow(CCAutoRunError);
  });
});
```

---

## 📊 错误统计和监控（v2.1）

### 错误频率统计
```javascript
// src/utils/error-stats.js
export class ErrorStats {
  static record(errorCode) {
    const statsFile = '.ccautorun/logs/error-stats.json';
    const stats = fs.existsSync(statsFile)
      ? JSON.parse(fs.readFileSync(statsFile))
      : {};

    stats[errorCode] = (stats[errorCode] || 0) + 1;
    fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
  }

  static getMostFrequent(limit = 5) {
    const statsFile = '.ccautorun/logs/error-stats.json';
    if (!fs.existsSync(statsFile)) return [];

    const stats = JSON.parse(fs.readFileSync(statsFile));
    return Object.entries(stats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit);
  }
}
```

### 显示在 `ccautorun doctor` 中
```bash
$ ccautorun doctor

...

Most frequent errors:
  1. E_HOOK_002: Stage completion marker not detected (5 times)
  2. E_CONFIG_002: Invalid configuration format (3 times)
  3. E_GIT_002: You have uncommitted changes (2 times)

Run "ccautorun help E_HOOK_002" for detailed help.
```

---

## 📦 实现清单

### Stage 1
- [ ] 创建 `src/utils/error-codes.js`（完整错误码定义，500行）
- [ ] 创建 `src/utils/error-handler.js`（ErrorHandler 类，200行）

### Stage 2a
- [ ] 在所有命令中使用 `throwError()`
- [ ] 在 `bin/ccautorun.js` 中添加全局错误捕获
- [ ] 实现 `ccautorun help <error-code>` 命令

### Stage 3
- [ ] 在 Hook 中使用错误处理
- [ ] 记录 Hook 错误到日志

### Stage 5
- [ ] 实现错误统计（ErrorStats）
- [ ] 在 `doctor` 命令中显示常见错误

### Stage 5.5
- [ ] 编写错误处理单元测试

---

## 🔗 相关文档
- [Git 集成策略](git-integration.md) - Git 错误码
- [沙箱设计](sandbox-design.md) - 沙箱错误码
- [配置 Schema](config-schema.md) - 配置错误码

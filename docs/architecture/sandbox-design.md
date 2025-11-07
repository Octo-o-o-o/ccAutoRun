# 沙箱实现设计

## 📋 概述

ccAutoRun 的"沙箱"是一个**轻量级安全层**，通过应用层检查限制文件访问和命令执行，而不是真正的操作系统级沙箱。

**重要说明**：Node.js 本身不提供进程沙箱能力。我们的"沙箱"是通过代码层面的检查和限制实现的防护措施，可以防止意外操作，但无法阻止恶意代码绕过检查。

---

## 🎯 设计目标

### 主要目标
1. **防止意外破坏**：避免 AI 错误地访问系统关键目录
2. **限制危险操作**：阻止危险命令执行（如 `rm -rf /`）
3. **保护敏感信息**：防止访问敏感文件（如 SSH 密钥）
4. **可配置性**：用户可根据需要调整安全级别

### 非目标
- ❌ 不是真正的操作系统级沙箱
- ❌ 不能防御恶意代码（假设 AI 是合作的，非恶意的）
- ❌ 不提供进程隔离

---

## 🔒 两级权限模式（简化设计）

### v2.0 两级权限
| 权限级别 | 描述 | 适用场景 | 文件访问 | 命令执行 |
|---------|------|---------|---------|---------|
| **standard** | 标准模式（默认） | 日常开发任务 | 项目目录内 | 白名单命令 |
| **dangerous** | 危险模式 | 系统级操作 | 无限制 | 无限制 |

### 启用方式
```bash
# 默认：standard 模式
ccautorun run my-task

# 危险模式：跳过所有安全检查
ccautorun run my-task --dangerously-skip-permissions
```

### 配置选项
```yaml
# .ccautorun/config.yaml
security:
  default_mode: standard           # standard | dangerous
  allow_dangerous_commands: false  # 是否允许危险命令（standard 模式下）
  allowed_paths:                   # standard 模式下允许的额外路径（可选）
    - /tmp/ccautorun-temp
```

---

## 📁 文件访问控制

### Standard 模式限制

#### 允许访问
```javascript
// src/core/sandbox.js
const ALLOWED_PATHS = [
  // 1. 当前项目目录及子目录
  process.cwd(),

  // 2. .ccautorun 目录（数据存储）
  path.join(process.cwd(), '.ccautorun'),

  // 3. 系统临时目录（受限）
  os.tmpdir(),  // 但需要额外检查，避免访问 /tmp 根目录

  // 4. 用户配置的额外路径（可选）
  ...config.security?.allowed_paths || []
];
```

#### 禁止访问
```javascript
const BLOCKED_PATHS = [
  // 系统关键目录（Unix-like）
  '/etc',
  '/usr/bin',
  '/usr/sbin',
  '/bin',
  '/sbin',
  '/root',
  '/var/log',
  '/boot',

  // 系统关键目录（Windows）
  'C:\\Windows',
  'C:\\Program Files',
  'C:\\Program Files (x86)',
  'C:\\ProgramData',
  process.env.SystemRoot,

  // 用户敏感目录
  path.join(os.homedir(), '.ssh'),
  path.join(os.homedir(), '.gnupg'),
  path.join(os.homedir(), '.aws'),
  path.join(os.homedir(), '.kube'),

  // 父目录访问限制（防止 ../.. 逃逸）
  // 通过 path.resolve() 检查，不允许解析后的路径在项目外
];
```

### 实现：路径验证
```javascript
// src/core/sandbox.js
import path from 'path';
import fs from 'fs';

export class Sandbox {
  constructor(projectRoot, mode = 'standard') {
    this.projectRoot = path.resolve(projectRoot);
    this.mode = mode;
  }

  /**
   * 检查文件路径是否允许访问
   * @param {string} filePath - 待检查的文件路径
   * @returns {object} { allowed: boolean, reason?: string, code?: string }
   */
  checkFileAccess(filePath) {
    // dangerous 模式：跳过所有检查
    if (this.mode === 'dangerous') {
      return { allowed: true };
    }

    // 1. 解析为绝对路径（防止相对路径逃逸）
    const absolutePath = path.resolve(this.projectRoot, filePath);

    // 2. 检查是否在项目目录内
    if (!absolutePath.startsWith(this.projectRoot)) {
      return {
        allowed: false,
        reason: `Path outside project directory: ${absolutePath}`,
        code: 'E_SANDBOX_001',
        suggestion: 'Use --dangerously-skip-permissions to bypass this check'
      };
    }

    // 3. 检查是否在黑名单中
    for (const blocked of BLOCKED_PATHS) {
      if (absolutePath.startsWith(path.resolve(blocked))) {
        return {
          allowed: false,
          reason: `Access to system directory blocked: ${absolutePath}`,
          code: 'E_SANDBOX_002',
          suggestion: 'This path is protected for security reasons'
        };
      }
    }

    // 4. 检查敏感文件模式
    const basename = path.basename(absolutePath);
    const sensitivePatterns = [
      /^\.env/,          // .env, .env.local, etc.
      /credentials/i,    // credentials.json
      /secrets/i,        // secrets.yaml
      /\.pem$/,          // SSL 证书
      /\.key$/,          // 密钥文件
      /id_rsa/,          // SSH 密钥
      /id_ed25519/       // SSH 密钥
    ];

    for (const pattern of sensitivePatterns) {
      if (pattern.test(basename)) {
        logger.warn(`⚠️  Sensitive file detected: ${absolutePath}`);
        // 不阻止访问，只是警告（因为可能需要读取 .env 等）
        // 但会记录到审计日志
        this.auditLog('sensitive_file_access', { path: absolutePath });
      }
    }

    return { allowed: true };
  }

  /**
   * 封装的文件读取（带沙箱检查）
   */
  readFile(filePath, encoding = 'utf-8') {
    const check = this.checkFileAccess(filePath);
    if (!check.allowed) {
      throw new SandboxError(check.reason, check.code);
    }
    return fs.readFileSync(filePath, encoding);
  }

  /**
   * 封装的文件写入（带沙箱检查）
   */
  writeFile(filePath, content) {
    const check = this.checkFileAccess(filePath);
    if (!check.allowed) {
      throw new SandboxError(check.reason, check.code);
    }
    return fs.writeFileSync(filePath, content);
  }

  /**
   * 审计日志
   */
  auditLog(event, details) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      mode: this.mode,
      ...details
    };
    // 写入 .ccautorun/logs/audit.log
    fs.appendFileSync(
      path.join(this.projectRoot, '.ccautorun', 'logs', 'audit.log'),
      JSON.stringify(logEntry) + '\n'
    );
  }
}
```

---

## 🔨 命令执行控制

### Standard 模式：白名单命令

```javascript
// src/core/sandbox.js
const ALLOWED_COMMANDS = [
  // 版本控制
  'git',

  // Node.js 生态
  'node',
  'npm',
  'npx',
  'yarn',
  'pnpm',

  // 构建工具
  'make',
  'cmake',
  'cargo',
  'go',

  // 测试工具
  'jest',
  'vitest',
  'mocha',
  'pytest',

  // 代码格式化
  'prettier',
  'eslint',
  'tsc',

  // 数据库（本地开发）
  'sqlite3',
  'psql',
  'mysql',

  // 其他开发工具
  'curl',
  'wget',
  'cat',
  'grep',
  'find',
  'ls',
  'tree',
  'diff'
];

const BLOCKED_COMMANDS = [
  // 危险的删除命令
  'rm',      // 特别是 rm -rf
  'rmdir',
  'del',     // Windows
  'rd',      // Windows

  // 格式化/磁盘操作
  'format',  // Windows
  'mkfs',    // Linux
  'dd',      // 磁盘写入

  // 系统管理
  'sudo',
  'su',
  'chmod',   // 可能危险
  'chown',

  // 网络工具（可能被滥用）
  'nc',      // netcat
  'telnet',
  'ssh',     // 避免意外连接

  // 编译器（可能编译恶意代码）
  'gcc',
  'g++',
  'clang'
];
```

### 实现：命令验证
```javascript
export class Sandbox {
  /**
   * 检查命令是否允许执行
   * @param {string} command - 待执行的命令（完整命令行）
   * @returns {object} { allowed: boolean, reason?: string, code?: string }
   */
  checkCommandExecution(command) {
    // dangerous 模式：跳过检查
    if (this.mode === 'dangerous') {
      return { allowed: true };
    }

    // 1. 提取命令名称（第一个词）
    const cmdName = command.trim().split(/\s+/)[0];

    // 2. 检查是否在黑名单中
    if (BLOCKED_COMMANDS.includes(cmdName)) {
      return {
        allowed: false,
        reason: `Dangerous command blocked: ${cmdName}`,
        code: 'E_SANDBOX_003',
        suggestion: 'Use --dangerously-skip-permissions to bypass this check'
      };
    }

    // 3. 检查是否在白名单中
    if (!ALLOWED_COMMANDS.includes(cmdName)) {
      return {
        allowed: false,
        reason: `Command not in whitelist: ${cmdName}`,
        code: 'E_SANDBOX_004',
        suggestion: 'Add this command to allowed_commands in config, or use --dangerously-skip-permissions'
      };
    }

    // 4. 特殊检查：rm 命令（即使在白名单中也要警惕）
    // 实际上 rm 在 BLOCKED_COMMANDS 中，这里只是示例
    if (cmdName === 'rm' && command.includes('-rf')) {
      return {
        allowed: false,
        reason: 'rm -rf is extremely dangerous',
        code: 'E_SANDBOX_005'
      };
    }

    // 5. 命令注入检查
    const injectionPatterns = [
      /[;&|`$()]/,  // 常见的命令注入符号
      />\s*\/dev\//,  // 写入设备文件
    ];

    for (const pattern of injectionPatterns) {
      if (pattern.test(command)) {
        logger.warn(`⚠️  Potential command injection detected: ${command}`);
        this.auditLog('suspicious_command', { command });
        // 不阻止，但记录审计日志
      }
    }

    return { allowed: true };
  }

  /**
   * 封装的命令执行（带沙箱检查）
   */
  async execCommand(command) {
    const check = this.checkCommandExecution(command);
    if (!check.allowed) {
      throw new SandboxError(check.reason, check.code);
    }

    // 记录审计日志
    this.auditLog('command_execution', { command });

    // 执行命令
    const { exec } = await import('child_process');
    return new Promise((resolve, reject) => {
      exec(command, { cwd: this.projectRoot }, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
  }
}
```

---

## 🛡️ 集成到 ccAutoRun

### 初始化
```javascript
// src/cli.js
import { Sandbox } from './core/sandbox.js';

const program = new Command();

program
  .option('--dangerously-skip-permissions', 'Bypass all sandbox checks (DANGEROUS!)')
  .hook('preAction', (thisCommand) => {
    const options = thisCommand.opts();
    const mode = options.dangerouslySkipPermissions ? 'dangerous' : 'standard';

    // 创建全局沙箱实例
    global.sandbox = new Sandbox(process.cwd(), mode);

    if (mode === 'dangerous') {
      logger.warn('⚠️  Running in DANGEROUS mode. All sandbox checks are disabled!');
    }
  });
```

### 在文件操作中使用
```javascript
// src/core/plan-parser.js
import fs from 'fs';

export function parsePlan(planPath) {
  // 使用沙箱检查
  const check = global.sandbox.checkFileAccess(planPath);
  if (!check.allowed) {
    throw new Error(`${check.reason} (${check.code})`);
  }

  // 安全地读取文件
  const content = fs.readFileSync(planPath, 'utf-8');
  // ...
}
```

### 在 Hook 中使用
```javascript
// src/hooks/auto-continue.js
export async function autoContinue() {
  // ...

  // 执行 claude 命令前检查
  const command = `claude --resume ${sessionId} "@${nextFile}"`;
  const check = global.sandbox.checkCommandExecution(command);
  if (!check.allowed) {
    logger.error(check.reason);
    return;
  }

  // 安全地执行
  await global.sandbox.execCommand(command);
}
```

---

## 📊 审计日志

### 日志格式
```json
{
  "timestamp": "2025-01-07T14:30:22Z",
  "event": "command_execution",
  "mode": "standard",
  "command": "git commit -m 'feat: add auth'",
  "result": "success"
}
```

### 审计事件类型
- `file_access`: 文件访问
- `sensitive_file_access`: 敏感文件访问
- `command_execution`: 命令执行
- `suspicious_command`: 可疑命令
- `sandbox_violation`: 沙箱违规（被阻止的操作）

### 查看审计日志
```bash
# ccautorun audit 命令
ccautorun audit                        # 显示所有审计日志
ccautorun audit --event file_access   # 过滤特定事件
ccautorun audit --since 1h            # 最近 1 小时
ccautorun audit --suspicious          # 只显示可疑操作
```

---

## 🚨 错误处理

### SandboxError 类
```javascript
// src/utils/error-handler.js
export class SandboxError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'SandboxError';
    this.code = code;
  }
}
```

### 错误码定义
| 错误码 | 描述 | 建议 |
|-------|------|-----|
| E_SANDBOX_001 | 路径在项目外 | 使用 --dangerously-skip-permissions 或将文件移到项目内 |
| E_SANDBOX_002 | 系统目录被阻止 | 不允许访问系统关键目录 |
| E_SANDBOX_003 | 危险命令被阻止 | 使用 --dangerously-skip-permissions 或手动执行 |
| E_SANDBOX_004 | 命令不在白名单 | 添加到 config.yaml 的 allowed_commands 或使用 --dangerously-skip-permissions |
| E_SANDBOX_005 | rm -rf 被阻止 | 绝对危险，必须手动执行 |

---

## 🧪 测试用例

```bash
# 1. 测试文件访问限制
ccautorun run my-task
# AI 尝试访问 /etc/passwd
# 应报错：E_SANDBOX_002

# 2. 测试危险命令阻止
ccautorun run my-task
# AI 尝试执行 rm -rf /
# 应报错：E_SANDBOX_005

# 3. 测试白名单命令
ccautorun run my-task
# AI 执行 git status
# 应成功

# 4. 测试 dangerous 模式
ccautorun run my-task --dangerously-skip-permissions
# AI 可以执行任何命令
# 应显示警告

# 5. 测试审计日志
ccautorun audit
# 应显示所有操作记录
```

---

## 📦 实现清单

### Stage 1
- [ ] 创建 `src/core/sandbox.js`（300行）
- [ ] 定义路径黑名单和命令白名单
- [ ] 实现 `checkFileAccess()` 和 `checkCommandExecution()`

### Stage 2a
- [ ] 集成到 `src/cli.js`（全局 --dangerously-skip-permissions）
- [ ] 在 `doctor` 命令中添加沙箱状态检查

### Stage 3
- [ ] 在 `plan-parser.js` 和 `session-manager.js` 中使用沙箱
- [ ] 在 Hook 中使用沙箱检查

### Stage 5
- [ ] 实现 `ccautorun audit` 命令（查看审计日志）

### Stage 6b
- [ ] 编写沙箱测试用例（绕过尝试、边界情况）

---

## ⚠️ 限制和免责声明

### 明确的限制
1. **不是真正的沙箱**：恶意代码可以绕过检查（如直接调用底层 API）
2. **依赖 AI 合作**：假设 Claude 是合作的，遵守检查结果
3. **无进程隔离**：所有代码运行在同一进程中
4. **有绕过方法**：用户可以使用 `--dangerously-skip-permissions` 绕过

### 使用建议
- ✅ **适合防止意外操作**：避免 AI 犯错
- ✅ **适合日常开发**：保护项目文件安全
- ❌ **不适合对抗恶意代码**：无法防御主动攻击
- ❌ **不适合生产环境**：这是开发工具，不是安全产品

---

## 🔗 相关文档
- [错误处理规范](error-handling.md) - 沙箱错误码定义
- [配置 Schema](config-schema.md) - 安全配置选项
- [主执行计划](../../EXECUTION_PLAN.md) - 安全策略概览

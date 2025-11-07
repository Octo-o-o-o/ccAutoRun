# ccAutoRun v2.0 重构 - 执行计划

<!-- AUTO-RUN-CONFIG
stages: 10
current: 1
auto_continue: false
safety_limit: 0
task_type: refactor
estimated_time: 50-67小时
architecture: split
-->

## 📊 任务概览

- **任务名称**: ccAutoRun v2.0 - 跨平台智能自动化工具重构
- **任务类型**: 重构 + 新功能开发
- **技术栈**: Node.js, Commander.js, Chokidar, node-notifier, glob, vitest
- **预计时间**: 50-67小时（分10个阶段）
- **架构**: 拆分架构（主计划 + 详细stages/）
- **创建时间**: 2025-01-06
- **更新时间**: 2025-11-07
- **项目路径**: /Users/wangyixiao/WorkSpace/ccAutoRun

## 🔧 技术规格

### 环境要求
- **Node.js**: >= 18.0.0（推荐 20.x LTS）
- **npm**: >= 8.0.0
- **Git**: >= 2.20.0
- **Claude Code**: 最新版本（支持 hooks 功能）

### 性能目标
- **计划生成**: < 30秒（简单任务），< 60秒（复杂任务）
- **Hook 响应**: < 2秒
- **支持项目规模**: 最大 50,000 行代码
- **并发任务**: 最多 5 个活跃计划

### 兼容性矩阵
- ✅ **macOS**: 12+ (Intel + Apple Silicon)
- ✅ **Windows**: 10/11 (PowerShell 5.1+, cmd.exe)
- ✅ **Linux**: Ubuntu 20.04+, Debian 11+, CentOS 8+

### 依赖版本锁定
- commander: ^11.0.0
- chokidar: ^3.5.0
- node-notifier: ^10.0.0
- chalk: ^5.3.0
- inquirer: ^9.2.0

## 🎨 核心设计文档

ccAutoRun v2.0 的关键设计细节分布在以下专项文档中：

1. **[Git 集成策略](docs/architecture/git-integration.md)** - Git 工作流、提交规范、分支管理
2. **[沙箱实现设计](docs/architecture/sandbox-design.md)** - 文件访问控制、命令白名单、安全审计
3. **[错误处理规范](docs/architecture/error-handling.md)** - 错误码系统、错误消息格式、帮助系统
4. **[配置验证和迁移](docs/architecture/config-schema.md)** - JSON Schema、配置验证、版本迁移

> **重要**：实施任何 Stage 前，请先阅读相关的架构文档，确保实现符合设计规范。

---

## 🗄️ 数据存储设计

### 目录结构
```
.ccautorun/
├── plans/                          # 所有计划存储
│   └── <plan-id>/                 # 单个计划目录（时间戳命名）
│       ├── metadata.json          # 计划元数据
│       ├── EXECUTION_PLAN.md      # 主计划文件
│       └── stages/                # Stage详细文档目录
│           ├── stage-1.md
│           ├── stage-2a.md
│           └── ...
├── sessions/                       # 会话记录
│   └── <session-id>.jsonl         # JSON Lines格式会话日志
├── snapshots/                      # 快照备份
│   └── <plan-id>/
│       └── <stage-number>/
│           ├── manifest.json      # 快照清单（文件列表+SHA256）
│           └── files/             # 增量备份文件
├── logs/                          # 日志目录
│   ├── ccautorun.log             # 主日志（轮转）
│   ├── ccautorun.log.1           # 历史日志
│   ├── claude-<session-id>.log   # Claude会话日志
│   └── audit.log                 # 安全审计日志
└── config.yaml                    # 全局配置
```

> **配置文件规范**：详见 [配置验证和迁移文档](docs/architecture/config-schema.md)

### 数据格式规范

**metadata.json**:
```json
{
  "id": "20250107-143022",
  "name": "实现用户认证功能",
  "status": "running|paused|completed|failed",
  "architecture": "split|single",
  "currentStage": 3,
  "totalStages": 7,
  "createdAt": "2025-01-07T14:30:22Z",
  "updatedAt": "2025-01-07T15:45:10Z",
  "estimatedTime": "6-8h",
  "tags": ["auth", "security"],
  "safetyLimit": 0
}
```

**session记录（JSONL格式）**:
```json
{"timestamp": "2025-01-07T14:30:22Z", "type": "start", "stage": 1, "sessionId": "abc123"}
{"timestamp": "2025-01-07T14:35:10Z", "type": "progress", "message": "实现认证中间件"}
{"timestamp": "2025-01-07T14:40:00Z", "type": "completed", "stage": 1}
```

**快照清单（manifest.json）**:
```json
{
  "stage": 1,
  "timestamp": "2025-01-07T14:30:22Z",
  "files": [
    {"path": "src/auth.js", "hash": "sha256-...", "size": 1024, "type": "modified"},
    {"path": "src/config.js", "hash": "sha256-...", "size": 512, "type": "new"}
  ],
  "totalSize": 1536
}
```

### 快照管理策略
- **创建时机**: 每个 Stage 开始前自动创建
- **存储方式**: 增量备份（只保存变化文件）
- **保留策略**:
  - 默认保留最近 5 个 Stage 的快照
  - 可配置保留数量（`config.snapshotRetention`）
  - 计划完成后保留首尾快照，清理中间快照
- **磁盘空间管理**:
  - 单个计划快照上限 500MB
  - 超出时警告用户，提供清理选项
  - 自动压缩超过 7 天的快照（gzip）

## 🔒 安全策略

### 1. 沙箱模式（默认启用）
- **文件访问限制**:
  - 只允许访问项目目录及子目录
  - 禁止访问系统关键目录（`/etc`, `C:\Windows`, `~/.ssh`）
  - 禁止访问父目录（`../..` 路径）
- **命令执行限制**:
  - 白名单模式：只允许安全命令（git, npm, node）
  - 禁止危险命令（`rm -rf /`, `format`, `del /s`）
  - Hook执行前进行命令注入检测

### 2. 权限级别设计（简化为两级）
- **standard**: 标准模式（默认）- 文件修改、Git提交、白名单命令
- **dangerous**: 危险模式 - 无限制（需要 `--dangerously-skip-permissions`）

> **注**：v2.0 简化为两级权限，三级权限延后到 v2.1。详见 [沙箱实现设计](docs/architecture/sandbox-design.md)

### 3. 敏感信息保护
- **自动检测敏感文件**:
  ```
  .env, .env.local, .env.production
  credentials.json, secrets.yaml
  *.pem, *.key, *.cert
  id_rsa, id_ed25519
  ```
- **处理策略**:
  - 计划生成时自动排除敏感文件
  - 快照备份时跳过敏感文件
  - 日志输出时脱敏（隐藏API keys、密码）

### 4. 安全审计
- 所有文件操作记录到审计日志
- 可疑操作（访问敏感路径）立即警告
- 提供 `ccautorun audit` 命令查看安全事件

> **详细设计**：参见 [沙箱实现设计文档](docs/architecture/sandbox-design.md)

## 📊 日志管理策略

### 日志级别
- **ERROR**: 错误信息（总是显示）
- **WARN**: 警告信息（默认显示）
- **INFO**: 常规信息（默认显示）
- **DEBUG**: 调试信息（`--verbose`）
- **TRACE**: 详细跟踪（`--debug`）

### 日志轮转
- **主日志（ccautorun.log）**:
  - 单文件最大 10MB
  - 保留最近 5 个轮转文件
  - 超过 30 天自动删除
- **会话日志（claude-*.log）**:
  - 每个会话独立日志文件
  - 计划完成后可选择归档或删除
  - 保留最近 20 个会话日志

### 日志格式
```
[2025-01-07 14:30:22] [INFO] [plan:20250107-143022] [stage:1] 开始执行Stage 1
[2025-01-07 14:30:25] [DEBUG] [plan:20250107-143022] 读取配置: config.json
[2025-01-07 14:30:30] [ERROR] [plan:20250107-143022] 文件不存在: src/auth.js
```

### 调试支持
- `ccautorun run --verbose`: 显示 DEBUG 级别日志
- `ccautorun run --debug`: 显示 TRACE 级别日志 + 性能分析
- `ccautorun logs`: 查看主日志
- `ccautorun logs <plan-id>`: 查看特定计划的日志
- `ccautorun logs --tail -f`: 实时跟踪日志（类似 tail -f）

## 📋 背景和目标

### 当前状态
- 有Windows版本（PowerShell + Bash + Node.js混合）
- 有MyWork版本（Bash Hook + claude --resume）
- 两套方案各有优势但不统一

### 目标
融合两套方案优势，创建一个：
1. ✅ **任务驱动**的工作流工具（不是项目初始化）
2. ✅ **纯Node.js**实现，跨平台一致
3. ✅ **AI生成计划**为核心，确保高质量markdown
4. ✅ **新手友好**，零配置快速启动
5. ✅ **适合GitHub公开发布**，中英文双语

### 核心创新
- 🤖 AI完全生成执行计划（带确认和Review环节）
- 📁 **拆分架构**：计划EXECUTION_PLAN.md + 详细stages/（解决Token浪费问题，提升90%效率）
- 📋 单任务完美体验（v2.0专注单任务，多任务并行延后到v2.1）
- 🔄 Hook自动继续（claude --resume方式）
- ⏸️ **暂停/恢复机制**：优雅中断和继续执行
- 🔓 **分级权限控制**：safe/standard/dangerous三级权限
- 🛡️ **沙箱模式**：文件访问和命令执行限制
- 🌍 纯Node.js跨平台

### 关键设计决策

**为什么v2.0只支持拆分架构？**
- ✅ Token效率提升90%+（只加载当前Stage，不是整个计划）
- ✅ 降低认知负荷（Claude只看当前Stage的800行，不是10000行）
- ✅ 支持渐进式细化（先生成概要，再逐步完善）
- ✅ 简化实现，确保核心体验完美
- 📝 单文件架构延后到v2.1（如果用户反馈需要）

**为什么v2.0只支持单任务？**
- ✅ 避免复杂的并发控制和冲突管理
- ✅ 确保用户体验流畅、稳定
- ✅ 降低测试复杂度
- 📝 多任务并行延后到v2.1（根据用户需求决定）

### 中断/暂停/恢复机制设计

**1. 优雅中断（Ctrl+C）**:
- Hook捕获 SIGINT 信号
- 保存当前执行状态到 session
- 标记为 `paused` 状态
- 提示用户使用 `ccautorun resume` 恢复

**2. 手动暂停**:
```bash
ccautorun pause [plan-id]    # 暂停指定计划（默认当前计划）
```

**3. 恢复执行**:
```bash
ccautorun resume [plan-id]   # 恢复到准确的中断位置
```

**4. 状态保存**:
- 记录当前 Stage、执行进度、已完成的子任务
- 记录 Claude 会话 ID（支持 --resume）
- 记录临时文件状态

### 错误恢复机制设计

**Stage 执行失败时的处理流程**：
1. **自动检测失败**：
   - Hook 检测到 Claude 报错或异常退出
   - Session 记录标记为 `failed` 状态
   - 保存完整的错误日志和上下文

2. **用户选择恢复策略**：
   ```bash
   # 自动提示用户选择恢复方式
   ccautorun recover
   ```
   - **Retry**: 重试当前 Stage（适合临时错误）
   - **Skip**: 跳过当前 Stage，继续下一个（手动修复后）
   - **Rollback**: 回退到上一个 Stage 的快照
   - **Abort**: 中止计划，保留进度

3. **快照回滚**：
   - 恢复到指定 Stage 的文件快照
   - 重置计划状态到该 Stage
   - 保留原始快照，创建回滚记录

4. **冲突检测**（v2.1）：
   - 检测手动修改与计划执行的冲突
   - 提示用户解决冲突
   - 提供 diff 对比工具

**关键文件**：
- `src/core/recovery-manager.js`：恢复管理器
- `src/core/snapshot-manager.js`：快照管理
- `src/core/pause-resume-manager.js`：暂停/恢复管理
- `src/commands/recover.js`：恢复命令
- `src/commands/pause.js`：暂停命令
- `src/commands/resume.js`：恢复命令

## 🎯 执行规则

1. **手动执行模式**: 由于会话窗口限制，每个Stage在新窗口中执行
2. **阶段完成标记**: 每个Stage完成后，在新窗口输入下一Stage
3. **质量优先**: 所有完成标准必须满足
4. **增量提交**: 每个Stage完成后git commit（详见 [Git 集成策略](docs/architecture/git-integration.md)）
5. **错误处理**: 统一使用错误码系统（详见 [错误处理规范](docs/architecture/error-handling.md)）
6. **文档导航**: 点击下方链接查看每个Stage的详细设计文档

---

## 📑 执行阶段

### ✅ Stage 1: 项目结构重组和清理
**目标**: 清理现有混合代码，建立纯Node.js项目结构

**关键任务**:
- 备份现有代码
- 创建新的Node.js项目结构（src/, bin/, tests/）
- 配置package.json和依赖
- 设置.gitignore和基础配置

**详细文档**: [docs/stages/stage-1.md](docs/stages/stage-1.md)

---

### ⏳ Stage 2a: 核心CLI框架和基础命令
**目标**: 实现CLI命令框架、基础命令（init, list, status, doctor）和辅助工具

**关键任务**:
- 实现src/cli.js使用Commander.js
- 实现交互式Onboarding
- 实现ccautorun init命令
- 自动配置Claude Code hooks
- 实现基础工具（logger, config, error-handler）

**详细文档**: [docs/stages/stage-2a.md](docs/stages/stage-2a.md)

---

### ✅ Stage 2b: CLI增强命令和配置管理
**目标**: 实现配置管理、list、status、doctor、pause、resume命令

**关键任务**:
- 实现ccautorun list命令（列出所有计划）
- 实现ccautorun status命令（显示当前计划状态）
- 实现ccautorun doctor命令（环境检查）
- 实现ccautorun config命令（配置管理）
- 实现ccautorun pause命令（暂停当前计划）
- 实现ccautorun resume命令（恢复暂停的计划）
- 实现ccautorun logs命令（查看日志）

**详细文档**: [docs/stages/stage-2b.md](docs/stages/stage-2b.md)

---

### ⏳ Stage 3: 核心自动化引擎 - 计划解析和Hook
**目标**: 实现计划解析器（支持拆分架构）和auto-continue hook

**关键任务**:
- 实现拆分架构的计划解析器
- 实现Stage加载和管理
- 实现auto-continue hook（.claude/hooks/）
- 实现session管理和safety limiter

**详细文档**: [docs/stages/stage-3.md](docs/stages/stage-3.md)

---

### ⏳ Stage 4: AI计划生成系统 - Slash命令核心
**目标**: 实现/plan slash命令和AI计划生成（拆分架构）

**关键任务**:
- 创建/plan slash命令（.claude/commands/plan.md）
- 实现智能架构选择（auto, split, single）
- 实现拆分架构生成流程
- 实现计划确认和Review流程

**详细文档**: [docs/stages/stage-4.md](docs/stages/stage-4.md)

---

### ⏳ Stage 5: 通知、进度可视化和高级功能
**目标**: 实现通知系统、进度可视化、dry-run模式、archive功能

**关键任务**:
- 实现通知系统（跨平台node-notifier）
- 实现进度可视化（实时进度条、百分比、ETA）
  - 格式：`[Stage 3/7] ▓▓▓▓▓▓▓░░░ 68% (ETA: 5min)`
- 实现dry-run模式（`ccautorun run --dry-run`预览执行）
- 实现ccautorun edit命令（在编辑器中修改计划）
- 实现ccautorun archive命令（归档已完成的计划）
- 添加版本检查和更新提示功能

**详细文档**: [docs/stages/stage-5.md](docs/stages/stage-5.md)

---

### ⏳ Stage 5.5: 测试基础设施和测试覆盖
**目标**: 实现测试框架和全面的单元测试

**关键任务**:
- 配置vitest测试框架
- 编写核心模块单元测试
- 编写CLI命令集成测试
- 实现测试覆盖率报告

**详细文档**: [docs/stages/stage-5.5.md](docs/stages/stage-5.5.md)

---

### ⏳ Stage 6a: 集成测试和跨平台兼容性验证
**目标**: 端到端测试、跨平台兼容性验证

**关键任务**:
- 实现 E2E 测试框架（使用 vitest）
- 编写核心流程 E2E 测试：
  - 完整的计划生成 → 执行 → 完成流程
  - 暂停/恢复流程测试
  - 错误处理和恢复流程测试
- 跨平台兼容性测试：
  - Windows 测试（PowerShell + cmd.exe）
  - macOS 测试（Intel + Apple Silicon）
  - Linux 测试（Ubuntu, Debian, CentOS）
- 路径处理测试（Windows反斜杠 vs Unix正斜杠）
- 性能基准测试（大项目场景，50,000行代码）
- 生成测试报告和兼容性矩阵

**详细文档**: [docs/stages/stage-6a.md](docs/stages/stage-6a.md)

---

### ⏳ Stage 6b: 错误恢复系统和安全审计
**目标**: 实现完整的错误恢复机制和安全审计

**关键任务**:
- 实现错误恢复核心模块：
  - `src/core/recovery-manager.js`：恢复管理器
  - `src/core/snapshot-manager.js`：快照管理和回滚
  - `src/core/pause-resume-manager.js`：暂停/恢复管理
- 实现 ccautorun recover 命令（Retry/Skip/Rollback/Abort）
- 实现快照创建、压缩和清理
- 实现 ccautorun audit 命令（安全审计）
- 安全审计：
  - 依赖漏洞扫描（npm audit）
  - 敏感信息检测测试
  - 沙箱模式有效性验证
- 错误恢复流程测试（模拟各种失败场景）

**详细文档**: [docs/stages/stage-6b.md](docs/stages/stage-6b.md)

---

### ⏳ Stage 7: 文档编写和发布准备
**目标**: 完善文档，准备GitHub发布

**关键任务**:
- 编写README.md（中英文双语）
- 编写CONTRIBUTING.md
- 编写用户文档（Quick Start、FAQ、Troubleshooting）
- 编写任务模板库（TEMPLATES.md）
- 编写详细的API文档
- 配置GitHub Actions CI/CD
- npm发布准备

**详细文档**: [docs/stages/stage-7.md](docs/stages/stage-7.md)

---

## 📊 进度跟踪

| Stage | 状态 | 预计时间 | 实际时间 | 完成日期 | 阻塞问题 |
|-------|------|---------|---------|---------|---------|
| Stage 1 | ✅ 已完成 | 4-6h | ~5h | 2025-11-07 | - |
| Stage 2a | ✅ 已完成 | 6-8h | ~6h | 2025-11-07 | - |
| Stage 2b | ✅ 已完成 | 4-5h | ~4h | 2025-11-07 | - |
| Stage 3 | ✅ 已完成 | 6-8h | ~6h | 2025-11-07 | - |
| Stage 4 | ✅ 已完成 | 8-10h | ~8h | 2025-11-07 | - |
| Stage 5 | ✅ 已完成 | 5-7h | ~5h | 2025-11-07 | - |
| Stage 5.5 | ✅ 已完成 | 6-8h | ~3h | 2025-11-07 | - |
| Stage 6a | ✅ 已完成 | 4-6h | ~4h | 2025-11-07 | - |
| Stage 6b | ✅ 已完成 | 4-5h | ~4h | 2025-11-07 | - |
| Stage 7 | ⏳ 待开始 | 3-4h | - | - | - |

**总计**: 50-67小时（10个阶段）

## 📝 更新日志

### 2025-11-07 (架构文档补充)
- **🔧 立即补充（阻塞性）**：
  - ✅ 创建 [Git 集成策略](docs/architecture/git-integration.md) - 完整的 Git 工作流设计
  - ✅ 创建 [沙箱实现设计](docs/architecture/sandbox-design.md) - Node.js 层面的安全实现方案
  - ✅ 创建 [错误处理规范](docs/architecture/error-handling.md) - 统一的错误码系统和错误消息格式
  - ✅ 创建 [配置验证和迁移](docs/architecture/config-schema.md) - 完整的 JSON Schema 和版本迁移策略
  - ✅ 简化权限级别为两级（standard/dangerous），三级权限延后到 v2.1
  - ✅ 在主计划中添加架构文档引用和导航

### 2025-11-07 (重大更新 v2)
- **🔥 MVP必备功能**：
  - ✅ 添加完整的数据存储设计（目录结构、数据格式、快照策略）
  - ✅ 添加中断/暂停/恢复机制（pause、resume命令、优雅中断）
  - ✅ 添加基础安全策略（沙箱模式、权限级别、敏感信息保护）
  - ✅ 添加日志管理策略（日志级别、轮转、调试支持）
  - ✅ 拆分 Stage 6 为 6a（测试+兼容性）和 6b（错误恢复+安全）

- **⚡ 完整版功能**：
  - ✅ Stage 5 添加 dry-run 模式（预览执行）
  - ✅ Stage 5 添加进度可视化（进度条、百分比、ETA）
  - ✅ Stage 5 添加交互式计划编辑（edit命令）
  - ✅ Stage 5 添加版本检查和更新提示
  - ✅ Stage 2b 添加 pause、resume、logs 命令
  - ✅ Stage 6b 添加 audit 命令（安全审计）

- **📋 架构优化**：
  - 简化为单任务模式（多任务并行延后到v2.1）
  - 专注拆分架构（单文件架构延后到v2.1）
  - 更新预计时间：46-58h → 50-67h（10个阶段）

### 2025-11-07 (初始审查)
- **立即修复**：添加缺失的 Stage 6（集成测试、兼容性验证和错误恢复）
- **立即修复**：添加技术规格章节（Node.js >= 18.0.0、性能目标、兼容性矩阵）
- **立即修复**：添加错误恢复机制设计（recovery-manager、快照管理、冲突检测）
- 更新预计时间：40-50h → 46-58h（8个阶段）
- 增强进度跟踪表：添加"阻塞问题"列
- 更新 Stage 7 任务：添加 Quick Start、FAQ、Troubleshooting、Templates 文档

### 2025-01-07
- 重构执行计划文档结构，采用主计划+详细stages分离方案
- 创建docs/stages/目录，每个stage独立设计文档
- 优化文档组织，减少上下文占用

### 2025-01-06
- 创建初始执行计划
- 定义7个执行阶段
- 确定拆分架构方案

---

## 🚀 v2.1 路线图（延后功能）

基于用户反馈和实际需求，以下功能延后到v2.1版本：

### 1. 多任务并行管理
- 同时运行多个计划（最多5个）
- 任务优先级管理
- 资源冲突检测和解决
- 跨计划文件锁定机制

### 2. 单文件架构支持
- 适合简单任务（≤3 stages，<2500行）
- 自动架构选择（智能判断）
- 用户可强制指定架构类型

### 3. 插件系统
- 自定义Hook扩展
- 第三方工具集成接口
- 插件市场和管理

### 4. 高级冲突管理
- 智能冲突检测（手动修改 vs 自动执行）
- 三方合并工具集成
- 可视化diff对比

### 5. 云端同步和协作
- 计划云端备份
- 团队协作功能
- 跨设备同步

**决策依据**: v2.0专注核心体验完美，根据用户反馈决定v2.1优先级

---

## 🔗 相关文档

### 核心设计文档
- [Git 集成策略](docs/architecture/git-integration.md) - Git 工作流、提交规范、分支管理
- [沙箱实现设计](docs/architecture/sandbox-design.md) - 文件访问控制、命令白名单、安全审计
- [错误处理规范](docs/architecture/error-handling.md) - 错误码系统、错误消息格式、帮助系统
- [配置验证和迁移](docs/architecture/config-schema.md) - JSON Schema、配置验证、版本迁移

### 其他文档
- [项目README](README.md)
- [详细设计文档目录](docs/stages/)

## 📌 注意事项

1. **文档同步**: 修改主计划时，同步更新对应的stage详细文档
2. **进度更新**: 完成每个stage后，更新主计划中的进度跟踪表
3. **质量标准**: 参考每个stage详细文档中的完成标准
4. **增量开发**: 每个stage完成后创建git commit，便于回滚
5. **MVP优先**: 专注v2.0核心功能，避免过度设计，延后功能参考v2.1路线图

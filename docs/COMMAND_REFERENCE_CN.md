# 命令参考

> ccAutoRun 所有命令的完整参考

[English Version](./COMMAND_REFERENCE.md) | [快速开始](./GETTING_STARTED_CN.md)

---

## 快速导航

- [初始化与设置](#初始化与设置)
- [计划管理](#计划管理)
- [执行控制](#执行控制)
- [监控与日志](#监控与日志)
- [错误恢复](#错误恢复)
- [斜杠命令](#斜杠命令在-claude-code-中)

---

## 初始化与设置

### `ccautorun init`

在当前项目中初始化 ccAutoRun。

```bash
ccautorun init [options]
```

**选项:**
- `--setup-hooks` - 自动配置 Claude Code hooks (推荐)

**示例:**
```bash
# 带 hooks 初始化
ccautorun init --setup-hooks

# 不带 hooks 初始化
ccautorun init
```

**执行内容:**
- 创建 `.ccautorun/` 目录结构
- 创建默认配置文件
- 设置 Claude Code hooks (如果指定 `--setup-hooks`)
- 创建日志目录

---

### `ccautorun doctor`

检查系统要求和配置。

```bash
ccautorun doctor [options]
```

**选项:**
- `--verbose` - 显示详细信息

**检查项:**
- Node.js 版本 (>= 18.0.0)
- npm 版本 (>= 8.0.0)
- Git 版本 (>= 2.20.0)
- Claude CLI 安装
- 项目初始化状态
- Hooks 配置
- 目录结构
- 配置文件有效性

**示例:**
```bash
ccautorun doctor
ccautorun doctor --verbose
```

---

### `ccautorun migrate`

从旧版本迁移配置。

```bash
ccautorun migrate
```

---

## 计划管理

### `ccautorun list`

列出所有执行计划。

```bash
ccautorun list [options]
```

**选项:**
- `--status <status>` - 按状态过滤 (active/paused/completed/failed)

**示例:**
```bash
# 列出所有计划
ccautorun list

# 仅列出活动计划
ccautorun list --status active

# 列出已完成的计划
ccautorun list --status completed
```

---

### `ccautorun status`

显示当前计划执行状态。

```bash
ccautorun status [plan-id]
```

**示例:**
```bash
# 显示当前计划状态
ccautorun status

# 显示特定计划状态
ccautorun status auth-feature-20250107
```

**输出:**
```
Plan: auth-feature-20250107
Status: active (Stage 2/5)
Progress: 40%

已完成:
  ✅ Stage 1: Database design (15m 23s)

当前:
  🔄 Stage 2: API implementation (8m 12s)

待执行:
  ⏳ Stage 3: Frontend integration
  ⏳ Stage 4: Testing
  ⏳ Stage 5: Documentation

预计剩余时间: 42 分钟
```

---

### `ccautorun validate`

验证执行计划格式和结构。

```bash
ccautorun validate <plan-id>
```

**示例:**
```bash
ccautorun validate auth-feature-20250107
```

---

### `ccautorun archive`

归档已完成的计划。

```bash
ccautorun archive <plan-id> [options]
```

**选项:**
- `--older-than <days>` - 归档超过 N 天的计划

**示例:**
```bash
# 归档特定计划
ccautorun archive auth-feature-20250107

# 归档所有超过 30 天的计划
ccautorun archive --older-than 30
```

---

### `ccautorun stats`

显示计划的统计信息。

```bash
ccautorun stats [plan-id] [options]
```

**选项:**
- `--disk-usage` - 显示快照的磁盘使用情况

**示例:**
```bash
# 全局统计
ccautorun stats

# 特定计划统计
ccautorun stats auth-feature-20250107

# 显示磁盘使用
ccautorun stats --disk-usage
```

---

## 执行控制

### `ccautorun trigger`

手动触发下一阶段继续。

```bash
ccautorun trigger <plan-id>
```

**使用场景:**
- Hooks 不工作时
- 需要手动覆盖时
- 测试计划执行时

**示例:**
```bash
ccautorun trigger auth-feature-20250107
```

---

### `ccautorun pause`

暂停正在运行的计划。

```bash
ccautorun pause <plan-id>
```

**执行内容:**
- 为该计划禁用自动继续
- 当前阶段完成后暂停
- 稍后可以用 `ccautorun resume` 恢复

**示例:**
```bash
ccautorun pause auth-feature-20250107
```

---

### `ccautorun resume`

恢复已暂停的计划。

```bash
ccautorun resume <plan-id>
```

**示例:**
```bash
ccautorun resume auth-feature-20250107
```

---

### `ccautorun skip`

跳过计划中的某个阶段。

```bash
ccautorun skip <plan-id> <stage-number>
```

**⚠️ 警告:** 谨慎使用! 跳过阶段可能会破坏依赖关系。

**示例:**
```bash
# 跳过阶段 3
ccautorun skip auth-feature-20250107 3
```

---

### `ccautorun reset`

重置会话状态 (从头开始计划)。

```bash
ccautorun reset <plan-id>
```

**⚠️ 警告:** 这会重置进度,但不会撤销代码更改!

**示例:**
```bash
ccautorun reset auth-feature-20250107
```

---

## 监控与日志

### `ccautorun watch`

实时监控任务进度。

```bash
ccautorun watch <plan-id>
```

**示例:**
```bash
ccautorun watch auth-feature-20250107
```

**输出:**
```
╔════════════════════════════════════════╗
║  📊 Plan: auth-feature-20250107        ║
║  Status: Running ● Stage 2/5          ║
║  Progress: [████████░░░░░░] 40%      ║
╚════════════════════════════════════════╝

时间线:
  ✅ Stage 1: Database design (15m 23s)
  🔄 Stage 2: API implementation (8m 12s)
  ⏳ Stage 3: Frontend integration
  ⏳ Stage 4: Testing
  ⏳ Stage 5: Documentation

预计时间: ~42 分钟

按 Ctrl+C 停止监控
```

---

### `ccautorun logs`

查看计划执行日志。

```bash
ccautorun logs <plan-id> [options]
```

**选项:**
- `--tail <n>` - 显示最后 N 行
- `-f, --follow` - 实时跟踪日志输出
- `--level <level>` - 按日志级别过滤 (error/warn/info/debug)

**示例:**
```bash
# 查看最后 50 行
ccautorun logs auth-feature-20250107 --tail 50

# 实时跟踪日志
ccautorun logs auth-feature-20250107 -f

# 仅显示错误
ccautorun logs auth-feature-20250107 --level error
```

---

## 错误恢复

### `ccautorun recover`

从失败的计划执行中恢复。

```bash
ccautorun recover <plan-id> [options]
```

**选项:**
- `--rollback <snapshot>` - 回滚到特定快照

**交互模式:**
```bash
$ ccautorun recover auth-feature-20250107

? 选择恢复策略:
  ❯ Retry      - 重试当前阶段
    Skip       - 跳过当前阶段
    Rollback   - 回滚到之前的快照
    Abort      - 中止整个计划
```

**直接回滚:**
```bash
ccautorun recover auth-feature-20250107 --rollback stage-2-before
```

---

### `ccautorun retry`

重试失败的阶段或计划。

```bash
ccautorun retry <plan-id> [stage-number]
```

**示例:**
```bash
# 重试当前失败的阶段
ccautorun retry auth-feature-20250107

# 重试特定阶段
ccautorun retry auth-feature-20250107 3
```

---

## 安全

### `ccautorun audit`

运行安全审计。

```bash
ccautorun audit [options]
```

**选项:**
- `--check-deps` - 检查依赖漏洞
- `--check-files` - 检查敏感文件
- `--check-config` - 检查配置安全性

**示例:**
```bash
# 完整审计
ccautorun audit

# 仅检查依赖
ccautorun audit --check-deps

# 检查所有
ccautorun audit --check-deps --check-files --check-config
```

---

## 斜杠命令 (在 Claude Code 中)

这些命令在 Claude Code 中使用,而不是在终端中。

### `/plan`

生成执行计划 (AI 自动选择架构)。

```
/plan <任务描述>
```

**示例:**
```
/plan 添加 vitest 测试框架,包括配置和示例测试
```

---

### `/plan --force-split`

强制使用 split 架构 (用于复杂任务)。

```
/plan --force-split <任务描述>
```

**示例:**
```
/plan --force-split 重构整个 API 层以使用 GraphQL
```

---

### `/plan --force-single`

强制使用 single-file 架构 (用于简单任务)。

```
/plan --force-single <任务描述>
```

**示例:**
```
/plan --force-single 更新 README 文档
```

---

### `/plan --template`

使用任务模板。

```
/plan --template <template-name> <任务描述>
```

**可用模板:**
- `feature` - 新功能开发
- `refactor` - 代码重构
- `bugfix` - Bug 修复
- `docs` - 文档

**示例:**
```
/plan --template feature 添加用户个人资料编辑
/plan --template refactor 现代化认证模块
/plan --template bugfix 修复事件监听器中的内存泄漏
/plan --template docs 生成 API 文档
```

---

## 配置

**注意:** `config` 命令目前有 bug。直接编辑配置文件:

```bash
# 编辑主配置
code .ccautorun/config.yaml

# 编辑 hooks 配置
code .claude/hooks.yaml
```

---

## 全局选项

适用于大多数命令:

- `-V, --version` - 输出版本号
- `-v, --verbose` - 启用详细日志
- `--debug` - 启用调试模式
- `--dry-run` - 预览操作而不执行
- `-h, --help` - 显示命令帮助

**示例:**
```bash
ccautorun list --verbose
ccautorun init --dry-run
```

---

## 退出代码

- `0` - 成功
- `1` - 一般错误
- `2` - 无效参数
- `3` - 配置错误
- `4` - 执行错误

---

## 另见

- [快速开始](./GETTING_STARTED_CN.md) - 快速开始指南
- [核心概念](./CORE_CONCEPTS_CN.md) - 理解 ccAutoRun
- [配置](./CONFIGURATION_CN.md) - 配置参考
- [常见问题](./FAQ.md) - 常见问题

---

**[← 核心概念](./CORE_CONCEPTS_CN.md)** | **[配置 →](./CONFIGURATION_CN.md)** | **[English Version](./COMMAND_REFERENCE.md)**

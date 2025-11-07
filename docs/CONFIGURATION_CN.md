# 配置指南

> 为您的工作流定制 ccAutoRun 行为

[English Version](./CONFIGURATION.md) | [命令参考](./COMMAND_REFERENCE_CN.md)

---

## 配置文件

ccAutoRun 使用两个主要配置文件:

```
.ccautorun/config.yaml     # 主配置
.claude/hooks.yaml         # Claude Code hooks 配置
```

---

## config.yaml 参考

位置: `.ccautorun/config.yaml`

### 完整配置

```yaml
# ccAutoRun 版本
version: 2.0.0

# 默认架构: auto | split | single
default_architecture: auto

# 安全限制: number | unlimited
safety_limit: unlimited

# 桌面通知
notifications:
  enabled: true
  sound: true
  progress_frequency: every-stage  # every-stage | milestone-only

# 自动继续设置
auto_continue:
  enabled: true
  skip_permissions: true  # 危险模式 - 跳过权限检查

# 默认编辑器
editor: code  # code | vim | nano | idea

# 语言
language: en  # en | zh

# 快照保留 (保留的快照数量)
snapshot_retention: 5

# 日志级别
log_level: info  # error | warn | info | debug | trace

# Git 集成 (实验性)
git:
  auto_commit: false
  commit_message_prefix: "[ccAutoRun]"
```

### 配置选项

#### `default_architecture`

选择计划生成的默认架构。

**值:**
- `auto` - 让 Claude 决定 (推荐)
- `split` - 始终使用 split 架构
- `single` - 始终使用 single-file 架构

**何时更改:**
- 如果您总是处理复杂任务,设置为 `split`
- 如果您主要做快速修复,设置为 `single`

---

#### `safety_limit`

在暂停审查之前要执行的阶段数。

**值:**
- 数字 (例如 `3`, `5`, `10`)
- `unlimited` - 不自动暂停

**推荐值:**

| 环境 | 值 | 原因 |
|-------------|-------|--------|
| 开发环境 | 5-10 | 平衡效率和安全 |
| 生产环境 | 3 | 最大安全性 |
| 简单任务 | 3-5 | 快速审查 |
| 复杂任务 | 10-15 | 减少中断 |
| 完全信任 | unlimited | 最高风险 |

---

#### `notifications`

配置桌面通知。

```yaml
notifications:
  enabled: true              # 启用/禁用通知
  sound: true                # 通知时播放声音
  progress_frequency: every-stage  # 何时通知
```

**`progress_frequency` 值:**
- `every-stage` - 每个阶段完成后通知
- `milestone-only` - 仅在主要里程碑时通知 (25%, 50%, 75%, 100%)

---

#### `auto_continue`

控制自动阶段继续。

```yaml
auto_continue:
  enabled: true              # 启用自动继续
  skip_permissions: true     # 跳过 Claude 权限提示
```

**⚠️ 警告:** `skip_permissions: true` 在生产环境中很危险!

**何时禁用:**
- 测试新计划时
- 生产环境
- 不受信任的计划

---

#### `editor`

打开文件的默认编辑器。

**支持的值:**
- `code` - Visual Studio Code
- `vim` - Vim
- `nano` - Nano
- `idea` - IntelliJ IDEA

---

#### `snapshot_retention`

每个计划保留的快照数量。

**默认值:** `5`

**磁盘使用考虑:**
- 每个快照可能是 10-100MB,取决于项目大小
- 5 个快照 ≈ 每个计划 50-500MB
- 对于关键项目增加
- 减少以节省磁盘空间

---

#### `log_level`

日志详细程度。

**值:**
- `error` - 仅错误
- `warn` - 警告和错误
- `info` - 一般信息 (默认)
- `debug` - 详细调试信息
- `trace` - 所有内容 (非常详细)

---

## hooks.yaml 参考

位置: `.claude/hooks.yaml`

### 完整配置

```yaml
hooks:
  - event: Stop                          # 事件类型
    command: node src/hooks/auto-continue.js
    description: Auto-continue to next stage
    enabled: false                       # 设置为 true 以启用

user-prompt-submit:
  command: node
  args:
    - .ccautorun/hooks/auto-continue.js
  enabled: false                         # 设置为 true 以启用
  background: false
  timeout: 30000                         # 30 秒
```

### 启用自动继续

要启用自动阶段推进:

1. 打开 `.claude/hooks.yaml`
2. 将 `enabled: false` 改为 `enabled: true`
3. 保存文件

```yaml
hooks:
  - event: Stop
    command: node src/hooks/auto-continue.js
    description: Auto-continue to next stage
    enabled: true  # ← 更改此项
```

---

## 环境特定配置

### 开发环境

```yaml
# .ccautorun/config.yaml
version: 2.0.0
default_architecture: auto
safety_limit: unlimited      # 快速开发无限制
notifications:
  enabled: true
  sound: true
  progress_frequency: every-stage
auto_continue:
  enabled: true
  skip_permissions: true     # 开发环境可以
snapshot_retention: 3        # 节省磁盘空间
log_level: debug            # 详细日志
```

### 生产环境

```yaml
# .ccautorun/config.yaml
version: 2.0.0
default_architecture: auto
safety_limit: 3              # 严格安全
notifications:
  enabled: true
  sound: true
  progress_frequency: milestone-only
auto_continue:
  enabled: true
  skip_permissions: false    # 重要: 生产环境必须为 false
snapshot_retention: 5        # 保留更多快照
log_level: info             # 适度日志
```

### CI/CD 环境

```yaml
# .ccautorun/config.yaml
version: 2.0.0
default_architecture: split
safety_limit: unlimited      # CI 中无人工审查
notifications:
  enabled: false             # CI 中无通知
auto_continue:
  enabled: false             # CI 中手动控制
snapshot_retention: 1        # 最少快照
log_level: info
```

---

## 配置最佳实践

### 安全

✅ **应该:**
- 在生产环境中设置 `skip_permissions: false`
- 使用 `safety_limit` 防止失控执行
- 保持 `snapshot_retention >= 3` 以支持回滚
- 定期使用 `audit` 命令

❌ **不应该:**
- 不要在生产环境中使用 `skip_permissions: true`
- 不要在未仔细考虑的情况下设置 `safety_limit: unlimited`
- 不要禁用快照 (`snapshot_retention: 0`)

### 性能

✅ **应该:**
- 对大型项目设置 `default_architecture: split`
- 如果磁盘空间有限,降低 `snapshot_retention`
- 在生产环境中使用 `log_level: info` 或 `warn`

❌ **不应该:**
- 不要在生产环境中使用 `log_level: trace` (性能影响)
- 不要保留太多快照 (磁盘使用)

### 用户体验

✅ **应该:**
- 为长时间运行的任务启用通知
- 根据任务复杂度设置适当的 `safety_limit`
- 使用 `progress_frequency: milestone-only` 减少通知噪音

❌ **不应该:**
- 不要完全禁用通知 (会错过重要事件)
- 不要将 `safety_limit` 设置得太低 (持续中断)

---

## 修改配置

### 推荐方法

直接编辑文件:

```bash
# macOS/Linux
vim .ccautorun/config.yaml

# Windows
notepad .ccautorun\config.yaml

# VS Code
code .ccautorun/config.yaml
```

### 更改配置后

验证您的更改:

```bash
ccautorun doctor
```

`doctor` 命令将验证您的配置并报告任何错误。

---

## 配置验证

ccAutoRun 在启动时验证配置。常见错误:

### 无效的 YAML 语法

```
✗ Error: Invalid YAML syntax in config.yaml
  Line 5: unexpected token
```

**修复:** 检查 YAML 语法 (缩进、冒号、引号)

### 无效值

```
✗ Error: Invalid value for safety_limit
  Expected: number or 'unlimited'
  Got: 'yes'
```

**修复:** 使用正确的数据类型

### 缺少必需字段

```
✗ Error: Missing required field 'version'
```

**修复:** 添加必需字段

---

## 迁移配置

升级 ccAutoRun 时:

```bash
ccautorun migrate
```

这将:
- 备份旧配置
- 更新到新格式
- 保留您的自定义设置
- 报告任何问题

---

## 另见

- [命令参考](./COMMAND_REFERENCE_CN.md) - 所有命令
- [最佳实践](./BEST_PRACTICES_CN.md) - 使用技巧
- [常见问题](./FAQ.md) - 常见问题

---

**[← 命令参考](./COMMAND_REFERENCE_CN.md)** | **[最佳实践 →](./BEST_PRACTICES_CN.md)** | **[English Version](./CONFIGURATION.md)**

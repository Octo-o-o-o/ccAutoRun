# 核心概念

> 理解 ccAutoRun 的基本原理

[English Version](./CORE_CONCEPTS.md) | [快速开始](./GETTING_STARTED_CN.md)

---

## 📋 目录

- [什么是 ccAutoRun](#什么是-ccautorun)
- [执行计划](#执行计划)
- [架构类型](#架构类型)
- [会话](#会话)
- [安全限制器](#安全限制器)
- [快照系统](#快照系统)
- [Hook 机制](#hook-机制)

---

## 什么是 ccAutoRun

ccAutoRun 是一个为 Claude Code 设计的 **AI 驱动的任务自动化工具**,可将复杂的开发任务转化为自执行工作流。

### 核心特性

- **AI 生成计划**: Claude 自动将复杂任务分解为可管理的阶段
- **零干预执行**: 基于 Hook 的系统自动在阶段间推进
- **Token 高效**: Split 架构仅加载当前阶段,节省 90%+ Token
- **生产安全**: 内置快照、安全限制和错误恢复

### 使用场景

✅ **最适合:**
- 大规模重构 (例如迁移到 TypeScript)
- 功能开发 (例如用户认证系统)
- 添加测试框架
- 性能优化
- 文档生成
- CI/CD 设置

❌ **不适合:**
- 单文件快速修复
- 创意内容 (写作、设计)
- 需要频繁人工决策的任务

---

## 执行计划

执行计划是任务的结构化描述,分解为多个阶段。

### 计划结构 (Split 架构)

```
.ccautorun/plans/auth-feature-20250107/
├── EXECUTION_PLAN.md       # 计划概览
├── metadata.json           # 元数据
└── stages/
    ├── 01-database.md      # 阶段 1 详细步骤
    ├── 02-api.md           # 阶段 2 详细步骤
    └── 03-frontend.md      # 阶段 3 详细步骤
```

### 计划元数据

每个计划包含配置元数据:

```markdown
<!-- AUTO-RUN-CONFIG
stages: 3
current: 1
auto_continue: true
safety_limit: 10
task_type: feature
estimated_time: 4-6h
architecture: split
-->
```

**元数据字段:**
- `stages`: 总阶段数
- `current`: 当前执行的阶段
- `auto_continue`: 启用/禁用自动继续
- `safety_limit`: 执行 N 个阶段后暂停以供审查
- `task_type`: 任务类型 (feature/refactor/bugfix/docs)
- `estimated_time`: 预期完成时间
- `architecture`: split 或 single

---

## 架构类型

ccAutoRun 支持两种架构类型:

### Split 架构

**何时使用:**
- 包含 4+ 阶段的复杂任务
- 大规模代码库修改
- 长期运行的重构
- 每个阶段有 800-2500 行代码

**优势:**
- ✅ 仅加载当前阶段 → 节省 90%+ Token
- ✅ 每个阶段独立文件 → 易于管理
- ✅ 轻松扩展到 20+ 阶段
- ✅ 更易于审查和修改

**结构:**
```
plan-directory/
├── EXECUTION_PLAN.md    # 概览 + 元数据
└── stages/
    ├── 01-stage.md      # 详细步骤
    ├── 02-stage.md
    └── 03-stage.md
```

**示例:**
```
大型重构: 将 REST API 迁移到 GraphQL
├── 阶段 1: 分析现有 API 结构
├── 阶段 2: 设计 GraphQL Schema
├── 阶段 3: 实现 Resolvers (批次 1)
├── 阶段 4: 实现 Resolvers (批次 2)
├── 阶段 5: 客户端迁移
├── 阶段 6: 废弃旧 API
└── 阶段 7: 测试和文档
```

### Single 架构

**何时使用:**
- ≤3 阶段的简单任务
- 快速修复或更新
- 总代码 < 2500 行
- 定义明确、聚焦的任务

**优势:**
- ✅ 生成更快
- ✅ 易于查看整体计划
- ✅ 文件管理更少
- ✅ 快速修改

**结构:**
```
plan-file.md
├── 元数据 (在头部)
├── 概览
├── 阶段 1
├── 阶段 2
└── 阶段 3
```

**示例:**
```
更新 README 文档
├── 阶段 1: 更新安装说明
├── 阶段 2: 添加使用示例
└── 阶段 3: 更新贡献指南
```

### 自动选择 (推荐)

让 Claude 自动选择最佳架构:

```
/plan <你的任务描述>
```

Claude 会分析:
- 任务复杂度
- 估计代码行数
- 所需阶段数
- 项目规模

并自动选择最优架构!

---

## 会话

会话跟踪计划的执行状态。

### 会话结构

```json
{
  "taskName": "auth-feature",
  "currentStage": 2,
  "status": "active",
  "count": 1,
  "startTime": "2025-11-07T08:00:00.000Z",
  "lastUpdated": "2025-11-07T08:30:00.000Z"
}
```

### 会话状态

- **active**: 当前正在执行
- **paused**: 暂时暂停
- **completed**: 所有阶段已完成
- **failed**: 执行失败

### 会话管理

```bash
# 查看当前会话
ccautorun status <plan-id>

# 重置会话 (重新开始)
ccautorun reset <plan-id>

# 暂停会话
ccautorun pause <plan-id>

# 恢复会话
ccautorun resume <plan-id>
```

---

## 安全限制器

安全限制器通过在执行 N 个阶段后暂停来防止失控执行,以供人工审查。

### 工作原理

```
执行阶段 1 → 自动继续
执行阶段 2 → 自动继续
执行阶段 3 → ⏸️ 暂停 (达到安全限制)
等待用户确认 → 恢复
执行阶段 4 → ...
```

### 配置

```yaml
# .ccautorun/config.yaml
safety_limit: 3        # 执行 3 个阶段后暂停
# 或
safety_limit: unlimited  # 无限制 (谨慎使用)
```

### 推荐值

| 环境 | 推荐值 | 原因 |
|-------------|-------------|--------|
| 开发环境 | 5-10 | 平衡效率和安全 |
| 简单任务 | 3-5 | 快速审查 |
| 复杂任务 | 10-15 | 减少中断 |
| 完全信任的计划 | unlimited | 风险最高 |
| 生产环境 | 3 | 最安全 |

### 处理安全暂停

当达到限制时:

```bash
# 审查更改
git status
git diff

# 查看已完成的工作
ccautorun logs <plan-id> --tail 50

# 如果满意,恢复
ccautorun resume <plan-id>
```

---

## 快照系统

在每个阶段执行前自动备份。

### 工作原理

在执行每个阶段之前,ccAutoRun 创建快照:

```
阶段 1: 创建快照 → 执行 → 成功
阶段 2: 创建快照 → 执行 → 成功
阶段 3: 创建快照 → 执行 → 失败!
         ↓
    回滚到阶段 2 快照
```

### 快照结构

```
.ccautorun/snapshots/auth-feature/
├── stage-1-before.tar.gz
├── stage-2-before.tar.gz
└── stage-3-before.tar.gz
```

### 配置

```yaml
# 保留最近 N 个快照
snapshot_retention: 5
```

### 快照管理

```bash
# 列出快照
ccautorun snapshot list <plan-id>

# 回滚到快照
ccautorun snapshot rollback <plan-id> stage-2-before

# 清理旧快照
ccautorun snapshot clean --older-than 7d

# 查看快照磁盘使用
ccautorun stats --disk-usage
```

---

## Hook 机制

Hook 使阶段之间能够自动推进,无需人工干预。

### Hook 工作原理

```
Claude 完成阶段 1
    ↓
Hook 检测完成 (.claude/hooks.yaml)
    ↓
Hook 更新会话状态
    ↓
Hook 加载阶段 2 内容
    ↓
Claude 自动开始阶段 2
```

### Hook 配置

`.claude/hooks.yaml`:

```yaml
hooks:
  - event: Stop                # 当 Claude 停止时触发
    command: node src/hooks/auto-continue.js
    description: Auto-continue to next stage
    enabled: false             # 设置为 true 以启用
```

### 启用自动继续

编辑 `.claude/hooks.yaml` 并设置 `enabled: true`:

```yaml
hooks:
  - event: Stop
    command: node src/hooks/auto-continue.js
    description: Auto-continue to next stage
    enabled: true              # ← 更改此项
```

### 手动触发

如果 Hook 不工作,手动触发下一阶段:

```bash
ccautorun trigger <plan-id>
```

---

## 工作流概览

完整的执行工作流:

```
1. 生成计划 (/plan 命令)
   ↓
2. Claude 分析并创建执行计划
   ↓
3. 保存计划到 .ccautorun/plans/
   ↓
4. 执行阶段 1
   - 创建快照
   - 执行步骤
   - 更新会话
   ↓
5. Hook 自动触发阶段 2
   ↓
6. 重复直到:
   A. 所有阶段完成 ✅
   B. 达到安全限制 ⏸️
   C. 遇到错误 ❌
   ↓
7. 完成/暂停/恢复
```

---

## 最佳实践

### 计划设计

✅ **应该:**
- 将任务分解为 3-8 个逻辑阶段
- 每个阶段都应有明确的目标
- 在计划中包含测试步骤
- 使用描述性的阶段名称

❌ **不应该:**
- 不要在一个阶段塞入太多内容
- 不要跳过测试和验证
- 不要在生产环境使用 unlimited 安全限制

### 执行监控

✅ **应该:**
- 对长时间运行的任务使用 `watch` 命令
- 定期审查更改
- 启用桌面通知
- 检查日志中的警告

❌ **不应该:**
- 不要完全无监控地运行计划
- 不要忽略警告消息
- 不要在不理解失败原因的情况下跳过阶段

---

## 下一步

- **[命令参考](./COMMAND_REFERENCE_CN.md)** - 完整的命令列表
- **[配置指南](./CONFIGURATION_CN.md)** - 自定义行为
- **[最佳实践](./BEST_PRACTICES_CN.md)** - 高级技巧
- **[常见问题](./FAQ.md)** - 常见问题

---

**[← 快速开始](./GETTING_STARTED_CN.md)** | **[命令参考 →](./COMMAND_REFERENCE_CN.md)** | **[English Version](./CORE_CONCEPTS.md)**

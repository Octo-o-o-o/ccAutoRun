# ccAutoRun v0.1.0 快速开始

> 5分钟快速上手 ccAutoRun

[English Version](./GETTING_STARTED.md)

---

## 📋 目录

- [系统要求](#系统要求)
- [安装](#安装)
- [首次设置](#首次设置)
- [创建第一个执行计划](#创建第一个执行计划)
- [监控执行过程](#监控执行过程)
- [下一步](#下一步)

---

## 系统要求

在安装 ccAutoRun 之前，请确保您的系统满足以下要求:

- **Node.js** >= 18.0.0 (推荐: 20.x LTS)
- **npm** >= 8.0.0
- **Git** >= 2.20.0
- **Claude Code CLI** (最新版本)

**检查您的环境:**

```bash
node --version  # 应显示 v18.x.x 或更高版本
npm --version   # 应显示 8.x.x 或更高版本
git --version   # 应显示 2.20.x 或更高版本
claude --version # 应显示 Claude Code 版本
```

---

## 安装

### 方式1: 全局安装 (推荐)

```bash
npm install -g ccautorun
```

验证安装:
```bash
ccautorun --version
# 输出: 2.0.0
```

### 方式2: 使用 npx (无需安装)

```bash
npx ccautorun --version
```

### 方式3: 从源码安装 (开发者)

```bash
git clone https://github.com/yourusername/ccautorun.git
cd ccautorun
npm install
npm link
ccautorun --version
```

---

## 首次设置

### 步骤1: 初始化项目

进入您的项目目录并运行:

```bash
cd /path/to/your/project
ccautorun init --setup-hooks
```

这将创建以下结构:

```
.ccautorun/
├── config.yaml       # 配置文件
├── plans/            # 执行计划目录
├── sessions/         # 会话跟踪
├── logs/             # 应用日志
├── snapshots/        # 自动备份
└── archive/          # 归档计划

.claude/
└── hooks.yaml        # Claude Code hooks 配置
```

### 步骤2: 验证环境

```bash
ccautorun doctor
```

预期输出:

```
ccAutoRun System Check

✓ Node.js - Version v24.11.0
✓ npm - Version 11.6.1
✓ Git - Version 2.51.2
✓ Claude CLI - Found
✓ ccAutoRun Initialization - Initialized
✓ Project Structure - All required directories exist
✓ Configuration File - Valid

Summary: ✓ 7 passed
```

如果看到任何错误，请按照 `doctor` 命令提供的建议进行修复。

---

## 创建第一个执行计划

### 步骤1: 生成计划

打开 **Claude Code** 并使用 `/plan` 斜杠命令:

```
/plan 为项目添加 vitest 测试框架，包括配置、示例测试和覆盖率报告
```

**Claude 会:**
1. 分析您的项目结构
2. 生成详细的多阶段执行计划
3. 自动选择最优架构 (Split/Single)
4. 将计划保存到 `.ccautorun/plans/`

**示例输出:**

```
✓ 已生成执行计划: vitest-setup-20250107

架构: Split (5 个阶段)
预估时间: 3-4 小时

Stage 1: 安装和配置 Vitest
Stage 2: 创建测试基础设施
Stage 3: 编写示例测试套件
Stage 4: 配置覆盖率报告
Stage 5: 更新文档

计划已保存到: .ccautorun/plans/vitest-setup-20250107/
```

### 步骤2: 查看计划

```bash
# 列出所有计划
ccautorun list

# 查看计划详情
ccautorun status vitest-setup-20250107

# 验证计划格式
ccautorun validate vitest-setup-20250107
```

### 步骤3: 执行计划

**自动模式 (推荐):**

Claude 会自动开始执行 Stage 1。完成后，hook 系统会自动触发 Stage 2，以此类推。

**执行流程:**
```
✓ Stage 1 完成 (12分34秒)
  → 自动继续到 Stage 2...
✓ Stage 2 完成 (8分12秒)
  → 自动继续到 Stage 3...
⏸️ 达到安全限制 (执行3个阶段后)
  → 需要人工审查
```

**手动模式:**

```bash
# 暂停自动继续
ccautorun pause vitest-setup-20250107

# 在 Claude Code 中，手动执行每个阶段:
# 执行 .ccautorun/plans/vitest-setup-20250107/stages/01-install.md
# 执行 .ccautorun/plans/vitest-setup-20250107/stages/02-infrastructure.md
```

---

## 监控执行过程

### 实时监控

打开新终端并运行:

```bash
ccautorun watch vitest-setup-20250107
```

输出:

```
📊 计划: vitest-setup-20250107
   状态: 运行中
   进度: [▓▓▓▓▓▓▓░░░] 68% (Stage 2/3)

   ✅ Stage 1: 安装和配置 (12分34秒)
   🔄 Stage 2: 创建基础设施 (进行中, 5分12秒)
   ⏳ Stage 3: 编写示例测试
   ⏳ Stage 4: 配置覆盖率
   ⏳ Stage 5: 更新文档

   预计剩余时间: 18 分钟
```

### 查看日志

```bash
# 查看最近日志
ccautorun logs vitest-setup-20250107 --tail 50

# 实时跟踪日志
ccautorun logs vitest-setup-20250107 -f
```

### 检查状态

```bash
ccautorun status vitest-setup-20250107
```

---

## 处理安全暂停

执行3个阶段后 (默认安全限制)，ccAutoRun 会暂停以进行人工审查:

```
⏸️ 达到安全限制 (3/3 阶段)

✅ 已完成:
   - Stage 1: 安装和配置
   - Stage 2: 创建基础设施
   - Stage 3: 编写示例测试

⏳ 待执行:
   - Stage 4: 配置覆盖率
   - Stage 5: 更新文档

审查更改后运行: ccautorun resume vitest-setup-20250107
```

**恢复执行:**

```bash
# 审查更改
git status
git diff

# 如果满意，继续执行
ccautorun resume vitest-setup-20250107
```

---

## 错误处理

如果某个阶段失败:

```bash
# 查看错误详情
ccautorun logs vitest-setup-20250107 --tail 100

# 使用恢复命令
ccautorun recover vitest-setup-20250107
```

**恢复选项:**

```
? 选择恢复策略:
  ❯ Retry      - 重试当前阶段 (适用于临时错误)
    Skip       - 跳过当前阶段并继续
    Rollback   - 回滚到之前的快照
    Abort      - 终止整个计划
```

---

## 完成计划

所有阶段完成后:

```bash
# 查看统计信息
ccautorun stats vitest-setup-20250107

# 归档计划
ccautorun archive vitest-setup-20250107
```

---

## 常用命令速查表

| 命令 | 用途 | 示例 |
|---------|---------|---------|
| `init` | 初始化项目 | `ccautorun init --setup-hooks` |
| `doctor` | 检查环境 | `ccautorun doctor` |
| `list` | 列出所有计划 | `ccautorun list` |
| `status` | 查看计划状态 | `ccautorun status <plan-id>` |
| `watch` | 监控进度 | `ccautorun watch <plan-id>` |
| `pause` | 暂停执行 | `ccautorun pause <plan-id>` |
| `resume` | 恢复执行 | `ccautorun resume <plan-id>` |
| `logs` | 查看日志 | `ccautorun logs <plan-id>` |
| `recover` | 从错误恢复 | `ccautorun recover <plan-id>` |
| `archive` | 归档计划 | `ccautorun archive <plan-id>` |

---

## 下一步

完成第一个计划后，继续探索:

- **[核心概念](./CORE_CONCEPTS_CN.md)** - 理解执行计划、会话和架构
- **[命令参考](./COMMAND_REFERENCE_CN.md)** - 完整的命令列表
- **[配置指南](./CONFIGURATION_CN.md)** - 自定义 ccAutoRun 行为
- **[任务模板](./TEMPLATES.md)** - 常见任务的预建模板
- **[最佳实践](./BEST_PRACTICES_CN.md)** - 有效使用的技巧
- **[常见问题](./FAQ.md)** - 常见问题解答

---

## 故障排查

### Hook 未触发

```bash
# 重新配置 hooks
ccautorun init --setup-hooks

# 验证
ccautorun doctor
```

### 权限被拒绝

```bash
# 修复权限 (macOS/Linux)
chmod -R u+rwX .ccautorun/
```

### 自动继续不工作

```bash
# 检查配置
cat .ccautorun/config.yaml | grep auto_continue
# 应显示: enabled: true

# 检查 hooks
cat .claude/hooks.yaml | grep enabled
# 应显示: enabled: true
```

---

## 获取帮助

- **问题反馈**: [报告 Bug](https://github.com/yourusername/ccautorun/issues)
- **讨论交流**: [提问](https://github.com/yourusername/ccautorun/discussions)
- **文档**: 浏览 [docs/](.) 中的所有文档

---

**[← 返回 README](../README_CN.md)** | **[核心概念 →](./CORE_CONCEPTS_CN.md)** | **[English Version](./GETTING_STARTED.md)**

# 🤖 ccAutoRun v2.0

[![npm version](https://img.shields.io/npm/v/ccautorun.svg)](https://www.npmjs.com/package/ccautorun)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-blue.svg)](https://github.com/yourusername/ccautorun)

**一款 AI 驱动的 Claude Code 任务自动化工具,将复杂的开发任务转化为自动执行的工作流。**

ccAutoRun v2.0 将 Claude Code 从交互式助手升级为全自动任务执行器。通过 AI 生成智能执行计划,然后让系统自动分阶段执行——你可以专注于更重要的工作。

---

## ✨ v2.0 的独特之处

### 🤖 AI 生成执行计划
- Claude 自动生成**完整、结构化的执行计划**
- 根据任务复杂度自动选择架构(拆分式或单文件)
- 内置验证确保计划质量和效率
- 不再需要手动拆解复杂任务

![演示:AI 计划生成](docs/assets/demo-plan-generation.gif)
<!-- TODO: 录制 GIF 展示 /plan 命令生成多阶段计划的过程 -->

### 🔄 真正的零人工干预自动化
- 基于 Hook 的自动继续机制——自动进入下一阶段
- 无需手动执行 `/clear` 命令或复制粘贴
- 安全限制防止失控执行
- 支持暂停/恢复,优雅中断

![演示:自动继续执行](docs/assets/demo-auto-continue.gif)
<!-- TODO: 录制 GIF 展示自动阶段切换过程 -->

### 📊 智能架构选择
- **拆分架构**:适合复杂任务(>3 阶段,>2500 行)
  - 只加载当前阶段 → 节省 90%+ Token
  - 每个阶段独立文件,清晰明了
- **单文件架构**:适合简单任务(≤3 阶段,<2500 行)
  - 所有内容在一个 EXECUTION_PLAN.md 中
  - 快速生成和执行
- **自动选择**:AI 智能选择最佳架构,也可手动指定

![演示:架构选择](docs/assets/demo-architecture-choice.gif)
<!-- TODO: 录制 GIF 展示架构选择选项 -->

### 🛡️ 生产级安全保障
- **沙箱模式**:文件访问和命令执行限制
- **安全限制器**:可配置阶段限制,强制人工审查
- **快照系统**:每个阶段前自动备份
- **错误恢复**:支持重试/跳过/回滚
- **审计日志**:记录所有操作,满足安全合规

---

## 🚀 快速开始(5 分钟)

### 安装

```bash
npm install -g ccautorun
```

### 首次设置

```bash
# 在项目中初始化
cd /path/to/your/project
ccautorun init --setup-hooks

# 这会:
# ✓ 创建 .ccautorun/ 目录
# ✓ 配置 Claude Code hooks
# ✓ 设置默认配置
# ✓ 你就可以开始了!
```

### 生成第一个计划

在 Claude Code 中使用 `/plan` 斜杠命令:

```
/plan 我需要将认证模块从 session 重构为 JWT token
```

Claude 会:
1. 分析你的代码库
2. 生成多阶段执行计划
3. 选择最优架构
4. 保存计划到 `.ccautorun/plans/`

### 执行计划

Claude 会自动开始执行计划。系统会:
- ✅ 执行第 1 阶段
- ✅ 自动继续到第 2 阶段
- ✅ 自动继续到第 3 阶段
- ⏸️ 在安全限制处暂停,等待你审查

关键节点时你会收到桌面通知!

---

## 🎯 核心功能

### 面向用户
- **📋 任务模板**:使用预置模板快速开始(重构、新功能、修 Bug、文档)
- **🔔 桌面通知**:无需持续关注,自动通知你
- **📊 实时进度**:watch 模式显示进度条和预计完成时间
- **🩺 智能诊断**:`doctor` 命令检查环境并排查问题
- **📝 丰富日志**:详细日志,支持轮转,方便查看

### 面向高级用户
- **⚡ 手动触发**:使用 `trigger` 命令覆盖自动继续
- **🔄 暂停/恢复**:优雅地中断和继续任务
- **↩️ 错误恢复**:重试失败的阶段或回滚到快照
- **⏭️ 阶段控制**:跳过阶段或跳转到特定位置
- **📈 统计信息**:跟踪执行时间、成功率和效率

### 面向团队
- **🔒 安全审计**:完整的操作审计追踪
- **📋 配置管理**:集中配置,带验证
- **🔄 版本迁移**:使用 `migrate` 命令平滑升级
- **🗂️ 归档系统**:整理已完成的计划

---

## 📖 文档

- **[快速开始指南](docs/QUICK_START.md)** - 10 分钟上手
- **[用户指南](docs/GUIDE.md)** - 完整命令参考和工作流
- **[任务模板](docs/TEMPLATES.md)** - 常见任务的预置模板
- **[常见问题](docs/FAQ.md)** - 常见问题和解答
- **[故障排查](docs/TROUBLESHOOTING.md)** - 解决常见问题
- **[架构文档](docs/architecture/)** - 设计决策深度剖析

---

## 🎨 使用场景

### 1. 大规模重构
```
/plan 将整个 API 层重构为使用 TypeScript 装饰器进行验证
```
- 自动生成 7 阶段计划
- 有条不紊地逐文件执行
- 每个阶段前创建快照
- 优雅处理错误

### 2. 功能开发
```
/plan 实现用户个人页面,包含头像上传、简介编辑和活动动态
```
- 分解为 UI、后端、测试
- 创建全面计划
- 每步都有验证

### 3. 文档生成
```
/plan --template docs 为所有 /api 端点生成 API 文档
```
- 使用预置模板
- 快速生成和执行
- 格式统一

### 4. Bug 修复和测试
```
/plan 修复用户会话处理中的竞态条件并添加回归测试
```
- 识别根本原因
- 实施修复
- 添加完整测试
- 验证修复

---

## 🔧 命令参考

### 基础命令

```bash
# 初始化项目
ccautorun init [--setup-hooks] [--enable-hooks]

# 列出所有计划
ccautorun list [--status <status>]

# 检查计划状态
ccautorun status [plan-id]

# 验证计划质量
ccautorun validate <plan-id>

# 实时监控进度
ccautorun watch <plan-id>

# 查看日志
ccautorun logs [plan-id] [--tail] [-f]
```

### 控制命令

```bash
# 暂停自动继续
ccautorun pause [plan-id]

# 恢复自动继续
ccautorun resume [plan-id]

# 跳过某个阶段
ccautorun skip <plan-id> <stage-number>

# 重试失败的阶段
ccautorun retry <plan-id> [stage-number]

# 手动触发下一阶段
ccautorun trigger <plan-id>

# 从错误中恢复
ccautorun recover <plan-id>
```

### 管理命令

```bash
# 诊断问题
ccautorun doctor

# 管理配置
ccautorun config [--get <key>] [--set <key> <value>] [--list]

# 查看统计
ccautorun stats [plan-id]

# 归档已完成的计划
ccautorun archive <plan-id>

# 迁移配置
ccautorun migrate

# 安全审计
ccautorun audit [--check-deps] [--check-files] [--check-config]
```

### 斜杠命令(在 Claude Code 中)

```
# 生成计划(AI 自动选择架构)
/plan <任务描述>

# 强制使用拆分架构(适合复杂任务)
/plan --force-split <任务描述>

# 强制使用单文件架构(适合简单任务)
/plan --force-single <任务描述>

# 使用模板
/plan --template refactor <任务描述>
/plan --template feature <任务描述>
/plan --template bugfix <任务描述>
/plan --template docs <任务描述>
```

---

## 🏗️ 架构选择指南

### 何时使用拆分架构

**适合场景:**
- 复杂的多阶段任务(4+ 阶段)
- 大型代码库(>10,000 行)
- 需要详细规划的任务
- 长时间运行的重构

**优势:**
- 节省 90%+ Token(只加载当前阶段)
- 更好的组织(每个阶段一个文件)
- 更容易审查和修改
- 轻松扩展到 20+ 阶段

**示例:** 重构认证系统、迁移到新框架

### 何时使用单文件架构

**适合场景:**
- 简单任务(≤3 阶段)
- 快速修复或更新
- 明确定义的聚焦任务
- 小范围变更

**优势:**
- 生成更快
- 更容易纵览全局
- 文件管理更简单
- 快速修改

**示例:** 更新配置文件、修复特定 Bug、生成简单文档

### 自动选择(推荐)

让 Claude 选择最佳架构:

```
/plan <你的任务>
```

Claude 会分析:
- 任务复杂度
- 预计代码行数
- 需要的阶段数量
- 你的项目规模

然后自动选择最优架构!

---

## 🛡️ 安全与安全保障

### 沙箱模式(默认)

- **文件访问控制**:仅限访问项目目录
- **命令白名单**:仅允许安全命令(git、npm、node)
- **敏感文件保护**:自动排除 .env、凭证、密钥
- **审计日志**:所有操作都记录供审查

### 安全限制

- **阶段限制**:执行 N 个阶段后暂停(默认:3)等待人工审查
- **执行超时**:防止阶段卡死
- **快照备份**:每个阶段前自动备份
- **错误检测**:遇到严重错误时停止

### 危险模式

为需要不受限访问的高级用户:

```bash
# 谨慎使用!
ccautorun init --dangerously-skip-permissions
```

⚠️ **警告**:仅在完全信任计划时使用!

---

## 🧪 测试

ccAutoRun v2.0 拥有全面的测试覆盖:

```bash
# 运行所有测试
npm test

# 运行特定测试套件
npm run test:unit          # 单元测试(51+ 用例)
npm run test:integration   # 集成测试(36+ 用例)
npm run test:e2e          # 端到端测试(3+ 用例)

# Watch 模式
npm run test:watch

# 覆盖率报告
npm run test:coverage      # 73%+ 覆盖率
```

---

## 🤝 贡献

欢迎贡献!请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解指南。

### 开发环境设置

```bash
git clone https://github.com/yourusername/ccautorun.git
cd ccautorun
npm install
npm test

# 在开发环境运行
npm link
ccautorun --version
```

### 运行测试

```bash
npm test                    # 运行所有测试
npm run test:watch         # Watch 模式
npm run test:coverage      # 生成覆盖率报告
```

---

## 📄 许可证

MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

---

## 🙏 致谢

- 为 Anthropic 的 [Claude Code](https://claude.ai/code) 打造
- 受 AI 辅助开发中对智能自动化需求的启发
- 感谢社区的反馈和测试

---

## 📞 支持

- **文档**: [docs/](docs/)
- **问题反馈**: [GitHub Issues](https://github.com/yourusername/ccautorun/issues)
- **讨论**: [GitHub Discussions](https://github.com/yourusername/ccautorun/discussions)

---

## 🌟 v2.0 的新特性

### 相比 v1.0(PowerShell/Bash 脚本)

- ✅ **纯 Node.js**:真正的跨平台一致性
- ✅ **AI 计划生成**:不再需要手动编写计划
- ✅ **双架构支持**:自动或手动选择
- ✅ **丰富的 CLI**:15+ 命令完全掌控
- ✅ **错误恢复**:重试、跳过或回滚
- ✅ **生产就绪**:95+ 测试,73%+ 覆盖率
- ✅ **更好的用户体验**:进度条、通知、实时监控

### 关键改进

| 功能 | v1.0 | v2.0 |
|------|------|------|
| 计划生成 | 手动 | AI 生成 |
| 架构 | 仅单文件 | 双架构(拆分/单文件) |
| 跨平台 | 脚本(PS/Bash) | 纯 Node.js |
| 命令数量 | 3 | 15+ |
| 错误处理 | 基础 | 高级(重试/回滚) |
| 测试 | 无 | 95+ 测试,73% 覆盖率 |
| 实时监控 | 无 | 有(watch 命令) |
| 配置 | 手动 | 验证的 YAML |

---

## 🗺️ 路线图

### v2.1(未来)

- **多任务并行执行**:同时运行多个计划
- **插件系统**:通过自定义 hooks 和集成扩展功能
- **云端同步**:跨设备备份和共享计划
- **Web 仪表板**:可视化进度跟踪和计划管理
- **团队协作**:共享计划和执行

---

**用 ❤️ 为 Claude Code 社区打造**

**将复杂任务转化为自动执行的工作流!** 🚀

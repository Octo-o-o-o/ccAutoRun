# Stage 7: 文档编写和发布准备 🔄

**[← 返回主计划](../../EXECUTION_PLAN.md)** | **[← Stage 5.5](stage-5.5.md)**

---

## 📋 阶段信息

- **阶段编号**: Stage 7
- **预计时间**: 3-4小时
- **依赖**: Stage 5.5
- **状态**: ⏳ 待开始

### 🎯 目标
编写完整的**中英文双语文档**（README + 模板），准备GitHub发布

**明确双语范围**：
- ✅ 双语：README.md, README_CN.md, 计划模板（examples/）
- ❌ 仅英语：CLI 输出、代码注释、配置文件注释、GUIDE/QUICKSTART

### 📝 任务清单
- [ ] 编写 `README.md` (英文)
  - 项目介绍和价值主张
  - **可视化演示**（占位符）：
    - `docs/assets/demo-plan-generation.gif` - 计划生成流程
    - `docs/assets/demo-auto-continue.gif` - 自动继续演示
    - `docs/assets/demo-architecture-choice.gif` - 架构选择
    - 占位符：`![Demo](docs/assets/demo-xxx.gif) <!-- TODO: Record GIF -->`
  - 快速开始（5分钟上手）
  - 核心特性列表（重点突出创新）：
    - **智能架构选择**：自动判断或手动指定拆分/单文件架构
    - **零人工干预**：--dangerously-skip-permissions自动跳过权限确认
    - **任务模板系统**：快速开始常见任务类型
    - **完善的诊断工具**：doctor 命令帮助排查问题
  - 安装方法
  - 基本使用示例：
    - `/plan` 默认自动判断
    - `/plan --force-split` 强制拆分
    - `/plan --template refactor` 使用模板
  - 架构选择指南（何时用拆分、何时用单文件）
  - 链接到详细文档
  - Badge（npm version, license, etc）
- [ ] 编写 `README_CN.md` (中文)
  - 与英文版对应的所有内容
  - 包含相同的 GIF 占位符
- [ ] 编写 `docs/QUICKSTART.md` (仅英语)
  - 详细的快速入门教程
  - 从零到第一个自动化任务
  - 常见问题解答
  - 包括 doctor 命令使用
- [ ] 编写 `docs/GUIDE.md` (仅英语)
  - 完整使用指南
  - 所有命令详解（包括新命令：pause/resume/skip/retry/trigger/stats/migrate）
  - 高级功能（模板、配置、Hook）
  - 最佳实践
  - 故障排查（使用 doctor）
- [ ] 编写 `docs/EXAMPLES.md` (仅英语)
  - 真实场景案例
  - 重构、文档生成、新功能开发
  - 每个案例包含：背景、计划、执行过程、结果
- [ ] 创建双语示例计划（examples/）
  - `examples/refactor-auth/README.md` (中英文双语)
  - `examples/refactor-auth/README_EN.md`
  - `examples/api-documentation/README.md` (中英文双语)
  - `examples/api-documentation/README_EN.md`
  - `examples/config-update.md` (中英文双语，单文件)
  - 示例作为模板学习的范本
- [ ] 编写 `CHANGELOG.md`
  - v2.0.0 发布说明
  - 与v1.0的区别
- [ ] 编写 `CONTRIBUTING.md`
  - 如何贡献代码
  - 开发环境设置
  - 代码规范
  - 提交PR流程
- [ ] 创建 `LICENSE` 文件 (MIT)
- [ ] 创建 `.github/` 目录
  - `ISSUE_TEMPLATE/bug_report.md`
  - `ISSUE_TEMPLATE/feature_request.md`
  - `PULL_REQUEST_TEMPLATE.md`
- [ ] 更新 `package.json`
  - 完整的description, keywords
  - repository, bugs, homepage URL
  - author信息
- [ ] 准备npm发布
  - 创建 `.npmignore`
  - 测试本地安装：`npm link`
  - 测试发布：`npm publish --dry-run`
- [ ] 准备GitHub Topics标签
  - claude-code, automation, ai-tools, developer-tools
  - workflow, productivity, nodejs

### ✅ 完成标准
- [ ] README清晰易懂，5分钟能看明白
- [ ] **README 包含 GIF 占位符**，注释清楚需要录制
- [ ] README 突出新功能（模板、doctor、pause/resume等）
- [ ] **双语范围明确**：只有 README 和 examples 双语，其他仅英语
- [ ] README_CN.md 与 README.md 内容对等
- [ ] 所有文档无拼写错误
- [ ] QUICKSTART可以让新手成功完成第一个任务（包含 doctor）
- [ ] GUIDE覆盖所有功能（包括所有新命令）
- [ ] 示例真实且高质量，**双语版本完整**
- [ ] package.json信息完整，包含所有新依赖（ajv）
- [ ] MIT License正确
- [ ] GitHub模板文件齐全
- [ ] npm发布测试通过（包含 --dry-run）

### 📤 预期输出
- [ ] `README.md` (1500-2000词，含 GIF 占位符）
- [ ] `README_CN.md` (1500-2000字，含 GIF 占位符）
- [ ] `docs/assets/` 目录（占位符）：
  - `.gitkeep` 或占位说明
  - 预留 demo-*.gif 位置
- [ ] `docs/QUICKSTART.md` (1000-1500词，仅英语）
- [ ] `docs/GUIDE.md` (4000-5000词，仅英语，新增命令文档）
- [ ] `docs/EXAMPLES.md` (2000词，仅英语）
- [ ] `examples/` 目录：
  - `refactor-auth/README.md` + `README_EN.md` (双语)
  - `api-documentation/README.md` + `README_EN.md` (双语)
  - `config-update.md` + `config-update_EN.md` (双语)
- [ ] `CHANGELOG.md` (英语)
- [ ] `CONTRIBUTING.md` (英语)
- [ ] `LICENSE` (MIT)
- [ ] `.github/` 目录下所有模板

### ⚠️ 注意事项
- **明确双语范围**：只有 README 和 examples 双语，避免维护负担
- **GIF 占位符格式统一**：使用 `<!-- TODO: Record GIF -->` 注释
- 文档语言要简洁、友好、专业
- 中文避免过度翻译腔，要自然
- 示例要经过实际测试验证
- README是项目门面，必须精心打磨
- **突出新功能**：模板系统、doctor、pause/resume、stats、migrate
- 确保所有链接有效
- 考虑SEO（npm搜索、GitHub搜索）
- **GUIDE 必须完整**：覆盖所有新增的命令和功能
- examples 作为高质量范本，需精心编写

### 🧪 验证命令
```bash
# 检查markdown格式
npx markdownlint README.md

# 检查拼写
npx cspell "**/*.md"

# 测试npm打包
npm pack

# 测试本地安装
npm link
ccautorun --version

# 模拟发布
npm publish --dry-run
```

---

## 📝 v2.0 改进总结

### 新增命令（Stage 2a & 2b）
- `ccautorun init --setup-hooks` - 初始化项目并自动配置 Claude Code hooks（2a，关键！）
- `ccautorun edit <task>` - 快捷编辑任务计划（2a）
- `ccautorun validate <task>` - 验证计划文档格式和质量（2a，关键！）
- `ccautorun recover <task>` - 错误恢复，从 failed 状态恢复（2a，关键！）
- `ccautorun watch <task>` - 实时进度监控和可视化（Stage 5，关键！）
- `ccautorun doctor` - 诊断工具，检查环境配置（2a）
- `ccautorun pause <task>` - 暂停任务自动继续（2b）
- `ccautorun resume <task>` - 恢复任务自动继续（2b）
- `ccautorun skip <task> <stage>` - 跳过指定 Stage（2b）
- `ccautorun retry <task> [stage]` - 重试失败的 Stage（2b）
- `ccautorun logs <task>` - 查看任务日志（2b）
- `ccautorun stats` - 显示统计信息（2b）
- `ccautorun trigger <task>` - 手动触发下一 Stage（Stage 3）
- `ccautorun migrate` - 配置版本迁移（Stage 5）
- `ccautorun config --get/--set/--list` - 增强配置命令（Stage 5）

### 自动化增强（Stage 2a）
- **交互式 Onboarding**：首次运行时的引导流程
  - 欢迎界面和快速启动选项
  - 自动引导用户完成初始化
- **Hook 自动配置**（关键！）：
  - `--setup-hooks` 自动创建并配置 `.claude/hooks.yaml`
  - `--enable-hooks` 自动启用 auto-continue hook
  - 智能检测现有配置，避免覆盖

### 核心增强（Stage 3）
- **Hook 三层降级策略**（关键！）：
  - 主策略：解析 transcript 最后 100 行，匹配 `[STAGE_COMPLETE:N]` 标记
  - 降级策略1：检查独立标记文件（`.ccautorun/sessions/<task>.stage-complete`）
  - 降级策略2：检查计划文档修改时间（15秒内修改视为完成）
  - 最终降级：发送桌面通知提醒用户手动继续
- **任务失败状态支持**（关键！）：
  - 新增 `failed` 状态，记录 `lastError` 字段
  - 检测错误模式（error/failed/exception 等）
  - 严重错误时停止自动继续，发送通知
  - 提示用户使用 `retry` 或 `recover` 命令
- **原子写入机制**（关键！）：
  - 先写入临时文件（`.json.tmp`）
  - 使用 `fs.renameSync()` 原子替换
  - 避免数据损坏，确保会话状态一致性
- **session-manager 简化**：从 150 行简化为 60 行
- **Stage 文件名强制精确匹配**：避免 backup 文件冲突

### AI 流程改进（Stage 4）
- **移除参数预处理器**：简化架构，直接在 slash command 中解析参数
- **Phase 6 验证集成**（关键！）：
  - AI 调用 `ccautorun validate` 命令验证计划质量
  - 检查配置头、文件命名、内容结构
  - 检查 Token 效率（拆分架构 < 1500 tokens/stage）
  - 验证失败时提供修复建议
- **模板系统**：支持任务模板（refactor/feature/bugfix/docs）
- **双架构支持完善**：AI 自动判断 + 用户强制指定

### 用户体验提升（Stage 5）
- **实时进度监控**（关键！）：
  - `watch` 命令默认开启（执行任务时自动启动）
  - 显示进度条、百分比、已用时间、预计剩余时间
  - 使用 chokidar 监控文件变化，实时更新
  - 状态变化通知（Stage 完成/错误/任务完成）
- **通知系统增强**：
  - 统一通知接口（progress/error/complete/warning）
  - 集成到 Hook，自动发送通知
  - 可配置通知频率
- **日志轮转**（关键！）：
  - 使用 winston-daily-rotate-file
  - 最多保留 30 天或 100MB
  - 按日期归档（execution-2025-01-06.log）
- **配置管理增强**：
  - 支持 --get/--set/--list
  - 交互式配置向导
  - 配置验证（ajv）
- **版本管理**：
  - config.yaml 包含 version 字段
  - 自动迁移命令
  - 启动时版本检查
- **所有命令支持 --dry-run**：预览操作而不执行

### 测试基础设施（Stage 5.5，新增）
- **完整测试覆盖**（70%+）：
  - 单元测试：plan-parser, session-manager, safety-limiter 等（51+ 用例）
  - 集成测试：所有 CLI 命令（36+ 用例）
  - Hook 测试：三层降级策略、错误检测等（15+ 用例）
  - E2E 测试：完整工作流（3+ 用例）
- **Vitest 配置**：
  - ES Modules 支持
  - 覆盖率报告（v8）
  - Watch 模式和 UI 界面
  - 总计 105+ 测试用例，~3,800 行测试代码

### 文档改进（Stage 7）
- **明确双语范围**：只有 README 和 examples 双语
- **GIF 演示占位符**：预留可视化演示位置
- **完整的命令文档**：覆盖所有新增命令（15 个新命令）

### 删除功能
- **删除 monitor 命令**：通知功能内置到 Hook，无需单独命令
- **删除参数预处理器**：简化架构，直接在 slash command 中处理

### 设计决策
- **并发控制**：不添加文件锁，复杂度过高，场景极少
- **会话存储**：不使用 SQLite，使用原子文件写入（兼容性更好）
- **版本迁移**：简单处理，只处理字段添加
- **模板系统**：使用 slash command 而非 CLI
- **错误处理**：统一使用 error-handler，包含错误码和修复建议
- **测试工具**：使用 Vitest（而非 Jest），更快且对 ES Modules 支持更好

---

## 🎉 最终检查清单

### 功能完整性
- [ ] 所有 7 个阶段完成（Stage 1 到 Stage 7，包括 Stage 5.5）
- [ ] **所有 15 个新增命令实现并测试**：
  - [ ] init --setup-hooks / --enable-hooks（hook 自动配置）
  - [ ] edit（快捷编辑）
  - [ ] validate（计划验证，关键！）
  - [ ] recover（错误恢复，关键！）
  - [ ] watch（实时进度监控，关键！）
  - [ ] doctor（诊断工具）
  - [ ] pause/resume（暂停恢复）
  - [ ] skip（跳过 Stage）
  - [ ] retry（重试失败）
  - [ ] logs（查看日志）
  - [ ] stats（统计信息）
  - [ ] trigger（手动触发）
  - [ ] migrate（配置迁移）
  - [ ] config --get/--set/--list（配置管理）
- [ ] **Hook 三层降级策略验证**（关键！）：
  - [ ] 主策略：transcript 标记检测
  - [ ] 降级1：独立标记文件
  - [ ] 降级2：文件修改时间
  - [ ] 最终降级：用户通知
- [ ] **任务失败状态支持验证**（关键！）：
  - [ ] failed 状态记录和 lastError 字段
  - [ ] 错误检测和自动停止
  - [ ] recover 和 retry 命令恢复
- [ ] **原子写入机制验证**：tmp + rename 工作正常
- [ ] **Phase 6 验证集成**：AI 调用 validate 命令
- [ ] 模板系统可用（4个模板：refactor/feature/bugfix/docs）
- [ ] 配置验证工作正常（ajv）
- [ ] 版本迁移测试通过
- [ ] **通知系统在 Hook 中正常工作**：
  - [ ] progress/error/complete/warning 通知
  - [ ] 可配置频率
- [ ] **日志轮转工作正常**（winston-daily-rotate-file）
- [ ] **watch 命令实时监控**（默认开启）
- [ ] **所有命令 --dry-run 支持**

### 代码质量
- [ ] 代码质量检查通过（ESLint）
- [ ] session-manager 已简化（约60行）
- [ ] 错误处理统一使用 error-handler
- [ ] Windows 兼容性验证（使用 Node.js API）
- [ ] 无 SQLite 依赖（使用原子文件写入）

### 测试完整性（Stage 5.5）
- [ ] **Vitest 配置完成**
- [ ] **105+ 测试用例全部通过**：
  - [ ] 单元测试（51+ 用例）
  - [ ] 集成测试（36+ 用例）
  - [ ] Hook 测试（15+ 用例，包括三层降级）
  - [ ] E2E 测试（3+ 用例）
- [ ] **测试覆盖率达到 70%+**
- [ ] 覆盖率报告生成正常
- [ ] 所有测试在 CI 环境可运行
- [ ] 测试运行时间 < 30 秒（不含 E2E）
- [ ] 没有 flaky tests

### 文档完整性
- [ ] README.md 和 README_CN.md 完整（含 GIF 占位符）
- [ ] QUICKSTART.md 和 GUIDE.md 完整（仅英语）
- [ ] examples 双语版本完整（3个示例）
- [ ] **所有 15 个新命令在 GUIDE 中有文档**
- [ ] CHANGELOG.md 记录所有改进（包括测试、新命令、三层降级等）

### 真实场景验证
- [ ] 在 Mac/Win/Linux 上测试过
- [ ] npm 本地安装测试通过（npm link）
- [ ] npm 发布测试通过（--dry-run）
- [ ] **完整工作流测试**：
  - [ ] init --setup-hooks 自动配置
  - [ ] /plan 生成计划（拆分架构）
  - [ ] validate 验证计划
  - [ ] 执行任务（watch 实时监控）
  - [ ] Hook 三层降级策略
  - [ ] 错误恢复（recover/retry）
  - [ ] 任务完成
- [ ] **Hook 降级策略测试**（3 层全部验证）
- [ ] **failed 状态测试**（错误检测和恢复）
- [ ] **原子写入测试**（并发安全性）
- [ ] **日志轮转测试**（长时间运行）
- [ ] 配置迁移测试（旧版本 → v2.0）
- [ ] 使用模板生成计划（refactor/feature/bugfix/docs）
- [ ] doctor 诊断所有问题类型

### 发布准备
- [ ] Git 历史清晰（每个 Stage 一个 commit）
- [ ] package.json 包含所有依赖：
  - [ ] commander, chokidar, node-notifier, yaml, chalk, ora, inquirer, glob, ajv
  - [ ] winston, winston-daily-rotate-file
  - [ ] vitest, @vitest/ui（devDependencies）
- [ ] .npmignore 正确（排除 tests/, docs/, examples/）
- [ ] GitHub Topics 标签设置
- [ ] CI/CD 配置（GitHub Actions for tests）
- [ ] 准备好发布到 GitHub
- [ ] 准备好发布到 npm

---

## 📝 使用说明

### 执行方式（手动多窗口）

由于会话上下文限制，建议：

1. **第一个会话** - Stage 1
   ```
   @EXECUTION_PLAN.md 请执行Stage 1
   ```

2. **第二个会话** - Stage 2（新窗口）
   ```
   @EXECUTION_PLAN.md 请执行Stage 2
   ```

3. 依次类推...

### 每个Stage完成后

```bash
# 测试验证
[运行验证命令]

# Git提交
git add .
git commit -m "feat(stage-N): [简要描述]"
```

### 遇到问题时

1. 运行诊断：`ccautorun doctor`
2. 查看日志：`ccautorun logs <task-name>` 或 `tail -f .ccautorun/logs/execution.log`
3. 检查状态：`ccautorun status <task-name>`
4. 在新窗口请求帮助，@这个计划文档

### 重要提醒

**避免并发操作**：
- 不要在多个 Claude Code 会话中同时操作同一任务
- 如果必须切换会话，先使用 `ccautorun pause <task>` 暂停
- 切换回来后使用 `ccautorun resume <task>` 恢复
- 虽然没有文件锁保护，但正常使用不会有问题

---

## 🔧 技术决策记录

### 为什么纯Node.js？
- ✅ 跨平台一致性
- ✅ npm生态丰富
- ✅ 易于分发和安装
- ✅ 维护成本低

### 为什么移除Slash模式？
- ✅ Hook模式更彻底自动化
- ✅ 减少实现复杂度
- ✅ 更易理解和维护

### 为什么 `/plan` 是核心？
- ✅ 高质量计划是自动化成功的前提
- ✅ AI生成 > 手动编写
- ✅ 降低用户门槛

### 为什么任务驱动而非项目驱动？
- ✅ 更符合真实场景（现有项目的具体任务）
- ✅ 支持多任务并行
- ✅ 灵活性更高

### 为什么支持双架构（拆分+单文件）？
- ✅ **灵活性**：简单任务用单文件更直接，复杂任务用拆分更高效
- ✅ **Token效率**：拆分架构节省90%+ token（只加载当前stage）
- ✅ **用户体验**：AI自动判断 + 用户可强制指定 = 最佳平衡
- ✅ **向后兼容**：支持现有单文件计划，平滑迁移
- ❌ **不强制拆分**：避免为简单任务增加不必要的复杂度

判断标准：
- **单文件适合**：Stage≤3, 总行数<2500, 任务简单（配置更新、文档生成等）
- **拆分架构适合**：Stage>3, 总行数≥2500, 任务复杂（重构、新功能开发等）

### 为什么使用 --dangerously-skip-permissions？
- ✅ **自动化核心**：没有这个，Hook自动继续会被权限弹窗中断
- ✅ **用户已授权**：用户手动启动第一个stage = 信任整个计划
- ✅ **可配置**：担心安全的用户可以关闭（但会失去自动化）
- ⚠️  **安全边界清晰**：
  - ✅ 允许：计划文档来自用户自己或可信源
  - ❌ 禁止：执行未经审查的第三方计划
  - 📝 文档中明确说明安全注意事项

---

**准备开始执行Stage 1了吗？**

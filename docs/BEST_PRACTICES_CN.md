# 最佳实践

> 有效使用 ccAutoRun 的技巧和技术

[English Version](./BEST_PRACTICES.md) | [配置](./CONFIGURATION_CN.md)

---

## 📋 目录

- [计划设计](#计划设计)
- [执行监控](#执行监控)
- [错误处理](#错误处理)
- [安全](#安全)
- [性能](#性能)
- [团队协作](#团队协作)

---

## 计划设计

### 编写清晰的任务描述

❌ **不好:**
```
/plan 优化代码
```

✅ **好:**
```
/plan 优化主页加载性能

当前问题:
- 加载时间: 3.5秒 (Lighthouse 分数: 45)
- 大型未优化图片 (平均每张 2MB)
- 无代码分割,bundle 大小 5MB

目标:
- 加载时间 < 1.5秒 (Lighthouse > 85)
- 图片: WebP + 懒加载
- 实现代码分割

技术栈: React 18 + Webpack 5
```

**为什么重要:** 具体的描述会导致更好的 AI 生成计划,具有准确的阶段分解和时间估算。

---

### 分解大型任务

❌ **不好:**
```
单个巨大的计划:
- 阶段 1: 重构整个代码库 (2000+ 行)
```

✅ **好:**
```
多个聚焦的计划:
计划 1: 重构认证模块 (300 行)
计划 2: 重构 API 层 (400 行)
计划 3: 重构数据库模型 (250 行)
```

**为什么重要:**
- 更容易审查和验证
- 降低错误风险
- 可以跨团队成员并行化

---

### 包含验证步骤

✅ **始终包含:**
```
阶段 4: 测试和验证
- 运行现有测试套件
- 添加新测试用例
- 手动测试清单
- 性能基准
```

❌ **永远不要跳过:**
- 测试阶段
- 代码审查检查点
- 验证标准

---

### 使用描述性的阶段名称

❌ **不好:**
```
阶段 1: 设置
阶段 2: 实现
阶段 3: 测试
```

✅ **好:**
```
阶段 1: 安装 vitest 并配置测试环境
阶段 2: 创建测试基础设施 (helpers, mocks, fixtures)
阶段 3: 为核心业务逻辑编写单元测试
阶段 4: 配置覆盖率报告和 CI 集成
```

---

## 执行监控

### 始终监控长时间运行的任务

✅ **应该:**
```bash
# 终端 1: 运行 Claude Code
claude

# 终端 2: 监控进度
ccautorun watch <plan-id>

# 终端 3: 如果需要检查日志
ccautorun logs <plan-id> -f
```

❌ **不应该:**
- 完全无人值守地运行计划
- 忽略警告消息
- 跳过进度检查

---

### 在安全暂停时审查

当 ccAutoRun 暂停时:

```bash
# 1. 检查已完成的工作
git status
git diff

# 2. 审查日志
ccautorun logs <plan-id> --tail 100

# 3. 运行测试
npm test

# 4. 如果满意,恢复
ccautorun resume <plan-id>
```

---

### 启用通知

```yaml
# .ccautorun/config.yaml
notifications:
  enabled: true
  sound: true
  progress_frequency: every-stage
```

**通知会提醒您:**
- 阶段完成
- 错误
- 达到安全限制
- 计划完成

---

## 错误处理

### 在跳过之前先重试

当阶段失败时:

```bash
# 1. 查看错误详情
ccautorun logs <plan-id> --tail 100

# 2. 先尝试重试
ccautorun retry <plan-id>

# 3. 仅在以下情况跳过:
#    - 错误已理解
#    - 您已手动修复
#    - 不再需要该阶段
ccautorun skip <plan-id> <stage-number>
```

**恢复策略决策树:**

```
阶段失败
    ↓
是临时错误吗? (网络, 依赖)
    ├─ 是 → 重试
    └─ 否 → 错误已理解吗?
        ├─ 是 → 可以手动修复吗?
        │   ├─ 是 → 修复 → 跳过
        │   └─ 否 → 回滚
        └─ 否 → 检查日志 → 决定
```

---

### 保留快照

```yaml
# .ccautorun/config.yaml
snapshot_retention: 5  # 至少保留 5 个
```

**永远不要:**
- 完全禁用快照
- 在执行期间删除快照目录
- 保留少于 3 个快照

---

### 从失败中学习

恢复后:

```bash
# 1. 记录出了什么问题
echo "阶段 3 因缺少依赖 X 而失败" >> .ccautorun/notes.md

# 2. 更新计划以防止未来失败
code .ccautorun/plans/<plan-id>/EXECUTION_PLAN.md

# 3. 考虑添加验证步骤
```

---

## 安全

### 生产环境永远不要跳过权限

```yaml
# 开发环境: 可以
auto_continue:
  enabled: true
  skip_permissions: true

# 生产环境: 永远不要
auto_continue:
  enabled: true
  skip_permissions: false  # 重要
```

---

### 执行前审查计划

```bash
# 1. 生成计划
/plan 添加用户认证

# 2. 开始前审查
cat .ccautorun/plans/<plan-id>/EXECUTION_PLAN.md

# 3. 检查每个阶段
cat .ccautorun/plans/<plan-id>/stages/01-*.md

# 4. 查找:
#    - 可疑命令
#    - 硬编码的秘密
#    - 破坏性操作
#    - 外部网络调用
```

---

### 运行安全审计

```bash
# 定期审计
ccautorun audit

# 在生产部署前
ccautorun audit --check-deps --check-files --check-config
```

---

### 正确使用 .gitignore

```gitignore
# .gitignore

# 不要提交临时数据
.ccautorun/sessions/
.ccautorun/logs/
.ccautorun/snapshots/

# 可选: 提交计划以供团队共享
# .ccautorun/plans/

# 始终提交 hooks 以保持团队一致性
# .claude/

# 永远不要提交秘密
.env
.env.local
*.key
*.pem
credentials.json
```

---

## 性能

### 对大型任务使用 Split 架构

```yaml
# .ccautorun/config.yaml
default_architecture: split  # 对于复杂项目
```

**何时使用 split:**
- 4+ 阶段
- 每阶段 800+ 行
- 大规模代码库修改

**优势:**
- 90%+ token 节省
- 更快的 Claude 响应
- 更好的上下文管理

---

### 定期清理

```bash
# 清理旧快照 (每周)
ccautorun snapshot clean --older-than 7d

# 归档已完成的计划 (每月)
ccautorun archive --older-than 30d

# 检查磁盘使用
ccautorun stats --disk-usage
```

---

### 优化快照大小

```yaml
# .ccautorun/config.yaml
snapshot_retention: 3  # 如果磁盘空间有限
```

**也添加到 .gitignore:**
```gitignore
node_modules/
.git/
dist/
build/
*.log
```

---

## 团队协作

### 通过 Git 共享计划

```bash
# 设置: 不要忽略计划
# 编辑 .gitignore, 注释掉:
# # .ccautorun/plans/

# 提交计划
git add .ccautorun/plans/
git commit -m "Add authentication feature plan"
git push

# 团队成员拉取并使用
git pull
ccautorun list
```

---

### 创建团队模板

```bash
# 1. 创建成功的计划
/plan 功能 X 实现

# 2. 完成后,保存为模板
mkdir -p .ccautorun/templates/
cp -r .ccautorun/plans/feature-x .ccautorun/templates/feature-template

# 3. 团队成员使用模板
ccautorun plan from-template feature-template
```

---

### 记录决策

创建 `.ccautorun/README.md`:

```markdown
# 团队 ccAutoRun 指南

## 配置标准
- safety_limit: 所有项目 5
- skip_permissions: false (生产环境)

## 命名约定
- 计划: `<type>-<feature>-<date>` (例如 `feature-auth-20250107`)
- 分支: 每个计划创建分支

## 审查流程
1. 生成计划
2. 团队审查 (PR)
3. 批准后执行
4. 合并前审查更改

## 模板
- feature-template: 新功能
- refactor-template: 代码重构
- bugfix-template: Bug 修复
```

---

### 协调计划执行

❌ **不要:**
```bash
# 多人在同一项目中同时运行计划
人员 A: ccautorun run plan-auth
人员 B: ccautorun run plan-api  # ← 文件冲突!
```

✅ **要:**
```bash
# 选项 1: 顺序执行
人员 A: 完成 plan-auth
         ↓
人员 B: 开始 plan-api

# 选项 2: 不同分支
人员 A: git checkout -b feature-auth && ccautorun run plan-auth
人员 B: git checkout -b feature-api && ccautorun run plan-api

# 选项 3: 不同项目
人员 A: cd project-frontend && ccautorun run plan-ui
人员 B: cd project-backend && ccautorun run plan-api
```

---

## 一般技巧

### 从简单开始

1. **第一个计划:** 简单、定义明确的任务 (≤3 阶段)
2. **第二个计划:** 中等复杂度 (4-6 阶段)
3. **高级计划:** 复杂重构 (7+ 阶段)

---

### 先在开发环境测试

```bash
# 1. 在开发分支测试计划
git checkout -b test-plan
ccautorun run plan-id

# 2. 如果成功,在生产环境使用
git checkout main
ccautorun run plan-id
```

---

### 保持计划聚焦

✅ **好:**
```
计划: 添加用户认证
- 阶段 1: 数据库模型
- 阶段 2: 认证 API
- 阶段 3: 前端表单
- 阶段 4: 测试
```

❌ **太宽泛:**
```
计划: 构建整个用户系统
- 阶段 1-5: 认证
- 阶段 6-10: 授权
- 阶段 11-15: 用户配置文件
- 阶段 16-20: 管理面板
```

**替代方案:** 创建 4 个独立计划

---

### 审查和迭代

每个计划后:

1. **什么做得好?**
2. **可以改进什么?**
3. **更新您的个人最佳实践**
4. **与团队分享学习**

---

## 要避免的反模式

❌ **不要:**
- 开始前跳过 doctor 检查
- 忽略安全限制警告
- 过早删除快照
- 在生产环境中使用无限安全限制运行
- 提交敏感数据
- 不审查就执行计划
- 跳过测试阶段
- 忽略错误日志

✅ **要:**
- 定期运行 `ccautorun doctor`
- 尊重安全限制
- 保留快照
- 使用适当的安全限制
- 正确使用 .gitignore
- 执行前审查计划
- 包含全面的测试
- 主动监控日志

---

## 另见

- [配置指南](./CONFIGURATION_CN.md) - 详细的配置选项
- [命令参考](./COMMAND_REFERENCE_CN.md) - 所有命令
- [常见问题](./FAQ.md) - 常见问题
- [故障排查](./TROUBLESHOOTING.md) - 问题解决

---

**[← 配置](./CONFIGURATION_CN.md)** | **[常见问题 →](./FAQ.md)** | **[English Version](./BEST_PRACTICES.md)**

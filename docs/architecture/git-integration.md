# Git 集成策略

## 📋 概述

ccAutoRun 需要完整的 Git 集成策略，确保在自动化执行过程中代码安全、提交清晰、可追溯。

---

## 🔍 启动前检查

### 检查清单
在开始执行任务前（`ccautorun run` 或 Hook 触发时），必须执行以下检查：

```javascript
// src/core/git-checker.js
async function preExecutionCheck() {
  // 1. 检查是否在 Git 仓库中
  if (!isGitRepo()) {
    return {
      ok: false,
      error: 'Not a git repository. Run `git init` first.',
      code: 'E_GIT_001'
    };
  }

  // 2. 检查是否有未提交的更改
  const status = await execAsync('git status --porcelain');
  if (status.trim()) {
    return {
      ok: false,
      error: 'You have uncommitted changes. Commit or stash them first.',
      code: 'E_GIT_002',
      details: status,
      suggestions: [
        'git add . && git commit -m "WIP: before ccAutoRun"',
        'git stash',
        'ccautorun run --allow-dirty (bypass check)'
      ]
    };
  }

  // 3. 检查是否与远程同步（可选）
  const behind = await getBehindCount();
  if (behind > 0) {
    // 只是警告，不阻止执行
    console.warn(`⚠️  Your branch is ${behind} commits behind remote. Consider pulling first.`);
  }

  return { ok: true };
}
```

### 用户选项
- `--allow-dirty`: 跳过未提交更改检查（危险！）
- `--no-git-check`: 完全跳过 Git 检查（用于非 Git 项目）

---

## 🌿 分支管理策略

### 默认策略：当前分支模式（v2.0）
- **行为**：在当前分支上直接工作，不创建新分支
- **适用场景**：
  - 小型个人项目
  - 原型开发
  - 快速迭代
- **优点**：简单直接，无分支切换成本
- **缺点**：无法轻易回滚整个任务

### 实现
```javascript
// src/core/git-manager.js
async function prepareBranch(taskName, options = {}) {
  const currentBranch = await getCurrentBranch();

  // v2.0: 默认使用当前分支
  if (!options.createBranch) {
    logger.info(`Working on current branch: ${currentBranch}`);
    return { branch: currentBranch, created: false };
  }

  // v2.1: 支持自动创建功能分支（未来功能）
  // const branchName = `ccautorun/${taskName}`;
  // await execAsync(`git checkout -b ${branchName}`);
  // return { branch: branchName, created: true };
}
```

### v2.1 路线图：功能分支模式
- `--create-branch`: 自动创建 `ccautorun/<task-name>` 分支
- 任务完成后提示用户合并或创建 PR
- 支持配置默认分支策略（`config.git.branch_strategy: "current" | "feature"`）

---

## 📝 提交消息规范

### 格式标准
遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### 提交类型
- `feat`: 新功能
- `fix`: 修复 Bug
- `refactor`: 重构
- `docs`: 文档更新
- `test`: 测试相关
- `chore`: 构建工具、依赖更新

### ccAutoRun 自动提交格式
```bash
# Stage 完成时的提交
feat(ccautorun): complete stage 3 - implement authentication

Automated by ccAutoRun v2.0
Task: user-auth-feature
Stage: 3/7

Changes:
- Added JWT middleware
- Implemented login/logout endpoints
- Added user session management
```

### 实现
```javascript
// src/core/git-manager.js
function generateCommitMessage(taskName, stageNumber, totalStages, changes) {
  const scope = 'ccautorun';
  const subject = `complete stage ${stageNumber} - ${getStageTitle(stageNumber)}`;

  const body = [
    '',
    `Automated by ccAutoRun v${VERSION}`,
    `Task: ${taskName}`,
    `Stage: ${stageNumber}/${totalStages}`,
    '',
    'Changes:',
    ...changes.map(c => `- ${c}`)
  ].join('\n');

  return `feat(${scope}): ${subject}${body}`;
}
```

### 用户自定义
- 支持 `config.git.commit_template` 自定义模板
- 支持 `--commit-message "..."` 手动指定提交消息

---

## 🔄 增量提交策略

### 何时提交？
1. **每个 Stage 完成后**（默认）
   - Hook 自动触发提交
   - 提交消息包含 Stage 信息

2. **用户手动触发**
   - `ccautorun commit [task-name]`: 提交当前进度
   - 适合中途保存工作

3. **任务完成后**
   - 最后一个 Stage 完成时自动提交
   - 可选：创建 Git tag（`ccautorun-v1.0.0`）

### 提交前检查
```javascript
async function preCommitCheck() {
  // 1. 检查是否有可提交的更改
  const diff = await execAsync('git diff --name-only');
  if (!diff.trim()) {
    logger.info('No changes to commit, skipping...');
    return { skip: true };
  }

  // 2. 检查敏感文件（不提交）
  const sensitiveFiles = [
    '.env', '.env.local', '.env.production',
    'credentials.json', 'secrets.yaml',
    '*.pem', '*.key', '*.cert',
    'id_rsa', 'id_ed25519'
  ];

  const stagedFiles = await execAsync('git diff --cached --name-only');
  for (const pattern of sensitiveFiles) {
    if (micromatch.isMatch(stagedFiles.split('\n'), pattern)) {
      return {
        ok: false,
        error: `Sensitive file detected: ${pattern}`,
        code: 'E_GIT_003',
        suggestion: 'Add it to .gitignore or remove from staging area'
      };
    }
  }

  return { ok: true };
}
```

### 提交流程
```javascript
async function commitStage(taskName, stageNumber) {
  // 1. 检查
  const check = await preCommitCheck();
  if (!check.ok) {
    throw new Error(check.error);
  }
  if (check.skip) return;

  // 2. 暂存所有更改（排除 .ccautorun/ 内部文件）
  await execAsync('git add .');
  await execAsync('git reset .ccautorun/sessions/');  // 排除会话文件

  // 3. 生成提交消息
  const message = generateCommitMessage(taskName, stageNumber, totalStages, [
    // 从 git diff --cached 提取更改摘要
  ]);

  // 4. 提交
  await execAsync(`git commit -m "${escapeShellArg(message)}"`);

  // 5. 记录到日志
  logger.info(`✓ Committed stage ${stageNumber}/${totalStages}`);
}
```

---

## 🚫 .gitignore 规则

### ccAutoRun 专用规则
```gitignore
# ccAutoRun internal files
.ccautorun/sessions/*.json       # 会话状态（敏感）
.ccautorun/logs/*.log            # 日志文件
.ccautorun/snapshots/            # 快照备份（可选：保留用于协作）
.ccautorun/config.yaml           # 用户配置（可选：保留用于协作）

# 保留计划文档（重要！）
!.ccautorun/plans/**/*.md
!.ccautorun/plans/**/README.md
```

### 初始化时自动配置
```javascript
// src/commands/init.js
async function setupGitignore() {
  const gitignorePath = path.join(cwd, '.gitignore');
  const rules = `
# ccAutoRun (added by ccAutoRun init)
.ccautorun/sessions/
.ccautorun/logs/
.ccautorun/snapshots/
`;

  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, rules);
    logger.info('✓ Created .gitignore with ccAutoRun rules');
  } else {
    const content = fs.readFileSync(gitignorePath, 'utf-8');
    if (!content.includes('ccAutoRun')) {
      fs.appendFileSync(gitignorePath, rules);
      logger.info('✓ Updated .gitignore with ccAutoRun rules');
    }
  }
}
```

---

## 🔧 冲突处理

### 检测冲突
```javascript
async function detectConflicts() {
  // 检查是否有 Git 冲突标记
  const files = await execAsync('git diff --name-only --diff-filter=U');
  if (files.trim()) {
    return {
      hasConflicts: true,
      files: files.split('\n').filter(Boolean)
    };
  }
  return { hasConflicts: false };
}
```

### 处理策略
1. **自动执行中检测到冲突**：
   - 立即停止自动继续
   - 设置会话状态为 `failed`
   - 发送通知：提示用户手动解决冲突
   - 提供建议：
     ```
     Git conflict detected! 🚨

     Files with conflicts:
     - src/auth.js
     - src/config.js

     To resolve:
     1. Manually resolve conflicts in the files above
     2. Run: git add <resolved-files>
     3. Run: ccautorun resume <task-name>
     ```

2. **用户解决后恢复**：
   - `ccautorun resume` 检查冲突是否解决
   - 未解决：拒绝恢复，再次提示
   - 已解决：继续执行

---

## 📊 Git 状态监控

### 实时监控（v2.0 简化版）
```javascript
// 只在关键节点检查，不持续监控
async function checkGitStatus() {
  const status = await execAsync('git status --porcelain');
  return {
    clean: !status.trim(),
    files: status.split('\n').filter(Boolean).map(line => ({
      status: line.substring(0, 2),
      path: line.substring(3)
    }))
  };
}
```

### v2.1 增强：持续监控
- 使用 `chokidar` 监控 Git 状态变化
- 检测外部修改（用户手动编辑）
- 提示潜在冲突

---

## 🛡️ 安全措施

### 防止数据丢失
1. **提交前备份**：
   - 每次提交前创建快照（已有机制）

2. **强制推送保护**：
   - v2.0 不支持自动 push
   - v2.1 如果支持，必须禁止 `--force` 推送到 main/master

3. **回滚机制**：
   - `ccautorun rollback <task-name> <stage>`: 回滚到指定 Stage 的提交
   - 使用 `git revert` 而不是 `git reset --hard`（保留历史）

### 敏感信息保护
- 提交前自动扫描敏感文件（已实现于上方）
- 提交消息中不包含密钥、密码等敏感信息
- 日志输出时脱敏 Git URL（隐藏认证信息）

---

## 📦 实现清单

### Stage 1: 基础设施
- [ ] 创建 `src/core/git-manager.js`（200行）
- [ ] 创建 `src/core/git-checker.js`（150行）
- [ ] 创建 `src/utils/git-utils.js`（辅助工具，100行）
- [ ] 在 `init.js` 中添加 `.gitignore` 配置逻辑

### Stage 2a: 集成到命令
- [ ] `ccautorun run` 添加启动前 Git 检查
- [ ] `ccautorun doctor` 添加 Git 状态诊断

### Stage 3: Hook 集成
- [ ] Hook 中添加 Stage 完成后的自动提交
- [ ] 实现提交失败的错误处理

### Stage 2b: 额外命令
- [ ] 实现 `ccautorun commit [task-name]` 手动提交命令
- [ ] 实现 `ccautorun rollback <task-name> <stage>`（v2.1）

---

## 🧪 测试用例

```bash
# 1. 测试启动前检查
cd /tmp/test-project
git init
# 创建未提交的更改
echo "test" > test.txt
ccautorun run my-task
# 应报错：E_GIT_002，提示提交或暂存

# 2. 测试自动提交
# 完成一个 Stage
# 应自动创建提交，消息格式正确

# 3. 测试敏感文件保护
echo "API_KEY=secret" > .env
git add .env
ccautorun commit my-task
# 应报错：E_GIT_003，拒绝提交

# 4. 测试 .gitignore 配置
ccautorun init
cat .gitignore
# 应包含 ccAutoRun 规则

# 5. 测试冲突检测
# 手动创建 Git 冲突
echo "conflict" > conflict.txt
git add conflict.txt
git commit -m "conflict commit"
# 在另一个分支创建冲突并合并
ccautorun resume my-task
# 应检测到冲突并停止
```

---

## 🔗 相关文档
- [错误处理规范](error-handling.md) - Git 错误代码定义
- [Stage 1 设计](../stages/stage-1.md) - `.gitignore` 初始化
- [Stage 3 设计](../stages/stage-3.md) - Hook 自动提交集成

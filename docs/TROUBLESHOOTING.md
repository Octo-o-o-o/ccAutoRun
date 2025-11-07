# 故障排查指南 🔧

> 系统化地诊断和解决 ccAutoRun 使用中的问题

## 🚨 快速诊断

遇到问题时，首先运行：
```bash
ccautorun doctor
```

这会检查：
- ✅ Node.js 版本
- ✅ Claude Code 安装
- ✅ Git 配置
- ✅ Hooks 配置
- ✅ 配置文件完整性
- ✅ 依赖完整性

## 📑 目录

- [安装问题](#安装问题)
- [配置问题](#配置问题)
- [计划生成问题](#计划生成问题)
- [执行问题](#执行问题)
- [Hook 问题](#hook-问题)
- [性能问题](#性能问题)
- [数据恢复](#数据恢复)

---

## 安装问题

### ❌ "npm install -g ccautorun" 失败

**症状**:
```
npm ERR! code EACCES
npm ERR! syscall access
npm ERR! path /usr/local/lib/node_modules
npm ERR! errno -13
```

**原因**: 权限不足

**解决方案1**（推荐）：使用 nvm 管理 Node.js
```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc  # 或 ~/.zshrc

# 安装 Node.js
nvm install 20
nvm use 20

# 重新安装 ccAutoRun
npm install -g ccautorun
```

**解决方案2**：修改 npm 全局目录
```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

npm install -g ccautorun
```

**解决方案3**（不推荐）：使用 sudo
```bash
sudo npm install -g ccautorun
```

---

### ❌ "ccautorun: command not found"

**症状**: 安装后运行 `ccautorun` 显示命令不存在

**诊断**:
```bash
# 检查是否安装成功
npm list -g ccautorun

# 检查全局 bin 目录
npm config get prefix

# 检查 PATH
echo $PATH
```

**解决方案1**: 确保 npm 全局 bin 在 PATH 中
```bash
# 找到 npm 全局 bin 目录
NPM_BIN=$(npm config get prefix)/bin

# 添加到 PATH（永久）
echo "export PATH=\"$NPM_BIN:\$PATH\"" >> ~/.bashrc
source ~/.bashrc
```

**解决方案2**: 使用 npx（无需安装）
```bash
npx ccautorun --version
```

**解决方案3**: 创建软链接
```bash
sudo ln -s $(npm root -g)/ccautorun/bin/ccautorun.js /usr/local/bin/ccautorun
chmod +x /usr/local/bin/ccautorun
```

---

### ❌ "Node.js version too old"

**症状**:
```
❌ Error: ccAutoRun requires Node.js >= 18.0.0
Current version: v16.14.0
```

**解决方案**:
```bash
# 使用 nvm 升级
nvm install 20
nvm use 20
nvm alias default 20  # 设为默认版本

# 验证
node --version  # 应显示 v20.x.x
```

---

## 配置问题

### ❌ "ccautorun init" 失败

**症状1**: "Not a git repository"
```bash
# 解决：初始化 Git 仓库
git init
git add .
git commit -m "Initial commit"

# 然后重新运行
ccautorun init
```

**症状2**: "Claude Code not detected"
```bash
# 检查 Claude Code 是否安装
claude --version

# 如果没有，安装 Claude Code
# 见：https://docs.claude.com/claude-code

# 临时跳过检查（不推荐）
ccautorun init --skip-checks
```

**症状3**: "Permission denied" 创建目录
```bash
# 检查当前目录权限
ls -la

# 修复权限
chmod u+w .

# 或切换到有权限的目录
cd ~/projects/my-project
ccautorun init
```

---

### ❌ 配置文件损坏

**症状**:
```
❌ Error: Invalid config file: .ccautorun/config.json
SyntaxError: Unexpected token } in JSON
```

**诊断**:
```bash
# 查看配置文件
cat .ccautorun/config.json

# 验证 JSON 格式
node -e "console.log(JSON.parse(require('fs').readFileSync('.ccautorun/config.json')))"
```

**解决方案1**: 自动修复
```bash
ccautorun config validate --fix
```

**解决方案2**: 手动修复
```bash
# 编辑配置文件
vi .ccautorun/config.json

# 修复 JSON 语法错误（逗号、引号、括号等）
```

**解决方案3**: 重置配置
```bash
# 备份旧配置
mv .ccautorun/config.json .ccautorun/config.json.backup

# 重新初始化
ccautorun init

# 恢复需要的配置项
# 从 config.json.backup 复制
```

---

### ❌ Hooks 配置不正确

**症状**: 自动继续功能不工作

**诊断**:
```bash
ccautorun doctor

# 查看 Hooks 部分，应显示：
# ✓ Hooks configured correctly

# 如果显示 ✗，继续诊断
ls -la .claude/hooks/
cat .claude/hooks/user-prompt-submit
```

**解决方案1**: 自动修复
```bash
ccautorun init --reconfigure-hooks
```

**解决方案2**: 手动配置
```bash
# 创建 Hook 目录
mkdir -p .claude/hooks

# 创建 Hook 文件
cat > .claude/hooks/user-prompt-submit << 'EOF'
#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

try {
  const hookPath = path.join(__dirname, '../../node_modules/ccautorun/lib/hooks/auto-continue.js');
  require(hookPath);
} catch (error) {
  // 全局安装的情况
  execSync('ccautorun hook execute', { stdio: 'inherit' });
}
EOF

# 给予执行权限
chmod +x .claude/hooks/user-prompt-submit

# 验证
ccautorun doctor
```

**Windows 特殊处理**:
```powershell
# Windows 使用 .cmd 文件
@echo off
node "%~dp0..\..\node_modules\ccautorun\lib\hooks\auto-continue.js"
```

---

## 计划生成问题

### ❌ "/plan" 命令无响应

**症状**: 在 Claude Code 中输入 `/plan` 后无反应

**诊断**:
```bash
# 检查 slash 命令是否配置
ls -la .claude/commands/

# 应该有 plan.md 文件
cat .claude/commands/plan.md
```

**解决方案**: 配置 slash 命令
```bash
# 创建命令目录
mkdir -p .claude/commands

# 创建 plan 命令（这会在 Stage 4 实现）
# 临时解决：直接在 Claude 中描述任务
# "请帮我创建一个执行计划：[任务描述]"
```

---

### ❌ 生成的计划质量差

**症状**: 计划过于简单、缺少细节、不符合项目实际情况

**原因分析**:
1. 任务描述不够具体
2. 缺少项目上下文
3. 没有明确技术栈

**解决方案**: 使用更好的提示词
```
❌ 不好的提示：
/plan 添加测试

✅ 好的提示：
/plan 为 React + TypeScript 项目添加 vitest 单元测试框架

当前状态：
- 项目使用 React 18 + TypeScript 4.9
- 使用 Vite 作为构建工具
- 现有代码无测试覆盖

目标：
1. 配置 vitest + @testing-library/react
2. 为核心组件编写单元测试（20+ 组件）
3. 配置覆盖率报告（目标 >80%）
4. 集成到 CI/CD（GitHub Actions）

参考：vitest.dev/guide/
```

**提示词模板**: 见 [TEMPLATES.md](TEMPLATES.md)

---

### ❌ 计划生成时间过长

**症状**: 等待 5 分钟以上仍在生成

**原因**:
- 项目过大
- 任务描述过于宽泛
- Claude 负载高

**解决方案1**: 缩小范围
```
# 不要：
/plan 重构整个项目

# 改为：
/plan 重构 src/auth/ 目录下的认证模块
```

**解决方案2**: 提供明确的文件列表
```
/plan 重构以下文件的错误处理：
- src/api/user-service.js
- src/api/order-service.js
- src/utils/error-handler.js
```

**解决方案3**: 使用模板
```bash
# 使用预设模板（更快）
ccautorun plan from-template refactor-module \
  --module auth \
  --output .ccautorun/plans/refactor-auth
```

---

## 执行问题

### ❌ Stage 执行中断

**症状**: Stage 执行到一半停止，没有完成

**诊断**:
```bash
# 查看当前状态
ccautorun status

# 查看最近的日志
ccautorun logs tail -n 100

# 查看 Session 记录
cat .ccautorun/sessions/latest.json
```

**常见原因和解决方案**:

**原因1**: Claude 遇到错误
```bash
# 查看错误详情
ccautorun logs grep ERROR

# 修复错误后重试
ccautorun recover --strategy retry
```

**原因2**: 网络中断
```bash
# 检查网络
ping anthropic.com

# 重试
ccautorun recover --strategy retry
```

**原因3**: 手动停止
```bash
# 恢复执行
# 在 Claude Code 中输入：
继续执行 Stage [X]
```

**原因4**: Safety Limit 达到
```bash
# 检查配置
ccautorun config get safety_limit

# 增加限制或确认继续
ccautorun config set safety_limit 20

# 或手动确认
# Claude 会提示：? Continue? (Y/n)
```

---

### ❌ "File conflict" 错误

**症状**:
```
❌ Error: File conflict detected
File: src/utils/helper.js
Modified by: Stage 2 and external changes
```

**原因**: 文件在 Stage 执行期间被外部修改（如手动编辑、其他计划）

**解决方案1**: 保留当前 Stage 的修改
```bash
ccautorun resolve-conflict --keep-stage
```

**解决方案2**: 保留外部修改
```bash
ccautorun resolve-conflict --keep-external
```

**解决方案3**: 手动合并
```bash
# 查看差异
git diff src/utils/helper.js

# 手动编辑合并
vi src/utils/helper.js

# 标记冲突已解决
ccautorun resolve-conflict --manual

# 继续执行
ccautorun recover --strategy skip  # 跳过当前 Stage
```

**预防**: 执行期间不要手动编辑文件

---

### ❌ "Permission denied" 错误

**症状**:
```
❌ Error: EACCES: permission denied, open '/path/to/file'
```

**原因**: 文件权限不足

**解决方案1**: 修复文件权限
```bash
# 查看权限
ls -la /path/to/file

# 修复权限
chmod u+w /path/to/file

# 如果是目录
chmod -R u+w /path/to/directory
```

**解决方案2**: 检查文件是否被占用
```bash
# macOS/Linux
lsof /path/to/file

# 关闭占用文件的进程
kill -9 <PID>
```

**解决方案3**: 以管理员运行（不推荐）
```bash
# Linux/macOS
sudo ccautorun ...

# Windows
# 以管理员身份运行终端
```

---

## Hook 问题

### ❌ Hook 不执行

**症状**: 自动继续功能完全不工作，没有任何反应

**诊断步骤**:

**Step 1**: 检查 Hook 文件是否存在
```bash
ls -la .claude/hooks/user-prompt-submit

# 应显示：
# -rwxr-xr-x  ...  user-prompt-submit
#  ^^^
#  注意 x 执行权限
```

**Step 2**: 检查执行权限
```bash
# 如果缺少执行权限
chmod +x .claude/hooks/user-prompt-submit
```

**Step 3**: 手动测试 Hook
```bash
# 直接运行 Hook
.claude/hooks/user-prompt-submit

# 应该输出调试信息或执行逻辑
# 如果报错，记录错误信息
```

**Step 4**: 检查 Node.js 路径
```bash
# 查看 shebang 是否正确
head -n 1 .claude/hooks/user-prompt-submit
# 应该是: #!/usr/bin/env node

# 验证 node 路径
which node
# 如果返回空，说明 node 不在 PATH 中
```

**Step 5**: 检查 Hook 日志
```bash
cat .ccautorun/logs/hook.log

# 查看最近的错误
ccautorun logs grep --file hook.log ERROR
```

**解决方案**: 根据诊断结果
```bash
# 重新配置 Hooks
ccautorun init --reconfigure-hooks

# 验证
ccautorun doctor
```

---

### ❌ Hook 执行但没有效果

**症状**: Hook 执行了，但自动继续没有触发

**诊断**:
```bash
# 检查配置
ccautorun config get auto_continue
# 应显示 true

# 查看当前计划状态
ccautorun status
# 确保有活跃的计划

# 查看 Hook 日志
tail -f .ccautorun/logs/hook.log
# 在 Claude Code 中输入一些内容，观察日志
```

**常见原因**:

**原因1**: `auto_continue` 未启用
```bash
ccautorun config set auto_continue true
```

**原因2**: 当前没有活跃计划
```bash
# 创建或恢复计划
ccautorun list
ccautorun resume <plan-id>
```

**原因3**: Hook 逻辑错误
```bash
# 查看 Hook 代码
cat .claude/hooks/user-prompt-submit

# 检查是否有 try-catch 吞掉了错误
# 添加调试输出
```

**原因4**: Session 未正确跟踪
```bash
# 清理旧 Session
ccautorun session clean

# 重启计划
# 在 Claude Code 中：
执行 Stage 1
```

---

### ❌ Hook 执行太慢

**症状**: 输入内容后等待 5-10 秒 Hook 才响应

**诊断**:
```bash
# 测试 Hook 执行时间
time .claude/hooks/user-prompt-submit

# 应该在 < 2 秒内完成
```

**原因分析**:
- 大量文件监控
- 复杂的计划解析
- 磁盘 I/O 慢

**解决方案1**: 优化文件监控
```bash
# 编辑 .gitignore，排除大目录
echo "node_modules/" >> .gitignore
echo "dist/" >> .gitignore
echo ".cache/" >> .gitignore
```

**解决方案2**: 减少日志级别
```bash
ccautorun config set log_level warn
# 从 debug/info 改为 warn
```

**解决方案3**: 清理缓存
```bash
ccautorun cache clear
ccautorun logs clean
```

---

## 性能问题

### ❌ 内存占用过高

**症状**: ccAutoRun 进程占用 >500MB 内存

**诊断**:
```bash
# 查看进程内存
ps aux | grep ccautorun

# 或使用 top/htop
top -p $(pgrep -f ccautorun)
```

**解决方案**:

**Step 1**: 清理快照
```bash
# 查看快照占用
du -sh .ccautorun/snapshots/

# 清理旧快照
ccautorun snapshot clean --keep 2
```

**Step 2**: 清理日志
```bash
# 查看日志大小
du -sh .ccautorun/logs/

# 清理旧日志
ccautorun logs clean --older-than 7d
```

**Step 3**: 减少并发
```bash
# 如果有多个计划在运行，暂停部分
ccautorun pause <plan-id>
```

**Step 4**: 重启
```bash
ccautorun restart
```

---

### ❌ 磁盘空间不足

**症状**:
```
❌ Error: ENOSPC: no space left on device
```

**诊断**:
```bash
# 查看磁盘空间
df -h

# 查看 ccAutoRun 占用
du -sh .ccautorun/
du -sh .ccautorun/* | sort -h
```

**解决方案**:

**快速清理**:
```bash
# 清理所有可清理内容
ccautorun cleanup --all

# 等同于：
ccautorun snapshot clean --all
ccautorun logs clean --all
ccautorun cache clear
```

**手动清理**:
```bash
# 归档旧计划
ccautorun archive --older-than 30d --compress

# 删除已归档计划
rm -rf .ccautorun/plans/archived/*

# 清理快照
rm -rf .ccautorun/snapshots/*

# 清理日志
rm -rf .ccautorun/logs/*.log
```

**预防**:
```bash
# 配置自动清理
ccautorun config set auto_cleanup true
ccautorun config set cleanup_days 14
```

---

## 数据恢复

### ❌ 意外删除了计划文件

**症状**: 误删除了 `.ccautorun/plans/` 下的文件

**恢复方案**:

**方案1**: 从 Git 恢复
```bash
# 查看删除的文件
git status

# 恢复
git restore .ccautorun/plans/
```

**方案2**: 从快照恢复
```bash
# 列出快照
ccautorun snapshot list <plan-id>

# 恢复最近的快照
ccautorun snapshot restore <plan-id> --latest
```

**方案3**: 从归档恢复
```bash
# 列出归档
ccautorun archive list

# 解压归档
ccautorun archive extract <archive-id>
```

---

### ❌ 配置文件损坏无法修复

**症状**: `ccautorun config validate --fix` 失败

**完全重置**:
```bash
# 备份数据
cp -r .ccautorun .ccautorun.backup

# 删除配置
rm .ccautorun/config.json

# 重新初始化
ccautorun init

# 手动迁移数据
# 从 .ccautorun.backup/ 复制需要的计划和 sessions
```

---

### ❌ 所有数据丢失

**预防措施**: 定期备份
```bash
# 手动备份
tar -czf ccautorun-backup-$(date +%Y%m%d).tar.gz .ccautorun/

# 自动备份脚本（添加到 crontab）
#!/bin/bash
BACKUP_DIR=~/backups/ccautorun
mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar.gz .ccautorun/
# 保留最近 7 天
find $BACKUP_DIR -name "backup-*.tar.gz" -mtime +7 -delete
```

**恢复备份**:
```bash
tar -xzf ccautorun-backup-20250107.tar.gz
```

---

## 🆘 获取更多帮助

如果以上方案都无法解决问题：

### 1. 收集诊断信息
```bash
# 生成完整诊断报告
ccautorun doctor --full-report > ccautorun-diagnostic.txt

# 包含：
# - 系统信息
# - 配置详情
# - 日志摘要
# - 依赖版本
```

### 2. 提交 Issue
前往 [GitHub Issues](https://github.com/yourusername/ccAutoRun/issues)

提供以下信息：
- 问题描述（期望 vs 实际）
- 重现步骤
- 诊断报告（ccautorun-diagnostic.txt）
- 错误日志
- 操作系统和版本

### 3. 寻求社区帮助
- **Discord**: [链接]
- **Slack**: [链接]
- **Stack Overflow**: 标签 `ccautorun`

### 4. 紧急联系
- **安全漏洞**: security@example.com
- **关键 Bug**: 使用 GitHub Issue 模板 "Critical Bug"

---

## 📚 相关文档

- **[Quick Start](QUICK_START.md)** - 快速开始
- **[FAQ](FAQ.md)** - 常见问题
- **[Templates](TEMPLATES.md)** - 任务模板
- **[主文档](../README.md)** - 完整文档

---

**[← 返回主页](../README.md)** | **[FAQ →](FAQ.md)**

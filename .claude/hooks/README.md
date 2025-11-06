# 🪝 Documentation Automation Hooks

这个目录包含自动化脚本,用于实现"批次完成后自动继续"的功能。

## 🎯 功能概览

### 主要特性

1. **进度监控** - 实时监控文档完成情况
2. **自动通知** - 批次完成后桌面通知
3. **智能建议** - 自动提示下一步操作
4. **安全限制** - 防止无限循环(最多3个连续批次)
5. **跨平台支持** - Windows PowerShell + Unix Bash

## 📁 文件说明

| 文件 | 用途 | 平台 |
|------|------|------|
| `auto-continue.ps1` | 主自动化脚本(推荐) | Windows |
| `watch-and-notify.ps1` | 后台监控脚本 | Windows |
| `check-and-continue.sh` | 检查和继续脚本 | Unix/Linux/macOS |
| `watch-and-notify.sh` | 后台监控脚本 | Unix/Linux/macOS |
| `README.md` | 本文档 | 所有平台 |

## 🚀 快速开始

### Windows 用户(推荐)

```powershell
# 在 KompasAI 根目录执行

# 方式 1: 交互式模式(最简单)
.\.claude\hooks\auto-continue.ps1

# 方式 2: 查看状态
.\.claude\hooks\auto-continue.ps1 -Status

# 方式 3: 后台监控模式
.\.claude\hooks\auto-continue.ps1 -Watch
```

### Unix/Linux/macOS 用户

```bash
# 在 KompasAI 根目录执行

# 方式 1: 交互式模式
bash .claude/hooks/check-and-continue.sh

# 方式 2: 后台监控模式
bash .claude/hooks/watch-and-notify.sh

# 方式 3: 自动模式
bash .claude/hooks/check-and-continue.sh --auto
```

## 💡 使用场景

### 场景 1: 标准工作流(推荐)

```powershell
# Step 1: 早上启动自动化系统
.\.claude\hooks\auto-continue.ps1

# 输出示例:
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#   📚 Documentation Auto-Continue System
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#
# 📊 Current Progress
#    Total: 140 tasks
#    Completed: 42 (30.0%)
#    Remaining: 98
#
# 📝 Next Steps
#
#   Option 1 - Automatic (Recommended):
#     /continue-docs
#
# 💡 Quick Start
#    Copy and paste this into Claude Code:
#
#    /continue-docs

# Step 2: 复制 /continue-docs 到 Claude Code
/continue-docs

# Step 3: 等待 30-60 分钟,Claude 完成一批

# Step 4: 批次完成后,再次运行
.\.claude\hooks\auto-continue.ps1

# Step 5: 重复直到完成
```

### 场景 2: 后台监控模式(免打扰)

```powershell
# 启动后台监控
.\.claude\hooks\auto-continue.ps1 -Watch

# 输出:
# 🔍 Starting background monitoring...
#    This will watch for progress updates and notify you.
#    Press Ctrl+C to stop monitoring.
#
# [10:30:15] Starting documentation progress watcher...
# [10:30:15] Monitoring: peta-docs\DOCUMENTATION_PROGRESS.md
# [10:30:15] Check interval: 10s

# 现在您可以:
# 1. 最小化终端窗口
# 2. 去做其他工作
# 3. 当批次完成时,会收到桌面通知
# 4. 通知会显示"已完成X个任务,总计Y个"
# 5. 回到 Claude Code 继续下一批

# 批次完成时的通知:
# 🔔 Windows 通知气泡:
#    标题: "Documentation Progress"
#    内容: "Completed 7 new task(s)! Total: 49"
#    + 系统提示音

# 终端输出:
# [10:45:30] ✨ New progress detected!
# [10:45:30]    7 new task(s) completed
# [10:45:30]    Total completed: 49
#
# 💡 To continue with next batch:
#    /continue-docs
```

### 场景 3: 快速状态检查

```powershell
# 随时快速查看进度
.\.claude\hooks\auto-continue.ps1 -Status

# 输出:
# Documentation Progress:
#   • Completed: 49/140 (35.0%)
#   • Remaining: 91 tasks
#   • Sessions: 1/3
#
# 💡 Run: .\auto-continue.ps1 to continue
```

## 🔄 完整工作流程

### 一天的标准流程

```powershell
# 🌅 早上 9:00
.\.claude\hooks\auto-continue.ps1
# 看到: 42/140 完成
# 复制: /continue-docs 到 Claude Code

# ☕ 9:45 - 批次 1 完成(7页)
.\.claude\hooks\auto-continue.ps1
# 看到: 49/140 完成
# 复制: /continue-docs 到 Claude Code

# 🍔 11:30 - 批次 2 完成(7页)
.\.claude\hooks\auto-continue.ps1
# 看到: 56/140 完成
# 复制: /continue-docs 到 Claude Code

# ⚠️ 12:30 - 达到会话限制
.\.claude\hooks\auto-continue.ps1
# 看到:
# ⚠ Auto-continue limit reached (3/3 sessions)
# Please review the last batch before continuing.
#
# To continue:
#   1. Review completed pages
#   2. Run: .\auto-continue.ps1 -Reset
#   3. Use: /continue-docs

# 审查上午完成的 21 页文档(15分钟)

# 重置计数器
.\.claude\hooks\auto-continue.ps1 -Reset
# 看到: ✅ Session counter reset

# 继续下午的工作
.\.claude\hooks\auto-continue.ps1
# 重复流程...
```

## 🛡️ 安全机制

### 自动限制

系统内置安全限制防止失控:

1. **最大连续会话数:** 3 个批次
   - 达到限制后自动暂停
   - 需要人工审查后才能继续

2. **手动重置:**
   ```powershell
   .\.claude\hooks\auto-continue.ps1 -Reset
   ```

3. **紧急暂停:**
   ```powershell
   .\.claude\hooks\auto-continue.ps1 -Pause
   # 暂停自动继续,需要手动恢复
   ```

### 为什么需要限制?

- **质量控制:** 每批次完成后应该审查内容质量
- **防止错误累积:** 如果某一批有问题,不应继续
- **资源管理:** 避免无限消耗 Claude Code 会话

## 📊 监控功能详解

### 实时监控原理

```
每 10 秒检查一次进度文件
      ↓
检测到 [x] 数量增加
      ↓
计算新完成的任务数
      ↓
发送桌面通知 + 播放声音
      ↓
显示下一步建议
```

### 通知类型

**Windows 通知气泡:**
- 位置: 系统托盘右下角
- 持续时间: 5 秒
- 可点击: 否(自动消失)

**终端输出:**
- 彩色格式化显示
- 时间戳
- 完成数量
- 剩余任务

**声音提示:**
- Windows: 系统提示音
- macOS: Glass.aiff
- Linux: complete.oga

## 🎛️ 高级配置

### 修改检查间隔

编辑 `watch-and-notify.ps1`:

```powershell
# 默认: 10 秒
$CheckInterval = 10

# 修改为 30 秒(减少 CPU 使用)
$CheckInterval = 30

# 修改为 5 秒(更快响应)
$CheckInterval = 5
```

### 修改最大会话数

编辑 `auto-continue.ps1`:

```powershell
# 默认: 3 个批次
$MaxAutoSessions = 3

# 修改为 5 个批次(更激进)
$MaxAutoSessions = 5

# 修改为 1 个批次(更保守,每批次都审查)
$MaxAutoSessions = 1
```

## 🔧 故障排除

### 问题 1: 脚本无法执行

**错误信息:**
```
无法加载文件 auto-continue.ps1,因为在此系统上禁止运行脚本。
```

**解决方案:**
```powershell
# 临时允许(仅本次)
powershell -ExecutionPolicy Bypass -File .\.claude\hooks\auto-continue.ps1

# 永久允许(需要管理员权限)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 问题 2: 通知不显示

**可能原因:**
- Windows 通知中心被禁用
- 焦点助手开启

**解决方案:**
1. 打开 Windows 设置
2. 系统 → 通知
3. 启用通知
4. 关闭焦点助手

### 问题 3: 监控不工作

**检查清单:**
```powershell
# 1. 确认在正确的目录
pwd
# 应该显示: C:\Users\satan\KompasAI

# 2. 确认进度文件存在
Test-Path peta-docs\DOCUMENTATION_PROGRESS.md
# 应该显示: True

# 3. 手动测试一次
.\.claude\hooks\auto-continue.ps1 -Once
```

### 问题 4: 计数不准确

**重置计数器:**
```powershell
# 删除缓存文件
Remove-Item .claude\hooks\.last-completed-count -ErrorAction SilentlyContinue
Remove-Item .claude\hooks\.auto-continue.lock -ErrorAction SilentlyContinue

# 重新初始化
.\.claude\hooks\auto-continue.ps1 -Status
```

## 📝 与其他工具集成

### 结合 npm 脚本使用

在 `package.json` 中添加:

```json
{
  "scripts": {
    "docs:watch": "powershell -ExecutionPolicy Bypass -File ../.claude/hooks/auto-continue.ps1 -Watch",
    "docs:continue": "powershell -ExecutionPolicy Bypass -File ../.claude/hooks/auto-continue.ps1",
    "docs:reset": "powershell -ExecutionPolicy Bypass -File ../.claude/hooks/auto-continue.ps1 -Reset"
  }
}
```

然后可以使用:
```bash
cd peta-docs
npm run docs:watch      # 启动监控
npm run docs:continue   # 检查进度
npm run docs:reset      # 重置计数器
```

### 结合 VS Code Task

创建 `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Watch Documentation Progress",
      "type": "shell",
      "command": "powershell",
      "args": [
        "-ExecutionPolicy", "Bypass",
        "-File", "${workspaceFolder}/.claude/hooks/auto-continue.ps1",
        "-Watch"
      ],
      "isBackground": true,
      "problemMatcher": []
    }
  ]
}
```

然后在 VS Code 中:
- 按 `Ctrl+Shift+P`
- 输入 "Run Task"
- 选择 "Watch Documentation Progress"

## 🎯 最佳实践

### ✅ DO

1. **每次新会话前运行检查:**
   ```powershell
   .\.claude\hooks\auto-continue.ps1
   ```

2. **达到限制后审查内容:**
   - 打开最近创建的 5-7 个文件
   - 检查格式是否正确
   - 验证代码示例可运行
   - 确认链接有效

3. **定期提交进度:**
   ```bash
   git add peta-docs/
   git commit -m "docs: completed pages X to Y"
   git push
   ```

4. **使用后台监控模式:**
   - 适合长时间工作
   - 减少打断
   - 提高效率

### ❌ DON'T

1. **不要修改限制为太大的数字:**
   ```powershell
   # 不推荐
   $MaxAutoSessions = 999
   ```
   - 会导致质量问题
   - 难以追踪错误

2. **不要忽略通知:**
   - 批次完成是审查的最佳时机
   - 问题越早发现越容易修复

3. **不要在多个终端同时运行监控:**
   - 会导致计数混乱
   - 可能收到重复通知

## 📈 效率提升统计

### 使用自动化系统前

- **准备时间:** 5-10 分钟/批次
  - 手动检查进度
  - 识别下一批任务
  - 编写提示词
- **执行时间:** 30-60 分钟/批次
- **总时间:** 35-70 分钟/批次

### 使用自动化系统后

- **准备时间:** < 1 分钟/批次
  - 运行一个命令
  - 复制粘贴 `/continue-docs`
- **执行时间:** 30-60 分钟/批次(自动)
- **总时间:** 31-61 分钟/批次

**节省:** 每批次 **4-9 分钟**
**总节省(14批次):** **56-126 分钟(约 1-2 小时)**

### 额外收益

- ✅ 减少认知负担
- ✅ 减少上下文切换
- ✅ 更好的工作流程连续性
- ✅ 自动跟踪进度
- ✅ 减少遗漏风险

## 🎉 完成标志

当您看到:

```
🎉 All documentation tasks complete!
Ready to move to Phase 3: Enhancement & Polish
```

恭喜!可以进入下一阶段了!

## 📞 支持

遇到问题?

1. 查看本文档的故障排除部分
2. 查看 `AUTOMATION_GUIDE.md`
3. 检查脚本文件中的注释
4. 手动执行步骤进行调试

---

**Happy Automating! 🚀**

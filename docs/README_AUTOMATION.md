# 🚀 文档自动化系统 - 完整指南

## 🎯 一句话总结

**输入一次 `/continue-docs`,系统自动完成 3 批次(21页),然后暂停让你审查。重置后继续,直到全部完成。**

---

## ⚡ 最快上手(10秒)

```
1. 在 Claude Code 中输入: /continue-docs
2. 等待 2-3 小时(自动完成 3 批次 = 21 页)
3. 审查 10 分钟
4. 重置: .\.claude\hooks\auto-continue.ps1 -Reset
5. 重复步骤 1-4,直到完成
```

**人工时间: < 1 小时**
**总时间: 1-2 天**
**自动化程度: 92%**

---

## 🤖 工作原理

### 自动循环机制

```
你输入: /continue-docs
    ↓
【批次 1】自动完成 7 页 → 自动输出 /clear + /continue-docs
    ↓
【批次 2】自动完成 7 页 → 自动输出 /clear + /continue-docs
    ↓
【批次 3】自动完成 7 页 → 达到安全限制,暂停
    ↓
⚠️ 提示: 请审查 21 页,然后运行 /clear + /continue-docs
    ↓
你: 审查 10 分钟 + 重置计数器
    ↓
你输入: /clear 然后 /continue-docs
    ↓
重复...
```

### 核心创新: `/clear` 命令

- **问题:** 连续批次会累积上下文,影响质量
- **解决:** 每批次后自动调用 `/clear` 重置会话
- **效果:** 每批次都是"新鲜"的上下文,质量稳定

---

## 📋 三种使用模式

### 模式 1: 完全自动(推荐) ⭐⭐⭐⭐⭐

```
启动: /continue-docs
等待: 2-3 小时(自动运行)
审查: 10 分钟
重置: .\.claude\hooks\auto-continue.ps1 -Reset
继续: /clear + /continue-docs
```

**适合:** 所有人
**效率:** 92% 自动
**人工:** < 1 小时(整个项目)

### 模式 2: 监控增强 ⭐⭐⭐⭐

```
终端 1: .\.claude\hooks\auto-continue.ps1 -Watch
Claude Code: /continue-docs

效果:
  - 每批次完成收到通知 🔔
  - 知道何时达到限制
  - 不用盯着屏幕
```

**适合:** 多任务工作者
**效率:** 92% 自动 + 实时通知
**体验:** 最佳

### 模式 3: 手动控制 ⭐⭐⭐

```
每次手动运行:
  .\.claude\hooks\auto-continue.ps1
  复制: /continue-docs
```

**适合:** 想要完全控制的人
**效率:** 约 70% 自动
**控制:** 最大

---

## 🎬 真实演示

### 早上 9:00 开始

```powershell
# 终端 1: 启动监控(可选)
.\.claude\hooks\auto-continue.ps1 -Watch

# Claude Code: 启动自动模式
/continue-docs
```

### 自动运行(无需干预)

```
09:00 - 批次 1 开始
09:45 - 批次 1 完成 ✅ 自动输出 /clear + /continue-docs
09:46 - 批次 2 开始
10:30 - 批次 2 完成 ✅ 自动输出 /clear + /continue-docs
10:31 - 批次 3 开始
11:15 - 批次 3 完成 ⚠️ 达到限制,暂停

🔔 桌面通知: "3 batches completed! Please review."
```

### 审查和继续(10分钟人工)

```powershell
# 11:15 - 快速审查
ls peta-docs\content\docs\**\*.mdx -Recurse |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 5 |
  ForEach-Object { code $_.FullName }

# 快速检查: frontmatter ✅, 代码示例 ✅, 格式 ✅

# 11:25 - 重置继续
.\.claude\hooks\auto-continue.ps1 -Reset
```

```
# Claude Code
/clear
/continue-docs
```

### 下午重复

```
11:30 - 批次 4-6 自动运行(2.5小时)
14:00 - 审查 + 重置(10分钟)
14:10 - 批次 7-9 自动运行(2.5小时)
16:40 - 审查 + 重置(10分钟)
16:50 - 批次 10-11 自动运行(1.5小时)
18:20 - 🎉 全部完成!
```

**一天工作结果:**
- **完成:** 71 页文档
- **人工时间:** 40 分钟(4次审查 × 10分钟)
- **总时间:** 9 小时(大部分自动)

---

## 📊 效率对比

| 模式 | 总时间 | 人工时间 | 自动化程度 | 推荐度 |
|------|--------|----------|------------|--------|
| 纯手动 | 12-15小时 | 12-15小时 | 0% | ⭐ |
| 半自动(脚本) | 10-12小时 | 2-3小时 | 75% | ⭐⭐⭐ |
| 监控模式 | 10-12小时 | 1-2小时 | 85% | ⭐⭐⭐⭐ |
| **完全自动** | **10-12小时** | **< 1小时** | **92%** | **⭐⭐⭐⭐⭐** |

---

## 🛡️ 安全机制

### 3 批次限制

**为什么暂停?**

1. **质量保证** - 防止错误累积
2. **上下文管理** - 防止上下文污染
3. **人工审查** - 确保内容准确

**如何工作?**

```
批次 1: 计数器 = 1/3 ✅ 继续
批次 2: 计数器 = 2/3 ✅ 继续
批次 3: 计数器 = 3/3 ⚠️ 暂停

审查后:
  .\.claude\hooks\auto-continue.ps1 -Reset
  计数器 = 0/3 ✅ 可以继续
```

### 如何调整?

如果你想更激进或更保守:

编辑 `.claude/commands/continue-docs.md`:

```markdown
# 找到:
**ELSE IF session count >= 3:**

# 改为:
**ELSE IF session count >= 5:**  # 更激进(35页/组)
**ELSE IF session count >= 1:**  # 更保守(每批次审查)
```

**推荐保持默认 3**

---

## 💡 专业技巧

### 技巧 1: 多窗口布局

```
┌──────────────┬──────────────┐
│ Claude Code  │ PowerShell   │
│ (自动运行)   │ (监控)       │
├──────────────┼──────────────┤
│ VS Code      │ 浏览器       │
│ (审查)       │ (预览)       │
└──────────────┴──────────────┘
```

### 技巧 2: 定时检查

```powershell
# 每 2.5 小时(约 3 批次)检查一次
while ($true) {
    Start-Sleep -Seconds 9000
    .\.claude\hooks\auto-continue.ps1 -Status
    [System.Media.SystemSounds]::Beep.Play()
}
```

### 技巧 3: 快速审查

```powershell
# 只抽查 5 个文件,不是全部 21 个
ls peta-docs\content\docs\**\*.mdx -Recurse |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 21 |
  Get-Random -Count 5
```

### 技巧 4: 批量提交

```bash
# 每组(3批次)提交一次
git add peta-docs/
git commit -m "docs: auto-generated batch 1-3 (21 pages)"
git push
```

---

## 🎯 当前状态

### 进度统计

```
当前: 69/140 页完成 (49.3%)
剩余: 71 页
预估: 10-11 批次
分组: 4 组(3+3+3+2)
时间: 1-2 天
```

### 时间预估

**完全自动模式:**

```
组 1: 3 批次 → 2.5 小时(自动) + 10 分钟(审查)
组 2: 3 批次 → 2.5 小时(自动) + 10 分钟(审查)
组 3: 3 批次 → 2.5 小时(自动) + 10 分钟(审查)
组 4: 2 批次 → 1.5 小时(自动) + 10 分钟(审查)

总计:
  自动时间: 9 小时
  人工时间: 40 分钟
  日历时间: 1-2 天(取决于工作时长)
```

---

## 📝 命令速查表

### 核心命令

| 命令 | 用途 | 频率 |
|------|------|------|
| `/continue-docs` | 启动/继续自动模式 | 每组 1 次 |
| `/clear` | 重置会话 | 每批次后(自动) |
| `.\.claude\hooks\auto-continue.ps1 -Reset` | 重置计数器 | 每组后(手动) |
| `.\.claude\hooks\auto-continue.ps1 -Watch` | 启动监控 | 一天 1 次 |
| `.\.claude\hooks\auto-continue.ps1 -Status` | 查看进度 | 随时 |

### 辅助命令

```powershell
# 查看详细进度
npm run docs:status

# 查看下一批任务
npm run docs:next

# 暂停自动模式
.\.claude\hooks\auto-continue.ps1 -Pause

# 恢复
.\.claude\hooks\auto-continue.ps1 -Reset
```

---

## 🐛 故障排除

### Q: 没有自动输出 /clear?

**A:** 检查剩余任务

```powershell
# 查看是否还有未完成任务
grep "- \[ \]" peta-docs/DOCUMENTATION_PROGRESS.md | wc -l

# 如果有但没自动继续,手动触发
/clear
/continue-docs
```

### Q: 一直循环不停?

**A:** 紧急暂停

```powershell
.\.claude\hooks\auto-continue.ps1 -Pause
```

### Q: 批次质量下降?

**A:** 降低连续批次数

编辑 `continue-docs.md`,改为 1 或 2 批次限制

---

## 📚 文档索引

| 文档 | 内容 | 适合 |
|------|------|------|
| `FULL_AUTO_MODE.md` | 完全自动模式详解(5000字) | 深入理解 |
| `QUICKSTART_HOOKS.md` | Hooks 快速开始 | 10分钟上手 |
| `AUTOMATION_GUIDE.md` | 自动化完整指南 | 全面了解 |
| `.claude/hooks/README.md` | Hooks 技术文档 | 技术细节 |
| 本文档 | 快速参考 | 日常使用 |

---

## 🎉 立即开始

### 第一次使用

```powershell
# 1. 重置计数器(确保从 0 开始)
.\.claude\hooks\auto-continue.ps1 -Reset

# 2. 可选: 启动监控
.\.claude\hooks\auto-continue.ps1 -Watch

# 3. 在 Claude Code 中启动
/continue-docs

# 4. 放手!去喝咖啡,做其他事
# 5. 2-3 小时后收到通知,回来审查
# 6. 重置并继续
# 7. 重复直到完成
```

### 日常使用

```
早上:
  /continue-docs
  → 去工作/开会/休息

中午:
  审查 + 重置
  /clear + /continue-docs
  → 午休

下午:
  审查 + 重置
  /clear + /continue-docs
  → 继续工作

傍晚:
  🎉 完成!
```

---

## 🏆 最终效果

**使用完全自动模式:**

✅ **92% 自动化** - 人工只需要不到 1 小时
✅ **1-2 天完成** - 140 页技术文档
✅ **高质量保证** - 每 21 页审查一次
✅ **零压力** - 大部分时间自动运行
✅ **可监控** - 实时通知和进度跟踪

---

## 🚀 现在就开始!

```
/continue-docs
```

**就这一个命令,享受 92% 自动化的文档开发! 🎊**

---

**有问题?查看详细文档:**
- 深入了解: `cat peta-docs/FULL_AUTO_MODE.md`
- 技术细节: `cat .claude/hooks/README.md`
- 快速开始: `cat peta-docs/QUICKSTART_HOOKS.md`

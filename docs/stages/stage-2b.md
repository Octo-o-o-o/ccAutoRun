# Stage 2b: CLI增强命令和配置管理 🔄

**[← 返回主计划](../../EXECUTION_PLAN.md)** | **[← Stage 2a](stage-2a.md)** | **[Stage 3 →](stage-3.md)**

---

## 📋 阶段信息

- **阶段编号**: Stage 2b
- **预计时间**: 3-4小时
- **依赖**: Stage 2a
- **状态**: ⏳ 待开始

### 🎯 目标
实现增强命令（pause/resume/skip/retry/logs/stats）和配置管理功能

### 📝 任务清单
- [ ] 实现 `ccautorun pause <task-name>` 命令
  - 支持 `--dry-run` 预览操作
  - 暂停指定任务的自动继续
  - 修改会话状态为 paused
  - 提示用户可使用 resume 恢复
- [ ] 实现 `ccautorun resume <task-name>` 命令
  - 支持 `--dry-run` 预览操作
  - 恢复已暂停任务的自动继续
  - 修改会话状态为 active
- [ ] 实现 `ccautorun skip <task-name> <stage-number>` 命令
  - 支持 `--dry-run` 预览操作
  - 跳过指定 Stage，更新进度到下一个
  - 记录跳过原因（可选参数 `--reason "..."`）
  - 警告：跳过可能导致后续 Stage 失败
- [ ] 实现 `ccautorun retry <task-name> [stage-number]` 命令
  - 支持 `--dry-run` 预览操作
  - 重试失败的 Stage
  - 如果不指定 stage-number，重试当前 Stage
  - 重置会话计数（可选 `--reset-count`）
  - 从 failed 状态恢复任务
- [ ] 实现 `ccautorun logs <task-name>` 命令
  - 显示任务执行日志
  - 支持 `--tail N` 只显示最后 N 行
  - 支持 `--follow` 实时跟踪
  - 支持 `--level <level>` 过滤日志级别
- [ ] 实现 `ccautorun stats` 命令
  - 显示全局统计信息：
    - 总任务数（进行中/已完成/已失败/已归档）
    - 平均每任务完成时间
    - Stage 完成成功率
    - 最常使用的命令（如果有日志）
  - 显示单个任务统计（`--task <name>`）
  - 支持 `--format json` 输出 JSON 格式
- [ ] 实现 `ccautorun config` 命令（增强版）
  - 交互式配置向导（inquirer）
  - 配置项：
    - 默认架构类型（auto/split/single）
    - 安全限制策略（unlimited/数字）
    - 通知偏好（enabled, sound, progress_frequency）
    - 自动继续开关（enabled, skip_permissions）
    - 默认编辑器（code, vim, etc）
  - 支持 `--get <key>` 查询单个配置（嵌套键：`notifications.enabled`）
  - 支持 `--set <key> <value>` 修改单个配置
  - 支持 `--list` 列出所有配置
  - 支持 `--dry-run` 预览修改
  - 配置验证（使用 config-validator）
  - 保存到 `.ccautorun/config.yaml`

### ✅ 完成标准
- [ ] `ccautorun pause/resume` 命令可以正常工作
- [ ] `ccautorun skip` 可以跳过 Stage 并记录原因
- [ ] `ccautorun retry` 可以从 failed 状态恢复
- [ ] retry 支持重置会话计数
- [ ] `ccautorun logs` 可以显示任务日志
- [ ] logs 支持 --tail, --follow, --level 选项
- [ ] `ccautorun stats` 可以显示统计信息
- [ ] stats 可以显示失败任务数量
- [ ] stats 支持 --format json
- [ ] config 命令可以交互式配置所有项
- [ ] config 支持 --get/--set/--list 子命令
- [ ] config 支持嵌套键（如 `notifications.enabled`）
- [ ] 配置保存到 yaml 文件并通过验证
- [ ] **所有命令支持 --dry-run**
- [ ] 所有命令有完善的错误处理

### 📤 预期输出
- [ ] `src/commands/pause.js` (80行，增加 --dry-run）
- [ ] `src/commands/resume.js` (80行，增加 --dry-run）
- [ ] `src/commands/skip.js` (120行，增加 --reason 和 --dry-run）
- [ ] `src/commands/retry.js` (150行，增加 failed 状态处理和 --dry-run）
- [ ] `src/commands/logs.js` (150行，增加 --level 和 --follow）
- [ ] `src/commands/stats.js` (200行，增加 --format json）
- [ ] `src/commands/config.js` (300行，增加 --get/--set/--list）

### ⚠️ 注意事项
- **dry-run 是关键**：所有命令都要支持，用户可以预览操作
- **retry 必须处理 failed 状态**：这是错误恢复的重要途径
- **config --get/--set**：支持嵌套键，使用 lodash.get/set 或类似方法
- **stats 的 JSON 输出**：方便集成到其他工具
- **logs --follow**：使用 tail -f 或 chokidar 实时监控日志文件
- **Windows 兼容性**：使用 Node.js API

### 🧪 验证命令
```bash
# 测试 pause/resume
ccautorun pause test-task --dry-run
ccautorun pause test-task
ccautorun resume test-task

# 测试 skip
ccautorun skip test-task 3 --reason "Stage 3 not needed" --dry-run
ccautorun skip test-task 3 --reason "Stage 3 not needed"

# 测试 retry
ccautorun retry test-task --dry-run
ccautorun retry test-task
ccautorun retry test-task 2 --reset-count

# 测试 logs
ccautorun logs test-task
ccautorun logs test-task --tail 20
ccautorun logs test-task --follow
ccautorun logs test-task --level error

# 测试 stats
ccautorun stats
ccautorun stats --task test-task
ccautorun stats --format json

# 测试 config
ccautorun config                                    # 交互式
ccautorun config --list                             # 列出所有配置
ccautorun config --get default_architecture         # 查询单个
ccautorun config --get notifications.enabled        # 嵌套键
ccautorun config --set editor vim --dry-run         # 预览
ccautorun config --set notifications.sound false    # 设置

# 测试帮助
ccautorun pause --help
ccautorun retry --help
ccautorun config --help
```

---


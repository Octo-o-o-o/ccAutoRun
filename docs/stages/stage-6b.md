# Stage 6b: 错误恢复系统和安全审计 🔒

**[← 返回主计划](../../EXECUTION_PLAN.md)** | **[← Stage 6a](stage-6.md)** | **下一阶段: [Stage 7 →](stage-7.md)**

---

## 📋 阶段信息

- **阶段编号**: Stage 6b
- **预计时间**: 4-5小时
- **依赖**: Stage 6a（E2E 测试和跨平台兼容性验证完成）
- **状态**: ⏳ 进行中

### 🎯 目标
实现完整的错误恢复机制和安全审计系统，确保 ccAutoRun 在失败场景下能够优雅恢复，并满足安全最佳实践。

### 📝 任务清单

#### 6b.1 错误恢复核心模块

- [ ] 实现 `src/core/recovery-manager.js`
  ```javascript
  export class RecoveryManager {
    // 检测 Stage 失败
    async detectFailure(sessionId)

    // 创建恢复点
    async createRecoveryPoint(planId, stage)

    // 列出可恢复点
    async listRecoveryPoints(planId)

    // 执行恢复（Retry/Skip/Rollback/Abort）
    async recover(planId, strategy, options)

    // 获取失败详情
    async getFailureDetails(sessionId)
  }
  ```

- [ ] 实现 `src/core/snapshot-manager.js`
  ```javascript
  export class SnapshotManager {
    // 创建增量快照
    async createSnapshot(planId, stage, files)

    // 恢复快照
    async restoreSnapshot(snapshotId)

    // 列出所有快照
    async listSnapshots(planId)

    // 清理旧快照（保留策略）
    async cleanupSnapshots(planId, retention = 5)

    // 压缩快照（超过7天）
    async compressOldSnapshots(planId)

    // 获取快照详情
    async getSnapshotDetails(snapshotId)
  }
  ```

- [ ] 实现 `src/core/pause-resume-manager.js`
  ```javascript
  export class PauseResumeManager {
    // 暂停当前执行
    async pause(planId, reason)

    // 恢复执行
    async resume(planId)

    // 保存执行状态
    async saveExecutionState(planId, state)

    // 加载执行状态
    async loadExecutionState(planId)

    // 检查是否可以恢复
    async canResume(planId)
  }
  ```

#### 6b.2 恢复命令实现

- [ ] 实现 `src/commands/recover.js`
  ```bash
  ccautorun recover [plan-id]
    --strategy <retry|skip|rollback|abort>  # 恢复策略
    --stage <stage-number>                   # 指定 Stage（可选）
    --interactive                            # 交互式选择策略
  ```

  功能要求：
  - 自动检测最近失败的计划
  - 显示失败详情和错误日志
  - 提供恢复策略选择：
    - **Retry**: 重试当前 Stage
    - **Skip**: 跳过当前 Stage，继续下一个
    - **Rollback**: 回退到上一个 Stage 的快照
    - **Abort**: 中止计划，保留进度
  - 交互式确认恢复操作
  - 显示恢复进度

#### 6b.3 快照管理功能

- [ ] 实现快照创建触发器
  - 在每个 Stage 开始前自动创建快照
  - 集成到 auto-continue hook
  - 只备份变化的文件（增量备份）

- [ ] 实现快照压缩
  - 超过 7 天的快照自动 gzip 压缩
  - 压缩时保留原始 manifest.json
  - 提供解压缩恢复功能

- [ ] 实现快照清理
  - 默认保留最近 5 个 Stage 的快照
  - 计划完成后保留首尾快照
  - 单个计划快照上限 500MB 警告
  - 提供手动清理命令

- [ ] 快照元数据管理
  - 生成 manifest.json（文件列表 + SHA256）
  - 记录快照大小和创建时间
  - 支持快照列表查询

#### 6b.4 安全审计命令

- [ ] 实现 `src/commands/audit.js`
  ```bash
  ccautorun audit
    --report <text|json|html>  # 报告格式
    --output <file>             # 输出到文件
    --fix                       # 自动修复（如果可能）
  ```

  审计项目：
  - **依赖安全**：运行 npm audit，检查已知漏洞
  - **敏感文件检测**：扫描敏感文件是否被排除
  - **文件权限检查**：验证文件访问限制
  - **命令注入风险**：检查 hook 和命令执行
  - **审计日志完整性**：验证审计日志记录

- [ ] 创建审计日志系统
  - 记录所有文件操作到 `.ccautorun/logs/audit.log`
  - 记录可疑操作（访问敏感路径、危险命令）
  - 支持查询和过滤审计日志

#### 6b.5 安全测试套件

- [ ] 编写依赖漏洞扫描测试
  ```javascript
  // tests/security/dependency-scan.test.js
  test('npm audit should pass without high severity issues', ...)
  test('should detect outdated packages', ...)
  ```

- [ ] 编写敏感信息检测测试
  ```javascript
  // tests/security/sensitive-data.test.js
  test('should exclude .env files from snapshots', ...)
  test('should mask API keys in logs', ...)
  test('should warn when committing sensitive files', ...)
  ```

- [ ] 编写沙箱模式验证测试
  ```javascript
  // tests/security/sandbox.test.js
  test('should block access to parent directories', ...)
  test('should block dangerous commands', ...)
  test('should allow whitelisted commands only', ...)
  test('should restrict file operations to project directory', ...)
  ```

#### 6b.6 错误恢复流程测试

- [ ] 编写错误恢复测试套件
  ```javascript
  // tests/integration/recovery.test.js

  // 测试场景 1: Stage 执行失败后 Retry
  test('should retry failed stage successfully', ...)

  // 测试场景 2: Skip 失败的 Stage
  test('should skip failed stage and continue', ...)

  // 测试场景 3: Rollback 到上一个 Stage
  test('should rollback to previous stage snapshot', ...)

  // 测试场景 4: Abort 计划
  test('should abort plan and preserve state', ...)

  // 测试场景 5: 快照创建和恢复
  test('should create and restore snapshots correctly', ...)

  // 测试场景 6: 冲突检测
  test('should detect file conflicts between plans', ...)
  ```

- [ ] 模拟失败场景
  - 文件权限错误
  - 命令执行失败
  - Claude API 超时
  - 磁盘空间不足
  - Git 操作冲突

### ✅ 完成标准

- [ ] RecoveryManager、SnapshotManager、PauseResumeManager 实现完整
- [ ] ccautorun recover 命令功能完整，支持所有恢复策略
- [ ] ccautorun audit 命令能生成完整的安全审计报告
- [ ] 快照创建、压缩、清理功能正常工作
- [ ] 错误恢复流程测试覆盖所有主要场景
- [ ] 安全测试套件覆盖依赖、敏感数据、沙箱模式
- [ ] npm audit 无高危漏洞
- [ ] 审计日志系统正常工作
- [ ] 所有测试通过，测试覆盖率 > 80%

### 📤 预期输出

**核心模块**:
- [ ] `src/core/recovery-manager.js` - 恢复管理器
- [ ] `src/core/snapshot-manager.js` - 快照管理器
- [ ] `src/core/pause-resume-manager.js` - 暂停/恢复管理器

**命令**:
- [ ] `src/commands/recover.js` - 恢复命令
- [ ] `src/commands/audit.js` - 安全审计命令

**测试**:
- [ ] `tests/integration/recovery.test.js` - 错误恢复测试
- [ ] `tests/security/dependency-scan.test.js` - 依赖扫描测试
- [ ] `tests/security/sensitive-data.test.js` - 敏感数据测试
- [ ] `tests/security/sandbox.test.js` - 沙箱测试

**文档**:
- [ ] `docs/SECURITY.md` - 安全策略文档（如果尚未创建）
- [ ] 审计报告示例

**数据结构**:
- [ ] `.ccautorun/snapshots/<plan-id>/<stage>/` - 快照存储
- [ ] `.ccautorun/logs/audit.log` - 审计日志

### ⚠️ 注意事项

**快照管理**:
- 增量备份只保存变化的文件，避免重复存储
- 使用 SHA256 哈希检测文件变化
- 快照清单（manifest.json）必须包含完整的文件列表和哈希值
- 压缩快照时保留原始清单，方便查询

**错误恢复**:
- Retry 策略应重置 Stage 状态，清除临时数据
- Rollback 需要验证快照完整性再恢复
- Skip 策略应记录跳过原因到日志
- Abort 需要保留完整的执行状态，方便后续分析

**安全审计**:
- 审计日志不应包含敏感信息（密码、API keys）
- 文件操作审计应记录完整路径和操作类型
- 命令执行审计应记录命令、参数和执行结果
- 审计报告应支持多种格式（文本、JSON、HTML）

**性能考虑**:
- 快照创建应异步执行，不阻塞主流程
- 大文件（>10MB）快照时显示进度
- 快照压缩应在后台执行
- 快照清理应定期自动执行，避免占用过多空间

**跨平台兼容**:
- 快照路径使用 `path.join()` 处理
- 压缩使用 Node.js 内置 `zlib` 模块
- 文件哈希使用 `crypto` 模块
- 确保 Windows 和 Unix 路径兼容

### 🧪 验证命令

```bash
# 测试恢复命令
ccautorun recover --help
ccautorun recover <plan-id> --strategy retry
ccautorun recover --interactive

# 测试审计命令
ccautorun audit
ccautorun audit --report json --output audit-report.json
ccautorun audit --fix

# 运行安全测试
npm run test:security

# 运行错误恢复测试
npm test -- tests/integration/recovery.test.js

# 依赖安全扫描
npm audit
npm audit fix

# 完整测试套件
npm test
npm run test:coverage
```

### 🔗 相关文件

**核心模块**:
- `src/core/recovery-manager.js`
- `src/core/snapshot-manager.js`
- `src/core/pause-resume-manager.js`
- `src/core/session-manager.js` (已存在，需要集成)

**命令**:
- `src/commands/recover.js`
- `src/commands/audit.js`
- `src/commands/pause.js` (已存在)
- `src/commands/resume.js` (已存在)

**配置和数据**:
- `.ccautorun/snapshots/` - 快照存储目录
- `.ccautorun/logs/audit.log` - 审计日志
- `.ccautorun/config.yaml` - 全局配置

**Hook 集成**:
- `.claude/hooks/user-prompt-submit` - 集成快照创建和错误检测

**相关架构文档**:
- [沙箱实现设计](../architecture/sandbox-design.md)
- [错误处理规范](../architecture/error-handling.md)

---

**完成后**:
1. 运行完整测试套件确保所有测试通过
2. 更新 [主计划进度表](../../EXECUTION_PLAN.md#📊-进度跟踪)
3. 创建 git commit: `feat: Stage 6b - Error recovery system and security audit`
4. 进入 Stage 7（文档编写和发布准备）

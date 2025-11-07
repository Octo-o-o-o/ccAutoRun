/**
 * 测试数据 Fixtures
 * 提供各种测试场景所需的计划文档、配置文件等
 */

/**
 * 拆分架构的 README.md 内容（主计划文件）
 */
export const SPLIT_ARCHITECTURE_README = `# 用户认证功能实现

<!-- AUTO-RUN-CONFIG
stages: 3
current: 1
auto_continue: true
safety_limit: 10
task_type: feature
estimated_time: 4-6h
architecture: split
-->

## 任务概览

实现完整的用户认证功能，包括登录、注册、密码重置等。

## 执行阶段

### Stage 1: 数据库设计和用户模型
**详细文档**: [docs/stages/stage-1.md](docs/stages/stage-1.md)

### Stage 2: 认证 API 实现
**详细文档**: [docs/stages/stage-2.md](docs/stages/stage-2.md)

### Stage 3: 前端集成和测试
**详细文档**: [docs/stages/stage-3.md](docs/stages/stage-3.md)
`;

/**
 * Stage 1 详细文档内容
 */
export const SPLIT_ARCHITECTURE_STAGE_1 = `# Stage 1: 数据库设计和用户模型

## 目标
设计并实现用户数据库表和模型

## 任务清单
- [ ] 创建 users 数据表
- [ ] 实现 User 模型
- [ ] 添加密码加密功能
- [ ] 编写单元测试

## 完成标准
- [ ] 数据表创建成功
- [ ] 模型测试通过
- [ ] 密码加密验证通过
`;

/**
 * Stage 2 详细文档内容
 */
export const SPLIT_ARCHITECTURE_STAGE_2 = `# Stage 2: 认证 API 实现

## 目标
实现登录、注册、登出等 API 端点

## 任务清单
- [ ] 实现 POST /api/register
- [ ] 实现 POST /api/login
- [ ] 实现 POST /api/logout
- [ ] 添加 JWT token 生成
- [ ] 编写 API 测试

## 完成标准
- [ ] 所有 API 端点正常工作
- [ ] Token 验证通过
- [ ] API 测试覆盖率 80%+
`;

/**
 * Stage 3 详细文档内容
 */
export const SPLIT_ARCHITECTURE_STAGE_3 = `# Stage 3: 前端集成和测试

## 目标
将认证功能集成到前端界面

## 任务清单
- [ ] 创建登录表单
- [ ] 创建注册表单
- [ ] 实现前端状态管理
- [ ] 添加错误提示
- [ ] 编写 E2E 测试

## 完成标准
- [ ] 用户可以成功登录和注册
- [ ] 错误处理正确
- [ ] E2E 测试通过
`;

/**
 * 单文件架构的计划内容
 */
export const SINGLE_ARCHITECTURE_PLAN = `# 简单 Bug 修复

<!-- AUTO-RUN-CONFIG
stages: 2
current: 1
auto_continue: true
safety_limit: 5
task_type: bugfix
estimated_time: 1-2h
architecture: single
-->

## Stage 1: 定位问题

### 任务
- 检查日志文件
- 复现 bug
- 定位代码位置

### 完成标准
- Bug 根源已确定

---

## Stage 2: 修复和测试

### 任务
- 修复代码
- 添加单元测试
- 验证修复有效

### 完成标准
- 测试全部通过
- Bug 不再复现
`;

/**
 * 无配置头的计划（应该报错）
 */
export const PLAN_WITHOUT_CONFIG = `# 测试计划

## Stage 1: 任务一

这是一个没有配置头的计划文档。
`;

/**
 * 配置格式错误的计划
 */
export const PLAN_WITH_INVALID_CONFIG = `# 测试计划

<!-- AUTO-RUN-CONFIG
stages: not-a-number
current: 1
-->

## Stage 1: 任务一
`;

/**
 * 正常的配置对象
 */
export const VALID_CONFIG = {
  stages: 5,
  current: 1,
  auto_continue: true,
  safety_limit: 10,
  task_type: 'feature',
  estimated_time: '6-8h',
  architecture: 'split',
};

/**
 * 最小化配置（只包含必需字段）
 */
export const MINIMAL_CONFIG = {
  stages: 3,
  current: 1,
  auto_continue: false,
  safety_limit: 0,
  architecture: 'single',
};

/**
 * 配置缺少必需字段
 */
export const INVALID_CONFIG_MISSING_FIELDS = {
  stages: 3,
  // 缺少 current, auto_continue, safety_limit, architecture
};

/**
 * 配置字段类型错误
 */
export const INVALID_CONFIG_WRONG_TYPES = {
  stages: '5', // 应该是 number
  current: '1', // 应该是 number
  auto_continue: 'yes', // 应该是 boolean
  safety_limit: 'unlimited', // 应该是 number
  architecture: 'unknown', // 应该是 'split' 或 'single'
};

/**
 * Session 元数据示例
 */
export const SESSION_METADATA = {
  id: 'test-session-123',
  planId: 'test-plan-456',
  stage: 1,
  status: 'active',
  startedAt: new Date('2025-01-07T10:00:00Z').toISOString(),
  updatedAt: new Date('2025-01-07T10:30:00Z').toISOString(),
  executionCount: 1,
  lastError: null,
};

/**
 * Session 状态（失败状态）
 */
export const SESSION_METADATA_FAILED = {
  id: 'test-session-789',
  planId: 'test-plan-456',
  stage: 2,
  status: 'failed',
  startedAt: new Date('2025-01-07T11:00:00Z').toISOString(),
  updatedAt: new Date('2025-01-07T11:15:00Z').toISOString(),
  executionCount: 3,
  lastError: {
    message: 'Test execution failed',
    code: 'TEST_ERROR',
    timestamp: new Date('2025-01-07T11:15:00Z').toISOString(),
  },
};

/**
 * 全局配置示例（config.yaml）
 */
export const GLOBAL_CONFIG_YAML = `# ccAutoRun Global Configuration
version: 1.0.0

# Default settings
defaults:
  auto_continue: true
  safety_limit: 10
  architecture: split

# Notification settings
notifications:
  enabled: true
  on_complete: true
  on_error: true
  on_stage_complete: false

# Snapshot settings
snapshots:
  enabled: true
  retention: 5

# Logging
logging:
  level: info
  file_enabled: true
  console_enabled: true
`;

/**
 * 包含 transcript 的 .claude 目录内容
 */
export const CLAUDE_TRANSCRIPT = {
  status: 'completed',
  stage: 1,
  timestamp: Date.now(),
  messages: [
    { role: 'user', content: 'Execute Stage 1' },
    { role: 'assistant', content: 'Starting Stage 1...' },
    { role: 'assistant', content: '✅ Stage 1 completed successfully' },
  ],
};

/**
 * Claude transcript 标记文件内容
 */
export const CLAUDE_MARKER_COMPLETED = 'COMPLETED:stage-1';
export const CLAUDE_MARKER_FAILED = 'FAILED:stage-2:Test execution error';

/**
 * 创建完整的拆分架构目录结构
 * @param {string} baseDir - 基础目录路径
 * @returns {Object} 文件路径和内容的映射
 */
export function createSplitArchitectureFiles(baseDir = '.ccautorun/plans/test-plan') {
  return {
    [`${baseDir}/README.md`]: SPLIT_ARCHITECTURE_README,
    [`${baseDir}/docs/stages/stage-1.md`]: SPLIT_ARCHITECTURE_STAGE_1,
    [`${baseDir}/docs/stages/stage-2.md`]: SPLIT_ARCHITECTURE_STAGE_2,
    [`${baseDir}/docs/stages/stage-3.md`]: SPLIT_ARCHITECTURE_STAGE_3,
    [`${baseDir}/metadata.json`]: JSON.stringify({
      id: 'test-plan',
      name: '用户认证功能实现',
      status: 'running',
      architecture: 'split',
      currentStage: 1,
      totalStages: 3,
      createdAt: new Date('2025-01-07T10:00:00Z').toISOString(),
      updatedAt: new Date('2025-01-07T10:00:00Z').toISOString(),
    }, null, 2),
  };
}

/**
 * 创建单文件架构目录结构
 * @param {string} baseDir - 基础目录路径
 * @returns {Object} 文件路径和内容的映射
 */
export function createSingleArchitectureFiles(baseDir = '.ccautorun/plans/test-plan-single') {
  return {
    [`${baseDir}/simple-bugfix.md`]: SINGLE_ARCHITECTURE_PLAN,
    [`${baseDir}/metadata.json`]: JSON.stringify({
      id: 'test-plan-single',
      name: '简单 Bug 修复',
      status: 'running',
      architecture: 'single',
      currentStage: 1,
      totalStages: 2,
      createdAt: new Date('2025-01-07T12:00:00Z').toISOString(),
      updatedAt: new Date('2025-01-07T12:00:00Z').toISOString(),
    }, null, 2),
  };
}

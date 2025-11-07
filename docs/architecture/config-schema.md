# 配置验证和迁移策略

## 📋 概述

完整的配置管理系统，包括 JSON Schema 验证、版本控制和自动迁移，确保配置文件的正确性和向后兼容性。

---

## 🎯 设计目标

1. **自动验证**：所有配置加载时自动验证
2. **清晰错误**：验证失败时提供具体的错误位置和修复建议
3. **向后兼容**：旧版本配置自动迁移到新版本
4. **安全迁移**：迁移前自动备份，失败时可回滚

---

## 📄 配置文件格式（YAML）

### 完整的 config.yaml 示例

```yaml
# ccAutoRun Configuration
# Version: 2.0.0

version: "2.0.0"

# Architecture selection
default_architecture: auto  # auto | split | single

# Safety limit for session count
safety_limit: unlimited  # unlimited | <number>

# Notification settings
notifications:
  enabled: true
  sound: true
  progress_frequency: every-stage  # every-stage | every-2-stages | off

# Auto-continue settings
auto_continue:
  enabled: true
  skip_permissions: true  # Automatically use --dangerously-skip-permissions

# Hook settings
hooks:
  timeout: 10  # seconds
  retry_on_failure: true
  max_retries: 3

# Editor for 'ccautorun edit' command
editor: code  # code | vim | nano | subl | atom | ...

# Git integration
git:
  auto_commit: true
  commit_template: "feat(ccautorun): complete stage {stageNumber} - {stageTitle}"
  branch_strategy: current  # current | feature
  check_dirty: true  # Check for uncommitted changes before running

# Security settings
security:
  sandbox_mode: standard  # standard | dangerous
  allowed_commands:  # Additional commands beyond default whitelist
    - docker
    - kubectl
  allowed_paths:  # Additional paths beyond project directory
    - /tmp/ccautorun-temp

# Logging
logging:
  level: info  # error | warn | info | debug | trace
  max_size: 10485760  # 10MB in bytes
  max_files: 5
  retention_days: 30

# Snapshot management
snapshots:
  enabled: true
  retention_count: 5  # Number of snapshots to keep per task
  max_size: 524288000  # 500MB in bytes

# Advanced settings
advanced:
  telemetry: false  # Send anonymous usage data (v2.1)
  check_updates: true  # Check for new versions on startup
  experimental_features: []  # Enable experimental features
```

---

## 🔍 JSON Schema 定义

### 完整的 Schema

```javascript
// src/schemas/config-schema.js
export const CONFIG_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['version'],
  additionalProperties: false,  // 不允许未定义的字段
  properties: {
    version: {
      type: 'string',
      pattern: '^\\d+\\.\\d+\\.\\d+$',
      description: 'Configuration version (semver format)'
    },

    default_architecture: {
      type: 'string',
      enum: ['auto', 'split', 'single'],
      default: 'auto',
      description: 'Default architecture for plan generation'
    },

    safety_limit: {
      oneOf: [
        { type: 'string', enum: ['unlimited'] },
        { type: 'integer', minimum: 1 }
      ],
      default: 'unlimited',
      description: 'Maximum auto-continue sessions before stopping'
    },

    notifications: {
      type: 'object',
      additionalProperties: false,
      properties: {
        enabled: { type: 'boolean', default: true },
        sound: { type: 'boolean', default: true },
        progress_frequency: {
          type: 'string',
          enum: ['every-stage', 'every-2-stages', 'off'],
          default: 'every-stage'
        }
      }
    },

    auto_continue: {
      type: 'object',
      additionalProperties: false,
      properties: {
        enabled: { type: 'boolean', default: true },
        skip_permissions: {
          type: 'boolean',
          default: true,
          description: 'Use --dangerously-skip-permissions automatically'
        }
      }
    },

    hooks: {
      type: 'object',
      additionalProperties: false,
      properties: {
        timeout: {
          type: 'integer',
          minimum: 5,
          maximum: 60,
          default: 10,
          description: 'Hook execution timeout in seconds'
        },
        retry_on_failure: { type: 'boolean', default: true },
        max_retries: {
          type: 'integer',
          minimum: 0,
          maximum: 10,
          default: 3
        }
      }
    },

    editor: {
      type: 'string',
      default: 'code',
      description: 'Default editor for ccautorun edit command'
    },

    git: {
      type: 'object',
      additionalProperties: false,
      properties: {
        auto_commit: { type: 'boolean', default: true },
        commit_template: { type: 'string' },
        branch_strategy: {
          type: 'string',
          enum: ['current', 'feature'],
          default: 'current'
        },
        check_dirty: {
          type: 'boolean',
          default: true,
          description: 'Check for uncommitted changes before execution'
        }
      }
    },

    security: {
      type: 'object',
      additionalProperties: false,
      properties: {
        sandbox_mode: {
          type: 'string',
          enum: ['standard', 'dangerous'],
          default: 'standard'
        },
        allowed_commands: {
          type: 'array',
          items: { type: 'string' },
          default: [],
          description: 'Additional commands to whitelist'
        },
        allowed_paths: {
          type: 'array',
          items: { type: 'string' },
          default: [],
          description: 'Additional paths to allow access'
        }
      }
    },

    logging: {
      type: 'object',
      additionalProperties: false,
      properties: {
        level: {
          type: 'string',
          enum: ['error', 'warn', 'info', 'debug', 'trace'],
          default: 'info'
        },
        max_size: {
          type: 'integer',
          minimum: 1048576,  // 1MB minimum
          default: 10485760  // 10MB
        },
        max_files: {
          type: 'integer',
          minimum: 1,
          maximum: 20,
          default: 5
        },
        retention_days: {
          type: 'integer',
          minimum: 1,
          maximum: 365,
          default: 30
        }
      }
    },

    snapshots: {
      type: 'object',
      additionalProperties: false,
      properties: {
        enabled: { type: 'boolean', default: true },
        retention_count: {
          type: 'integer',
          minimum: 1,
          maximum: 20,
          default: 5
        },
        max_size: {
          type: 'integer',
          minimum: 10485760,  // 10MB minimum
          default: 524288000  // 500MB
        }
      }
    },

    advanced: {
      type: 'object',
      additionalProperties: false,
      properties: {
        telemetry: { type: 'boolean', default: false },
        check_updates: { type: 'boolean', default: true },
        experimental_features: {
          type: 'array',
          items: { type: 'string' },
          default: []
        }
      }
    }
  }
};
```

---

## ✅ 配置验证实现

### ConfigValidator 类

```javascript
// src/utils/config-validator.js
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { CONFIG_SCHEMA } from '../schemas/config-schema.js';
import { throwError } from './error-handler.js';
import chalk from 'chalk';

export class ConfigValidator {
  constructor() {
    this.ajv = new Ajv({
      allErrors: true,      // 返回所有错误，不是只返回第一个
      useDefaults: true,    // 自动填充默认值
      removeAdditional: true  // 移除未定义的字段
    });
    addFormats(this.ajv);
    this.validate = this.ajv.compile(CONFIG_SCHEMA);
  }

  /**
   * 验证配置对象
   * @param {object} config - 配置对象
   * @returns {object} { valid: boolean, errors?: array, normalized?: object }
   */
  validateConfig(config) {
    const valid = this.validate(config);

    if (!valid) {
      return {
        valid: false,
        errors: this.formatErrors(this.validate.errors)
      };
    }

    return {
      valid: true,
      normalized: config  // Ajv 已经应用了默认值和移除了额外字段
    };
  }

  /**
   * 格式化 Ajv 错误为用户友好的消息
   */
  formatErrors(ajvErrors) {
    return ajvErrors.map(error => {
      const path = error.instancePath || 'root';
      let message = '';
      let suggestion = '';

      switch (error.keyword) {
        case 'type':
          message = `${path}: Expected ${error.params.type}, got ${typeof error.data}`;
          suggestion = `Change to ${error.params.type} type`;
          break;

        case 'enum':
          message = `${path}: Invalid value "${error.data}"`;
          suggestion = `Valid values: ${error.params.allowedValues.join(', ')}`;
          break;

        case 'required':
          message = `Missing required field: ${error.params.missingProperty}`;
          suggestion = `Add "${error.params.missingProperty}" to your config`;
          break;

        case 'additionalProperties':
          message = `${path}: Unknown property "${error.params.additionalProperty}"`;
          suggestion = 'Remove this property or check for typos';
          break;

        case 'minimum':
          message = `${path}: Value ${error.data} is too small (minimum: ${error.params.limit})`;
          suggestion = `Use a value >= ${error.params.limit}`;
          break;

        case 'maximum':
          message = `${path}: Value ${error.data} is too large (maximum: ${error.params.limit})`;
          suggestion = `Use a value <= ${error.params.limit}`;
          break;

        default:
          message = `${path}: ${error.message}`;
          suggestion = 'Check configuration documentation';
      }

      return {
        path,
        message,
        suggestion,
        keyword: error.keyword,
        params: error.params
      };
    });
  }

  /**
   * 打印验证错误（用户友好）
   */
  printErrors(errors) {
    console.error(chalk.red.bold('\n✗ Configuration validation failed:\n'));

    errors.forEach((error, i) => {
      console.error(chalk.red(`  ${i + 1}. ${error.message}`));
      console.error(chalk.yellow(`     → ${error.suggestion}`));
      console.error('');
    });

    console.error(chalk.cyan('  Run "ccautorun config --validate" for detailed diagnostics'));
    console.error(chalk.cyan('  See: https://docs.ccautorun.com/config-reference\n'));
  }
}
```

### 集成到 ConfigManager

```javascript
// src/utils/config.js
import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import { ConfigValidator } from './config-validator.js';
import { throwError } from './error-handler.js';

export class ConfigManager {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.configPath = path.join(projectRoot, '.ccautorun', 'config.yaml');
    this.validator = new ConfigValidator();
    this._cache = null;
  }

  /**
   * 读取并验证配置
   * @param {boolean} skipValidation - 跳过验证（仅用于迁移）
   * @returns {object} 验证后的配置对象
   */
  load(skipValidation = false) {
    // 如果已缓存，直接返回
    if (this._cache) {
      return this._cache;
    }

    // 检查文件是否存在
    if (!fs.existsSync(this.configPath)) {
      throwError('E_CONFIG_001', { path: this.configPath });
    }

    // 读取 YAML
    let config;
    try {
      const content = fs.readFileSync(this.configPath, 'utf-8');
      config = yaml.parse(content);
    } catch (error) {
      throwError('E_CONFIG_002', {
        details: `YAML parsing failed: ${error.message}`
      });
    }

    // 跳过验证（用于迁移流程）
    if (skipValidation) {
      return config;
    }

    // 验证配置
    const result = this.validator.validateConfig(config);
    if (!result.valid) {
      this.validator.printErrors(result.errors);
      throwError('E_CONFIG_002', {
        details: `${result.errors.length} validation error(s)`
      });
    }

    // 缓存并返回
    this._cache = result.normalized;
    return this._cache;
  }

  /**
   * 保存配置
   */
  save(config) {
    // 验证配置
    const result = this.validator.validateConfig(config);
    if (!result.valid) {
      this.validator.printErrors(result.errors);
      throwError('E_CONFIG_002', {
        details: `${result.errors.length} validation error(s)`
      });
    }

    // 写入文件
    const content = yaml.stringify(result.normalized);
    fs.writeFileSync(this.configPath, content, 'utf-8');

    // 更新缓存
    this._cache = result.normalized;
  }

  /**
   * 获取嵌套配置值（支持点号路径）
   * @param {string} keyPath - 如 "notifications.enabled"
   * @returns {any} 配置值
   */
  get(keyPath) {
    const config = this.load();
    const keys = keyPath.split('.');
    let value = config;

    for (const key of keys) {
      if (value === undefined || value === null) {
        return undefined;
      }
      value = value[key];
    }

    return value;
  }

  /**
   * 设置嵌套配置值（支持点号路径）
   * @param {string} keyPath - 如 "notifications.enabled"
   * @param {any} value - 新值
   */
  set(keyPath, value) {
    const config = this.load();
    const keys = keyPath.split('.');
    const lastKey = keys.pop();
    let target = config;

    // 导航到目标对象
    for (const key of keys) {
      if (!(key in target)) {
        target[key] = {};
      }
      target = target[key];
    }

    // 设置值
    target[lastKey] = value;

    // 保存（会自动验证）
    this.save(config);
  }
}
```

---

## 🔄 配置版本迁移

### 版本历史

| 版本 | 发布日期 | 主要变更 |
|------|---------|---------|
| 1.0.0 | 2024-12 | 初始版本（Windows 版） |
| 2.0.0 | 2025-01 | 完全重构，跨平台 |
| 2.1.0 | 2025-03 (计划) | 多任务并行、插件系统 |

### 迁移器实现

```javascript
// src/utils/config-migrator.js
import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import logger from './logger.js';

/**
 * 配置迁移器
 */
export class ConfigMigrator {
  constructor(configPath) {
    this.configPath = configPath;
  }

  /**
   * 检查是否需要迁移
   * @returns {object} { needsMigration: boolean, from: string, to: string }
   */
  checkMigration() {
    if (!fs.existsSync(this.configPath)) {
      return { needsMigration: false };
    }

    const content = fs.readFileSync(this.configPath, 'utf-8');
    const config = yaml.parse(content);

    const currentVersion = config.version || '1.0.0';
    const targetVersion = '2.0.0';

    if (currentVersion === targetVersion) {
      return { needsMigration: false };
    }

    return {
      needsMigration: true,
      from: currentVersion,
      to: targetVersion
    };
  }

  /**
   * 执行迁移
   * @param {boolean} dryRun - 预览模式，不实际修改文件
   * @returns {object} { success: boolean, changes: array, backup?: string }
   */
  migrate(dryRun = false) {
    const check = this.checkMigration();
    if (!check.needsMigration) {
      logger.info('Configuration is already up to date');
      return { success: true, changes: [] };
    }

    logger.info(`Migrating configuration from ${check.from} to ${check.to}...`);

    // 1. 备份原始配置
    const backupPath = !dryRun ? this.createBackup() : null;

    // 2. 读取旧配置
    const content = fs.readFileSync(this.configPath, 'utf-8');
    const oldConfig = yaml.parse(content);

    // 3. 执行迁移转换
    const { newConfig, changes } = this.transform(oldConfig, check.from, check.to);

    // 4. 写入新配置（如果不是 dry-run）
    if (!dryRun) {
      const newContent = yaml.stringify(newConfig);
      fs.writeFileSync(this.configPath, newContent, 'utf-8');
      logger.info(`✓ Configuration migrated successfully`);
      logger.info(`  Backup saved at: ${backupPath}`);
    } else {
      logger.info('✓ Migration preview (dry-run mode)');
    }

    return {
      success: true,
      changes,
      backup: backupPath
    };
  }

  /**
   * 创建备份
   */
  createBackup() {
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
    const backupPath = this.configPath + `.backup-${timestamp}`;
    fs.copyFileSync(this.configPath, backupPath);
    return backupPath;
  }

  /**
   * 转换配置（根据版本）
   */
  transform(oldConfig, fromVersion, toVersion) {
    const changes = [];

    // 从 1.0.0 迁移到 2.0.0
    if (fromVersion.startsWith('1.')) {
      return this.migrate_1_to_2(oldConfig, changes);
    }

    // 未来：从 2.0.0 迁移到 2.1.0
    if (fromVersion.startsWith('2.0')) {
      return this.migrate_2_0_to_2_1(oldConfig, changes);
    }

    return { newConfig: oldConfig, changes };
  }

  /**
   * 1.x → 2.0 迁移
   */
  migrate_1_to_2(oldConfig, changes) {
    const newConfig = {
      version: '2.0.0',
      default_architecture: 'auto',
      safety_limit: 'unlimited',
      notifications: {
        enabled: true,
        sound: true,
        progress_frequency: 'every-stage'
      },
      auto_continue: {
        enabled: true,
        skip_permissions: true
      },
      hooks: {
        timeout: 10,
        retry_on_failure: true,
        max_retries: 3
      },
      editor: 'code',
      git: {
        auto_commit: true,
        branch_strategy: 'current',
        check_dirty: true
      },
      security: {
        sandbox_mode: 'standard',
        allowed_commands: [],
        allowed_paths: []
      },
      logging: {
        level: 'info',
        max_size: 10485760,
        max_files: 5,
        retention_days: 30
      },
      snapshots: {
        enabled: true,
        retention_count: 5,
        max_size: 524288000
      },
      advanced: {
        telemetry: false,
        check_updates: true,
        experimental_features: []
      }
    };

    // 迁移旧的配置项（如果存在）
    if (oldConfig.architecture) {
      newConfig.default_architecture = oldConfig.architecture;
      changes.push({
        type: 'rename',
        from: 'architecture',
        to: 'default_architecture',
        value: oldConfig.architecture
      });
    }

    if (oldConfig.max_sessions !== undefined) {
      newConfig.safety_limit = oldConfig.max_sessions === 0 ? 'unlimited' : oldConfig.max_sessions;
      changes.push({
        type: 'rename',
        from: 'max_sessions',
        to: 'safety_limit',
        value: newConfig.safety_limit
      });
    }

    // 新增的字段
    const newFields = [
      'hooks',
      'git',
      'security',
      'logging',
      'snapshots',
      'advanced'
    ];
    newFields.forEach(field => {
      changes.push({
        type: 'add',
        field,
        value: newConfig[field]
      });
    });

    // 删除的字段
    const removedFields = Object.keys(oldConfig).filter(
      key => !['version', 'architecture', 'max_sessions'].includes(key)
    );
    removedFields.forEach(field => {
      changes.push({
        type: 'remove',
        field,
        oldValue: oldConfig[field]
      });
    });

    return { newConfig, changes };
  }

  /**
   * 2.0 → 2.1 迁移（未来功能）
   */
  migrate_2_0_to_2_1(oldConfig, changes) {
    const newConfig = { ...oldConfig, version: '2.1.0' };

    // 示例：添加新字段
    if (!newConfig.parallel) {
      newConfig.parallel = {
        enabled: false,
        max_tasks: 5
      };
      changes.push({
        type: 'add',
        field: 'parallel',
        value: newConfig.parallel
      });
    }

    return { newConfig, changes };
  }

  /**
   * 打印迁移变更（用户友好）
   */
  printChanges(changes) {
    console.log(chalk.bold('\nConfiguration changes:\n'));

    const grouped = {
      add: changes.filter(c => c.type === 'add'),
      rename: changes.filter(c => c.type === 'rename'),
      remove: changes.filter(c => c.type === 'remove')
    };

    if (grouped.add.length > 0) {
      console.log(chalk.green.bold('  Added:'));
      grouped.add.forEach(c => {
        console.log(chalk.green(`    + ${c.field}: ${JSON.stringify(c.value)}`));
      });
      console.log('');
    }

    if (grouped.rename.length > 0) {
      console.log(chalk.yellow.bold('  Renamed:'));
      grouped.rename.forEach(c => {
        console.log(chalk.yellow(`    ${c.from} → ${c.to} (value: ${c.value})`));
      });
      console.log('');
    }

    if (grouped.remove.length > 0) {
      console.log(chalk.red.bold('  Removed:'));
      grouped.remove.forEach(c => {
        console.log(chalk.red(`    - ${c.field} (was: ${JSON.stringify(c.oldValue)})`));
      });
      console.log('');
    }
  }
}
```

### 使用迁移器

```javascript
// src/commands/config.js
import { ConfigMigrator } from '../utils/config-migrator.js';

// 在 load() 之前检查
const migrator = new ConfigMigrator(configPath);
const check = migrator.checkMigration();

if (check.needsMigration) {
  console.log(chalk.yellow(`\n⚠️  Configuration needs migration (${check.from} → ${check.to})`));
  console.log(chalk.yellow('   Run "ccautorun config --migrate" to upgrade\n'));

  // 如果用户强制加载，跳过验证（避免旧格式验证失败）
  return configManager.load(true);  // skipValidation = true
}
```

### 迁移命令

```javascript
// src/commands/config.js
program
  .command('config')
  .option('--migrate', 'Migrate configuration to latest version')
  .option('--dry-run', 'Preview migration changes without applying')
  .action((options) => {
    if (options.migrate) {
      const migrator = new ConfigMigrator(configPath);
      const check = migrator.checkMigration();

      if (!check.needsMigration) {
        console.log(chalk.green('✓ Configuration is already up to date'));
        return;
      }

      // 预览或执行迁移
      const result = migrator.migrate(options.dryRun);
      migrator.printChanges(result.changes);

      if (options.dryRun) {
        console.log(chalk.cyan('\nThis was a dry-run. No changes were made.'));
        console.log(chalk.cyan('Run "ccautorun config --migrate" to apply changes.'));
      } else {
        console.log(chalk.green('\n✓ Configuration migrated successfully!'));
        console.log(chalk.gray(`  Backup: ${result.backup}`));
      }
    } else {
      // 交互式配置...
    }
  });
```

---

## 🧪 测试用例

### 验证测试

```javascript
// tests/unit/config-validator.test.js
import { describe, it, expect } from 'vitest';
import { ConfigValidator } from '../../src/utils/config-validator.js';

describe('ConfigValidator', () => {
  const validator = new ConfigValidator();

  it('should validate correct config', () => {
    const config = {
      version: '2.0.0',
      default_architecture: 'auto',
      safety_limit: 'unlimited',
      notifications: { enabled: true }
    };
    const result = validator.validateConfig(config);
    expect(result.valid).toBe(true);
  });

  it('should reject missing version', () => {
    const config = { default_architecture: 'auto' };
    const result = validator.validateConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain('version');
  });

  it('should reject invalid enum value', () => {
    const config = {
      version: '2.0.0',
      default_architecture: 'invalid'
    };
    const result = validator.validateConfig(config);
    expect(result.valid).toBe(false);
  });

  it('should apply default values', () => {
    const config = { version: '2.0.0' };
    const result = validator.validateConfig(config);
    expect(result.normalized.default_architecture).toBe('auto');
  });
});
```

### 迁移测试

```javascript
// tests/unit/config-migrator.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigMigrator } from '../../src/utils/config-migrator.js';
import fs from 'fs';
import path from 'path';

describe('ConfigMigrator', () => {
  const testConfigPath = '/tmp/test-config.yaml';

  beforeEach(() => {
    // 清理测试文件
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
  });

  it('should detect migration need', () => {
    const oldConfig = { version: '1.0.0', architecture: 'split' };
    fs.writeFileSync(testConfigPath, yaml.stringify(oldConfig));

    const migrator = new ConfigMigrator(testConfigPath);
    const check = migrator.checkMigration();

    expect(check.needsMigration).toBe(true);
    expect(check.from).toBe('1.0.0');
    expect(check.to).toBe('2.0.0');
  });

  it('should migrate 1.x to 2.0', () => {
    const oldConfig = { version: '1.0.0', architecture: 'split', max_sessions: 10 };
    fs.writeFileSync(testConfigPath, yaml.stringify(oldConfig));

    const migrator = new ConfigMigrator(testConfigPath);
    const result = migrator.migrate();

    expect(result.success).toBe(true);
    expect(result.changes.length).toBeGreaterThan(0);

    const newConfig = yaml.parse(fs.readFileSync(testConfigPath, 'utf-8'));
    expect(newConfig.version).toBe('2.0.0');
    expect(newConfig.default_architecture).toBe('split');
    expect(newConfig.safety_limit).toBe(10);
  });

  it('should create backup before migration', () => {
    const oldConfig = { version: '1.0.0' };
    fs.writeFileSync(testConfigPath, yaml.stringify(oldConfig));

    const migrator = new ConfigMigrator(testConfigPath);
    const result = migrator.migrate();

    expect(fs.existsSync(result.backup)).toBe(true);
  });
});
```

---

## 📊 实现清单

### Stage 1
- [ ] 创建 `src/schemas/config-schema.js`（完整 JSON Schema，150行）
- [ ] 创建 `src/utils/config-validator.js`（ConfigValidator 类，200行）
- [ ] 更新 `src/utils/config.js`（集成验证，150行）

### Stage 2a
- [ ] 在所有 config 读取位置使用验证
- [ ] 实现 `ccautorun config --validate` 命令

### Stage 2b
- [ ] 创建 `src/utils/config-migrator.js`（ConfigMigrator 类，300行）
- [ ] 实现 `ccautorun config --migrate` 命令
- [ ] 在 `doctor` 命令中添加配置版本检查

### Stage 5.5
- [ ] 编写配置验证单元测试
- [ ] 编写配置迁移单元测试

---

## 🔗 相关文档
- [错误处理规范](error-handling.md) - 配置错误码定义
- [主执行计划](../../EXECUTION_PLAN.md) - 配置管理概览
- [Stage 2a 设计](../stages/stage-2a.md) - 配置工具实现

# Stage 1: 项目结构重组和清理 🔄

**[← 返回主计划](../../EXECUTION_PLAN.md)** | **下一阶段: [Stage 2a →](stage-2a.md)**

---

## 📋 阶段信息

- **阶段编号**: Stage 1
- **预计时间**: 4-6小时
- **依赖**: 无
- **状态**: ⏳ 进行中

### 🎯 目标
清理现有混合代码，建立纯Node.js项目结构

### 📝 任务清单
- [ ] 备份现有valuable代码（PowerShell核心逻辑、文档）
- [ ] 创建新的Node.js项目结构
  ```
  src/
  ├── cli.js                 # CLI入口
  ├── commands/              # 命令实现
  │   ├── init.js
  │   ├── plan.js
  │   ├── list.js
  │   └── status.js
  ├── hooks/
  │   └── auto-continue.js   # Hook实现
  ├── core/
  │   ├── plan-parser.js     # 解析计划文档
  │   ├── session-manager.js # 会话管理
  │   └── safety-limiter.js  # 安全限制
  └── utils/
      ├── notifier.js        # 通知
      ├── logger.js          # 日志
      ├── config.js          # 配置
      ├── error-handler.js   # 统一错误处理
      └── config-validator.js # 配置验证
  ```
- [ ] 创建package.json，配置依赖
  ```json
  {
    "name": "ccautorun",
    "version": "2.0.0",
    "type": "module",
    "bin": {
      "ccautorun": "./bin/ccautorun.js"
    },
    "dependencies": {
      "commander": "^11.0.0",
      "node-notifier": "^10.0.0",
      "chokidar": "^3.5.0",
      "yaml": "^2.3.0",
      "chalk": "^5.3.0",
      "ora": "^7.0.0",
      "inquirer": "^9.2.0",
      "glob": "^10.3.0",
      "ajv": "^8.12.0",
      "winston": "^3.11.0"
    },
    "devDependencies": {
      "vitest": "^1.0.0",
      "@vitest/ui": "^1.0.0"
    }
  }
  ```
- [ ] 创建.gitignore（node_modules, *.log, .ccautorun/sessions等）
- [ ] 创建bin/ccautorun.js作为全局入口
- [ ] npm install安装依赖

### ✅ 完成标准
- [ ] 项目结构符合Node.js最佳实践
- [ ] package.json配置正确
- [ ] 所有依赖安装成功
- [ ] bin文件有执行权限（chmod +x）
- [ ] 可以运行 `node bin/ccautorun.js --help`（即使只是空壳）

### 📤 预期输出
- [ ] `package.json` (新建)
- [ ] `src/` 目录结构（空文件占位）
- [ ] `bin/ccautorun.js` (入口文件)
- [ ] `.gitignore` (新建)
- [ ] `node_modules/` (依赖安装)

### ⚠️ 注意事项
- 不要删除现有的.claude/、docs/目录，后续可能有用
- 使用ES Modules（"type": "module"）
- bin文件需要shebang: `#!/usr/bin/env node`

### 🧪 验证命令
```bash
# 检查结构
tree -L 2 src/

# 测试CLI入口
node bin/ccautorun.js --version

# 检查依赖
npm list --depth=0
```

---


# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 🎯 Project Overview

**ccAutoRun v2.0** is an AI-powered task automation tool for Claude Code that transforms complex development tasks into self-executing workflows. The tool allows users to generate intelligent execution plans with AI, then automatically executes them stage-by-stage with zero intervention.

**Key Innovation**: Split architecture design that loads only the current stage (not the entire plan), achieving 90%+ token savings and enabling Claude to handle massive multi-stage tasks efficiently.

---

## 🏗️ Architecture

### Core Design Principles

1. **Split Architecture** (Primary)
   - Plans stored as: `EXECUTION_PLAN.md` (overview) + `stages/stage-N.md` (detailed steps)
   - Only current stage loaded into context → 90%+ token efficiency
   - Supports complex tasks with 8+ stages, each with 800-2500 lines
   - Located in: `.ccautorun/plans/<plan-id>/`

2. **Hook-Based Auto-Continuation**
   - `.claude/hooks/auto-continue.ps1` (Windows) or `.sh` (Unix)
   - Automatically triggers next stage via `ccautorun trigger`
   - Session manager tracks progress in `.ccautorun/sessions/`
   - Safety limiter prevents runaway execution (configurable stage limit)

3. **Pure Node.js Cross-Platform**
   - ES Modules (`type: "module"` in package.json)
   - Supports macOS, Windows, Linux
   - Node.js >= 18.0.0 required

### Directory Structure

```
src/
├── cli.js                    # Main CLI entry (Commander.js)
├── commands/                 # CLI commands (21 commands)
│   ├── init.js              # Project initialization + hook setup
│   ├── plan.js              # Plan validation (AI generation in slash command)
│   ├── status.js            # Show current plan status
│   ├── pause.js/resume.js   # Pause/resume execution
│   ├── recover.js           # Error recovery (retry/skip/rollback/abort)
│   └── ...
├── core/                     # Core automation engine
│   ├── plan-parser.js       # Parse EXECUTION_PLAN.md and stages/
│   ├── session-manager.js   # Session state (CRUD operations)
│   ├── safety-limiter.js    # Prevent runaway execution
│   ├── recovery-manager.js  # Error recovery strategies
│   ├── snapshot-manager.js  # File snapshots for rollback
│   └── pause-resume-manager.js
├── hooks/
│   └── auto-continue.js     # Node.js implementation of hook logic
└── utils/
    ├── logger.js            # Winston logger with rotation
    ├── config.js            # YAML config management
    ├── error-handler.js     # Centralized error handling
    └── notifier.js          # Desktop notifications (node-notifier)

.claude/
├── commands/
│   └── plan.md              # /plan slash command (AI plan generation)
└── hooks/
    └── auto-continue.ps1    # PowerShell hook for Windows

.ccautorun/                   # User data directory (NOT in repo)
├── plans/<plan-id>/         # Individual plan storage
│   ├── metadata.json        # Plan metadata
│   ├── EXECUTION_PLAN.md    # Plan overview
│   └── stages/              # Detailed stage files
├── sessions/                # Session tracking (*.json)
├── snapshots/               # File snapshots for rollback
├── logs/                    # Winston logs with rotation
└── config.yaml              # User configuration
```

---

## 🛠️ Development Commands

### Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit           # Unit tests (51+ cases)
npm run test:integration    # Integration tests (36+ cases)
npm run test:e2e           # End-to-end tests (3+ cases)

# Watch mode for TDD
npm run test:watch

# Coverage report (target: 73%+)
npm run test:coverage

# Run single test file
npx vitest run tests/unit/plan-parser.test.js
```

### Linting

```bash
# Lint source code
npm run lint

# ESLint with auto-fix
npx eslint src/ --fix
```

### Local Development

```bash
# Install dependencies
npm install

# Link for global CLI testing
npm link

# Test CLI commands
ccautorun --version
ccautorun init --setup-hooks
ccautorun doctor

# Unlink when done
npm unlink -g ccautorun
```

### Building and Publishing

```bash
# Prepare for publish (runs tests + lint)
npm run prepublishOnly

# Publish to npm
npm publish
```

---

## 🧩 Key Architectural Patterns

### 1. Logger Pattern (CRITICAL)

**Always use `getLogger()` function call, NEVER import `logger` directly.**

```javascript
// ✅ CORRECT
import { getLogger } from '../utils/logger.js';
const logger = getLogger();

logger.info('Message');
logger.error('Error', { error: error.message });

// ❌ WRONG - Will cause SyntaxError
import { logger } from '../utils/logger.js';  // Export doesn't exist!
```

**Why**: `logger.js` exports `Logger` class and `getLogger()` function, but NOT a `logger` instance.

### 2. Session Management

Session data is stored in `.ccautorun/sessions/<taskName>.json`:

```javascript
import { SessionManager } from '../core/session-manager.js';

// CRUD operations
SessionManager.create(taskName, { currentStage: 1 });
const session = SessionManager.read(taskName);
SessionManager.update(taskName, { status: 'completed' });
SessionManager.delete(taskName);

// Status management
SessionManager.setStatus(taskName, 'paused');
SessionManager.incrementCount(taskName);
```

### 3. Plan Parser Architecture Detection

```javascript
import { detectArchitecture, parsePlan } from '../core/plan-parser.js';

// Auto-detect architecture type
const type = detectArchitecture(planPath); // 'split' | 'single' | null

// Parse plan metadata and current stage
const plan = parsePlan(planPath, currentStage);
// Returns: { metadata, config, stageContent, architecture }
```

### 4. Error Handling Pattern

Use centralized error handler with error codes:

```javascript
import { Errors } from '../utils/error-handler.js';

// Throw structured errors
throw Errors.sessionNotFound({ taskName: 'myTask' });
throw Errors.planNotFound({ planId: 'plan-123' });
throw Errors.invalidConfig({ key: 'safetyLimit', reason: 'Must be >= 0' });

// All errors include:
// - Unique error code (e.g., E_SESSION_001)
// - User-friendly message
// - Suggestions for resolution
```

### 5. Configuration Management

Configuration stored in `.ccautorun/config.yaml`:

```javascript
import { getConfig, setConfig } from '../utils/config.js';

// Read config with defaults
const config = getConfig();
const safetyLimit = config.safetyLimit || 3;

// Update config
setConfig('default_architecture', 'split');

// Validate config (uses JSON Schema)
import { validateConfig } from '../utils/config-validator.js';
const result = validateConfig(configData);
```

---

## 🔄 Workflow: How Auto-Continuation Works

1. **User runs**: `/plan <task description>` in Claude Code
2. **AI generates**: Split architecture plan → `.ccautorun/plans/<id>/`
3. **User confirms**: Plan is validated and saved
4. **Hook executes**: `.claude/hooks/auto-continue.ps1` monitors completion
5. **Auto-trigger**: `ccautorun trigger <plan-id>` loads next stage
6. **Claude resumes**: With only current stage in context (token efficient!)
7. **Repeat**: Until all stages complete or safety limit reached

**Safety Limiter**: After N stages (default: 3), execution pauses for manual review. User must run `ccautorun resume` to continue.

---

## 🧪 Testing Guidelines

### Test Structure

```
tests/
├── unit/                    # Pure logic tests (51+ tests)
│   ├── plan-parser.test.js
│   ├── session-manager.test.js
│   └── safety-limiter.test.js
├── integration/             # Module interaction tests (36+ tests)
│   ├── init-flow.test.js
│   └── config-validation.test.js
└── e2e/                     # End-to-end CLI tests (3+ tests)
    └── archive-cleanup.test.js
```

### Writing Tests

```javascript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SessionManager } from '@/core/session-manager.js';

describe('SessionManager', () => {
  beforeEach(() => {
    // Setup test environment
  });

  afterEach(() => {
    // Cleanup
  });

  it('should create session with default values', () => {
    const session = SessionManager.create('test-task');
    expect(session.status).toBe('active');
    expect(session.count).toBe(0);
  });
});
```

### E2E Test Helper

Use `tests/helpers/e2e-test.js` for CLI testing:

```javascript
import { E2ETest } from '@tests/helpers/e2e-test.js';

it('should initialize project', async () => {
  const test = new E2ETest();
  await test.setup();

  const result = await test.run('ccautorun', ['init']);

  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain('✓ Project initialized');

  await test.cleanup();
});
```

### Known Test Issues (v2.0)

- **32 E2E test failures** exist due to path resolution inconsistencies
- Tests expect `CCAUTORUN_HOME` env var support, but some modules use `os.homedir()`
- Core CLI functionality works correctly (all unit tests pass)
- Deferred to v2.0.1 to avoid introducing new bugs
- Test pass rate: **83.8%** (166/198)

---

## 📝 Code Style and Conventions

### ES Modules

- All files use ES Modules (`import`/`export`)
- File extensions required: `.js` (not optional)
- No CommonJS (`require()`) except in config files (`.eslintrc.cjs`)

### Naming Conventions

- **Files**: kebab-case (e.g., `plan-parser.js`, `session-manager.js`)
- **Classes**: PascalCase (e.g., `SessionManager`, `RecoveryManager`)
- **Functions**: camelCase (e.g., `parsePlan`, `getConfig`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_STAGES`, `DEFAULT_SAFETY_LIMIT`)

### Atomic File Writes

Always use atomic writes for data persistence:

```javascript
// ✅ CORRECT - Atomic write pattern
const tmpPath = `${targetPath}.tmp`;
await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
await fs.rename(tmpPath, targetPath);

// ❌ WRONG - Direct write (not atomic)
await fs.writeFile(targetPath, JSON.stringify(data, null, 2));
```

### Error Handling

```javascript
// ✅ CORRECT - Structured error with context
try {
  // ...
} catch (error) {
  logger.error('Failed to parse plan', {
    planId,
    error: error.message,
    stack: error.stack
  });
  throw Errors.planParseError({ planId, reason: error.message });
}

// ❌ WRONG - Generic error
throw new Error('Plan parse failed');
```

---

## 🔍 Architecture Documentation

For detailed design specifications, refer to:

1. **[Git Integration Strategy](docs/architecture/git-integration.md)**
   - Git workflow and commit conventions
   - Pre-execution checks and branch management

2. **[Sandbox Implementation](docs/architecture/sandbox-design.md)**
   - File access control and command whitelisting
   - Security audit and sensitive file protection

3. **[Error Handling Specification](docs/architecture/error-handling.md)**
   - Error code system and message formatting
   - User-friendly suggestions and help system

4. **[Configuration Schema](docs/architecture/config-schema.md)**
   - JSON Schema validation
   - Version migration strategies

**Always consult these docs before implementing new features in related areas.**

---

## 🚀 Quick Reference: Common Tasks

### Add a New CLI Command

1. Create `src/commands/mycommand.js`:
```javascript
import { getLogger } from '../utils/logger.js';
const logger = getLogger();

export async function myCommand(options) {
  logger.info('Running my command', { options });
  // Implementation
}

export function registerMyCommand(program) {
  program
    .command('mycommand')
    .description('Do something')
    .option('--flag', 'A flag')
    .action(myCommand);
}
```

2. Register in `src/cli.js`:
```javascript
import { registerMyCommand } from './commands/mycommand.js';
registerMyCommand(program);
```

3. Add tests in `tests/unit/mycommand.test.js`

### Add a New Error Type

In `src/utils/error-handler.js`:
```javascript
export const Errors = {
  // ...
  myError(context) {
    return createError('E_MY_001',
      `Error message: ${context.detail}`,
      ['Suggestion 1', 'Suggestion 2']
    );
  },
};
```

### Modify Plan Parser Logic

- Core logic: `src/core/plan-parser.js`
- Tests: `tests/unit/plan-parser.test.js`
- Remember: Support both split and single architectures (single deferred to v2.1, but parser ready)

---

## 🌐 Cross-Platform Considerations

### Path Handling

```javascript
import path from 'path';
import os from 'os';

// ✅ CORRECT - Cross-platform paths
const ccDir = path.join(os.homedir(), '.ccautorun');
const planPath = path.join(ccDir, 'plans', planId, 'EXECUTION_PLAN.md');

// ❌ WRONG - Hard-coded separators
const planPath = `${os.homedir()}/.ccautorun/plans/${planId}/EXECUTION_PLAN.md`;
```

### Shell Commands

```javascript
import { spawn } from 'child_process';

// ✅ CORRECT - Cross-platform command execution
const isWindows = process.platform === 'win32';
const shell = isWindows ? 'powershell.exe' : '/bin/bash';
const proc = spawn(shell, ['-Command', 'git status'], {
  cwd: projectDir,
  env: process.env
});

// ❌ WRONG - Unix-only
spawn('bash', ['-c', 'git status']);
```

### Hook Scripts

- Windows: `.claude/hooks/auto-continue.ps1` (PowerShell)
- Unix: `.claude/hooks/auto-continue.sh` (Bash)
- Always provide both in `templates/hooks/` directory

---

## 🐛 Debugging Tips

### Enable Verbose Logging

```bash
# Set DEBUG environment variable
DEBUG=ccautorun:* ccautorun run

# Or use --verbose flag
ccautorun run --verbose
```

### Inspect Session State

```bash
# View session file directly
cat ~/.ccautorun/sessions/<task-name>.json

# Or use status command
ccautorun status <plan-id>
```

### Check Hook Execution

```bash
# Test hook manually
./.claude/hooks/auto-continue.ps1

# View hook logs
ccautorun logs --tail
```

### Validate Configuration

```bash
# Run diagnostics
ccautorun doctor

# Check config syntax
ccautorun config --list
```

---

## 📚 Additional Resources

- **README**: [README.md](README.md) - User-facing documentation
- **README (中文)**: [README_CN.md](README_CN.md) - Chinese documentation
- **Execution Plan**: [EXECUTION_PLAN.md](EXECUTION_PLAN.md) - v2.0 development plan
- **Stage Details**: [docs/stages/](docs/stages/) - Detailed stage documentation
- **Architecture Docs**: [docs/architecture/](docs/architecture/) - Design specifications

---

## ⚠️ Important Notes

1. **Logger Import Bug**: This was a critical bug fixed in commit f0f2039. Always use `getLogger()` function, never import `logger` directly.

2. **Session Manager**: Use the `SessionManager` class methods, not direct file operations. Ensures atomic writes and consistency.

3. **Path Resolution**: Some E2E tests fail due to `os.homedir()` vs `process.cwd()` inconsistencies. Use `os.homedir()` for user data, `process.cwd()` for project files.

4. **Architecture Choice**: v2.0 focuses on split architecture. Single-file architecture support exists but is deferred to v2.1.

5. **Testing Philosophy**: Unit tests must pass 100%. E2E test failures are acceptable if core functionality works (current: 83.8% pass rate).

---

**Last Updated**: 2025-11-07 (v2.0 Release)

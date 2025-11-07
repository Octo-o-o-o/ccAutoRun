# Command Reference

> Complete reference for all ccAutoRun commands

[中文版本](./COMMAND_REFERENCE_CN.md) | [Getting Started](./GETTING_STARTED.md)

---

## Quick Navigation

- [Initialization & Setup](#initialization--setup)
- [Plan Management](#plan-management)
- [Execution Control](#execution-control)
- [Monitoring & Logs](#monitoring--logs)
- [Error Recovery](#error-recovery)
- [Slash Commands](#slash-commands-in-claude-code)

---

## Initialization & Setup

### `ccautorun init`

Initialize ccAutoRun in the current project.

```bash
ccautorun init [options]
```

**Options:**
- `--setup-hooks` - Automatically configure Claude Code hooks (recommended)

**Examples:**
```bash
# Initialize with hooks
ccautorun init --setup-hooks

# Initialize without hooks
ccautorun init
```

**What it does:**
- Creates `.ccautorun/` directory structure
- Creates default configuration file
- Sets up Claude Code hooks (if `--setup-hooks` specified)
- Creates log directories

---

### `ccautorun doctor`

Check system requirements and configuration.

```bash
ccautorun doctor [options]
```

**Options:**
- `--verbose` - Show detailed information

**Checks:**
- Node.js version (>= 18.0.0)
- npm version (>= 8.0.0)
- Git version (>= 2.20.0)
- Claude CLI installation
- Project initialization status
- Hooks configuration
- Directory structure
- Configuration file validity

**Example:**
```bash
ccautorun doctor
ccautorun doctor --verbose
```

---

### `ccautorun migrate`

Migrate configuration from older versions.

```bash
ccautorun migrate
```

---

## Plan Management

### `ccautorun list`

List all execution plans.

```bash
ccautorun list [options]
```

**Options:**
- `--status <status>` - Filter by status (active/paused/completed/failed)

**Examples:**
```bash
# List all plans
ccautorun list

# List only active plans
ccautorun list --status active

# List completed plans
ccautorun list --status completed
```

---

### `ccautorun status`

Show current plan execution status.

```bash
ccautorun status [plan-id]
```

**Examples:**
```bash
# Show current plan status
ccautorun status

# Show specific plan status
ccautorun status auth-feature-20250107
```

**Output:**
```
Plan: auth-feature-20250107
Status: active (Stage 2/5)
Progress: 40%

Completed:
  ✅ Stage 1: Database design (15m 23s)

Current:
  🔄 Stage 2: API implementation (8m 12s)

Remaining:
  ⏳ Stage 3: Frontend integration
  ⏳ Stage 4: Testing
  ⏳ Stage 5: Documentation

Estimated time remaining: 42 minutes
```

---

### `ccautorun validate`

Validate execution plan format and structure.

```bash
ccautorun validate <plan-id>
```

**Example:**
```bash
ccautorun validate auth-feature-20250107
```

---

### `ccautorun archive`

Archive completed plan.

```bash
ccautorun archive <plan-id> [options]
```

**Options:**
- `--older-than <days>` - Archive plans older than N days

**Examples:**
```bash
# Archive specific plan
ccautorun archive auth-feature-20250107

# Archive all plans older than 30 days
ccautorun archive --older-than 30
```

---

### `ccautorun stats`

Display statistics about plans.

```bash
ccautorun stats [plan-id] [options]
```

**Options:**
- `--disk-usage` - Show disk usage by snapshots

**Examples:**
```bash
# Global statistics
ccautorun stats

# Specific plan statistics
ccautorun stats auth-feature-20250107

# Show disk usage
ccautorun stats --disk-usage
```

---

## Execution Control

### `ccautorun trigger`

Manually trigger next stage continuation.

```bash
ccautorun trigger <plan-id>
```

**Use when:**
- Hooks not working
- Manual override needed
- Testing plan execution

**Example:**
```bash
ccautorun trigger auth-feature-20250107
```

---

### `ccautorun pause`

Pause a running plan.

```bash
ccautorun pause <plan-id>
```

**What it does:**
- Disables auto-continue for the plan
- Current stage completes, then pauses
- Can resume later with `ccautorun resume`

**Example:**
```bash
ccautorun pause auth-feature-20250107
```

---

### `ccautorun resume`

Resume a paused plan.

```bash
ccautorun resume <plan-id>
```

**Example:**
```bash
ccautorun resume auth-feature-20250107
```

---

### `ccautorun skip`

Skip a stage in a plan.

```bash
ccautorun skip <plan-id> <stage-number>
```

**⚠️ Warning:** Use with caution! Skipping stages may break dependencies.

**Example:**
```bash
# Skip stage 3
ccautorun skip auth-feature-20250107 3
```

---

### `ccautorun reset`

Reset session state (start plan from beginning).

```bash
ccautorun reset <plan-id>
```

**⚠️ Warning:** This resets progress but doesn't undo code changes!

**Example:**
```bash
ccautorun reset auth-feature-20250107
```

---

## Monitoring & Logs

### `ccautorun watch`

Watch task progress in real-time.

```bash
ccautorun watch <plan-id>
```

**Example:**
```bash
ccautorun watch auth-feature-20250107
```

**Output:**
```
╔════════════════════════════════════════╗
║  📊 Plan: auth-feature-20250107        ║
║  Status: Running ● Stage 2/5          ║
║  Progress: [████████░░░░░░] 40%      ║
╚════════════════════════════════════════╝

Timeline:
  ✅ Stage 1: Database design (15m 23s)
  🔄 Stage 2: API implementation (8m 12s)
  ⏳ Stage 3: Frontend integration
  ⏳ Stage 4: Testing
  ⏳ Stage 5: Documentation

ETA: ~42 minutes

Press Ctrl+C to stop watching
```

---

### `ccautorun logs`

View plan execution logs.

```bash
ccautorun logs <plan-id> [options]
```

**Options:**
- `--tail <n>` - Show last N lines
- `-f, --follow` - Follow log output in real-time
- `--level <level>` - Filter by log level (error/warn/info/debug)

**Examples:**
```bash
# View last 50 lines
ccautorun logs auth-feature-20250107 --tail 50

# Follow logs in real-time
ccautorun logs auth-feature-20250107 -f

# Show only errors
ccautorun logs auth-feature-20250107 --level error
```

---

## Error Recovery

### `ccautorun recover`

Recover from a failed plan execution.

```bash
ccautorun recover <plan-id> [options]
```

**Options:**
- `--rollback <snapshot>` - Rollback to specific snapshot

**Interactive mode:**
```bash
$ ccautorun recover auth-feature-20250107

? Choose recovery strategy:
  ❯ Retry      - Retry current stage
    Skip       - Skip current stage
    Rollback   - Roll back to previous snapshot
    Abort      - Abort entire plan
```

**Direct rollback:**
```bash
ccautorun recover auth-feature-20250107 --rollback stage-2-before
```

---

### `ccautorun retry`

Retry a failed stage or plan.

```bash
ccautorun retry <plan-id> [stage-number]
```

**Examples:**
```bash
# Retry current failed stage
ccautorun retry auth-feature-20250107

# Retry specific stage
ccautorun retry auth-feature-20250107 3
```

---

## Security

### `ccautorun audit`

Run security audit.

```bash
ccautorun audit [options]
```

**Options:**
- `--check-deps` - Check dependency vulnerabilities
- `--check-files` - Check for sensitive files
- `--check-config` - Check configuration security

**Examples:**
```bash
# Complete audit
ccautorun audit

# Check dependencies only
ccautorun audit --check-deps

# Check all
ccautorun audit --check-deps --check-files --check-config
```

---

## Slash Commands (in Claude Code)

These commands are used within Claude Code, not the terminal.

### `/plan`

Generate an execution plan (AI auto-selects architecture).

```
/plan <task description>
```

**Example:**
```
/plan Add vitest testing framework with configuration and example tests
```

---

### `/plan --force-split`

Force split architecture (for complex tasks).

```
/plan --force-split <task description>
```

**Example:**
```
/plan --force-split Refactor entire API layer to use GraphQL
```

---

### `/plan --force-single`

Force single-file architecture (for simple tasks).

```
/plan --force-single <task description>
```

**Example:**
```
/plan --force-single Update README documentation
```

---

### `/plan --template`

Use a task template.

```
/plan --template <template-name> <task description>
```

**Available templates:**
- `feature` - New feature development
- `refactor` - Code refactoring
- `bugfix` - Bug fixes
- `docs` - Documentation

**Examples:**
```
/plan --template feature Add user profile editing
/plan --template refactor Modernize authentication module
/plan --template bugfix Fix memory leak in event listeners
/plan --template docs Generate API documentation
```

---

## Configuration

**Note:** The `config` command currently has a bug. Edit configuration files directly:

```bash
# Edit main configuration
code .ccautorun/config.yaml

# Edit hooks configuration
code .claude/hooks.yaml
```

---

## Global Options

Available for most commands:

- `-V, --version` - Output the version number
- `-v, --verbose` - Enable verbose logging
- `--debug` - Enable debug mode
- `--dry-run` - Preview actions without executing
- `-h, --help` - Display help for command

**Example:**
```bash
ccautorun list --verbose
ccautorun init --dry-run
```

---

## Exit Codes

- `0` - Success
- `1` - General error
- `2` - Invalid arguments
- `3` - Configuration error
- `4` - Execution error

---

## See Also

- [Getting Started](./GETTING_STARTED.md) - Quick start guide
- [Core Concepts](./CORE_CONCEPTS.md) - Understanding ccAutoRun
- [Configuration](./CONFIGURATION.md) - Configuration reference
- [FAQ](./FAQ.md) - Common questions

---

**[← Core Concepts](./CORE_CONCEPTS.md)** | **[Configuration →](./CONFIGURATION.md)** | **[中文版本](./COMMAND_REFERENCE_CN.md)**

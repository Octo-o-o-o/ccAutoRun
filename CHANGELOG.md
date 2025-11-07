# Changelog

All notable changes to ccAutoRun will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-01-07

### 🎉 Initial Public Release

ccAutoRun v0.1.0 is an AI-powered task automation tool for Claude Code that transforms complex development tasks into self-executing workflows.

### Added

#### 🤖 AI-Powered Plan Generation
- **`/plan` slash command** - AI generates complete execution plans from natural language descriptions
- **Automatic architecture selection** - AI chooses between split and single-file architectures
- **Template system** - Pre-built templates for common tasks (refactor, feature, bugfix, docs)
- **Plan validation** - Built-in quality checks for generated plans
- **Task templates** - Quick-start templates for common development workflows

#### 🏗️ Dual Architecture Support
- **Split architecture** - For complex tasks (4+ stages, >2500 lines)
  - Each stage in separate file
  - 90%+ token savings (only loads current stage)
  - Scales to 20+ stages
- **Single-file architecture** - For simple tasks (≤3 stages, <2500 lines)
  - All content in one EXECUTION_PLAN.md
  - Faster generation and overview
- **Auto-select mode** - AI analyzes task and picks optimal architecture

#### 🔧 19 New CLI Commands
- `init` - Initialize project with automatic hook configuration
- `list` - List all plans with filtering
- `status` - View detailed plan status
- `validate` - Validate plan structure and quality
- `watch` - Real-time progress monitoring
- `pause` - Pause auto-continuation
- `resume` - Resume execution
- `skip` - Skip stages
- `retry` - Retry failed stages
- `recover` - Advanced error recovery (Retry/Skip/Rollback/Abort)
- `trigger` - Manually trigger next stage
- `logs` - View execution logs with tail/follow support
- `stats` - View execution statistics
- `archive` - Archive completed plans
- `migrate` - Configuration version migration
- `config` - Configuration management (get/set/list)
- `doctor` - Environment diagnostics
- `audit` - Security audit (deps/files/config)
- `reset` - Reset plan state

#### 🚀 Auto-Continuation System
- **Three-layer fallback strategy**:
  1. Primary: Parse transcript for `[STAGE_COMPLETE:N]` markers
  2. Fallback 1: Check independent marker files
  3. Fallback 2: Monitor file modification times
  4. Final: Desktop notification for manual continuation
- **Task failure detection** - Automatic error pattern detection
- **Safety limiter** - Configurable stage limits before manual review
- **Atomic write mechanism** - Prevents data corruption with tmp + rename

#### 🛡️ Error Recovery & Safety
- **Snapshot system** - Automatic backups before each stage
- **Recovery manager** - 4 recovery strategies (Retry/Skip/Rollback/Abort)
- **Pause/Resume** - Graceful interruption and continuation
- **Sandbox mode** - File access and command execution restrictions
- **Audit logging** - Complete operation audit trail

#### 📊 Monitoring & Reporting
- **Real-time progress** - Live progress bars with ETA
- **Desktop notifications** - Stage completion, errors, warnings
- **Comprehensive logging** - Winston-based logging with daily rotation
- **Statistics dashboard** - Execution time, success rates, efficiency metrics
- **Watch mode** - Real-time file monitoring with chokidar

#### ⚙️ Configuration & Management
- **YAML configuration** - Structured config with JSON Schema validation
- **Version migration** - Automatic config migration between versions
- **Config validation** - ajv-based schema validation
- **Interactive setup** - Guided onboarding for new users
- **Hook auto-configuration** - Automatic Claude Code hooks setup

#### 🧪 Testing Infrastructure (Stage 5.5)
- **95+ test cases** across 4 test types:
  - 51+ unit tests (core modules)
  - 36+ integration tests (CLI commands)
  - 15+ hook tests (auto-continue fallback strategies)
  - 3+ E2E tests (complete workflows)
- **73%+ code coverage** with v8 coverage reporting
- **Vitest framework** - Fast, modern testing with ES Modules support
- **CI/CD ready** - All tests runnable in automated pipelines

#### 📚 Comprehensive Documentation
- **Bilingual README** - English (README.md) and Chinese (README_CN.md)
- **Quick Start Guide** - 10-minute onboarding
- **User Guide** - Complete command reference
- **Templates Guide** - Pre-built task templates
- **FAQ** - Common questions and answers
- **Troubleshooting Guide** - Solve common issues
- **Architecture Docs** - Design decisions and technical details
- **Testing Documentation** - Test coverage and strategies

### Changed

#### 🔄 Architecture & Implementation
- **Pure Node.js** - Replaced PowerShell/Bash scripts with cross-platform Node.js
- **Commander.js CLI** - Professional CLI framework with subcommands
- **ES Modules** - Modern JavaScript with import/export
- **Session management** - Simplified from 150 lines to 60 lines
- **Error handling** - Unified error-handler with error codes and fix suggestions

#### 🎨 User Experience
- **Interactive onboarding** - Guided setup for first-time users
- **Better error messages** - Clear error codes with actionable fixes
- **Progress visualization** - Real-time progress bars and ETAs
- **Colored output** - Chalk-based colorized terminal output
- **Dry-run mode** - Preview operations without executing

#### 📦 Dependencies
- Added: `commander`, `chokidar`, `node-notifier`, `yaml`, `ora`, `inquirer`, `ajv`, `winston`
- Removed: All PowerShell and Bash script dependencies
- Updated: Modern package versions with security fixes

### Deprecated

- **PowerShell scripts** (v1.0) - Replaced by Node.js implementation
- **Bash scripts** (v1.0) - Replaced by Node.js implementation
- **Manual plan writing** - Replaced by AI-generated plans
- **Single architecture only** - Now supports dual architectures

### Removed

- `monitor` command - Notification functionality built into hooks
- Parameter preprocessor - Simplified to direct slash command parsing
- Script-based automation - Fully replaced by Node.js

### Fixed

- Stage file name matching now enforces exact patterns (prevents backup file conflicts)
- Atomic write operations prevent session corruption
- Windows path handling issues resolved
- Race conditions in session management eliminated
- Memory leaks in long-running watch processes fixed

### Security

- **Sandbox mode** with file access restrictions
- **Command whitelist** for safe execution
- **Sensitive file detection** - Auto-excludes .env, credentials, keys
- **Audit logging** for compliance
- **Permission validation** before dangerous operations
- **Dependency scanning** with `npm audit` integration

### Performance

- **90%+ token savings** with split architecture
- **Atomic file operations** - No more data corruption
- **Optimized file watching** - Efficient chokidar-based monitoring
- **Lazy loading** - Load only current stage, not entire plan
- **Log rotation** - Prevents disk space issues

---

## [Unreleased]

### Planned for Future Versions
- **Multi-task parallel execution** - Run multiple plans simultaneously
- **Plugin system** - Custom hooks and integrations
- **Cloud sync** - Backup and share plans across devices
- **Web dashboard** - Visual progress tracking
- **Team collaboration** - Shared plans and execution
- **Advanced conflict detection** - Smart merge resolution
- **Email/Slack notifications** - More notification channels
- **Analytics dashboard** - Detailed execution analytics

### Under Consideration
- **IDE integrations** - VS Code, JetBrains plugins
- **Mobile companion app** - Monitor progress on mobile
- **AI model selection** - Choose different Claude models
- **Custom template marketplace** - Share and discover templates

---

**Legend:**
- `Added` - New features
- `Changed` - Changes to existing functionality
- `Deprecated` - Features to be removed in future releases
- `Removed` - Removed features
- `Fixed` - Bug fixes
- `Security` - Security improvements
- `Performance` - Performance improvements

---

For detailed information about each release, see the [GitHub Releases](https://github.com/Octo-o-o-o/ccAutoRun/releases) page.

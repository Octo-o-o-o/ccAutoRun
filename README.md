# 🤖 ccAutoRun v2.0

[![npm version](https://img.shields.io/npm/v/ccautorun.svg)](https://www.npmjs.com/package/ccautorun)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-blue.svg)](https://github.com/yourusername/ccautorun)

**An AI-powered task automation tool for Claude Code that turns complex development tasks into self-executing workflows.**

ccAutoRun v2.0 transforms Claude Code from an interactive assistant into a fully automated task executor. Generate intelligent execution plans with AI, then let the system automatically execute them stage-by-stage—while you focus on more important work.

---

## ✨ What Makes v2.0 Special?

### 🤖 AI-Generated Execution Plans
- Claude generates **complete, structured execution plans** for your tasks
- Automatic architecture selection (split or single-file) based on complexity
- Built-in validation ensures plan quality and efficiency
- No more manually breaking down complex tasks

![Demo: AI Plan Generation](docs/assets/demo-plan-generation.gif)
<!-- TODO: Record GIF showing /plan command generating a multi-stage plan -->

### 🔄 True Zero-Intervention Automation
- Hook-based auto-continuation—moves to next stage automatically
- No manual `/clear` commands or copy-pasting needed
- Safety limits prevent runaway execution
- Pause/resume support for graceful interruption

![Demo: Auto-Continue in Action](docs/assets/demo-auto-continue.gif)
<!-- TODO: Record GIF showing automatic stage progression -->

### 📊 Intelligent Architecture Choice
- **Split Architecture**: For complex tasks (>3 stages, >2500 lines)
  - Loads only current stage → 90%+ token savings
  - Each stage in separate file for clarity
- **Single-File Architecture**: For simple tasks (≤3 stages, <2500 lines)
  - Everything in one EXECUTION_PLAN.md
  - Quick to generate and execute
- **Auto-Select**: AI chooses the best architecture, or you can force one

![Demo: Architecture Selection](docs/assets/demo-architecture-choice.gif)
<!-- TODO: Record GIF showing architecture choice options -->

### 🛡️ Production-Ready Safety
- **Sandbox mode**: File access and command execution limits
- **Safety limiter**: Configurable stage limits before manual review
- **Snapshot system**: Automatic backups before each stage
- **Error recovery**: Retry/skip/rollback options when things go wrong
- **Audit logging**: Track all operations for security compliance

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites

**Required:**
- Node.js >= 18.0.0 (Recommended: 20.x LTS or 21.x)
- npm >= 8.0.0
- Claude Code CLI installed and configured

**Platform-Specific:**

<details>
<summary><b>🍎 macOS</b></summary>

```bash
# Check Node.js version
node --version  # Should be >= 18.0.0

# Install Claude Code if not already installed
# Follow: https://docs.anthropic.com/claude-code

# Install ccAutoRun
npm install -g ccautorun
```

**Note**: On Apple Silicon (M1/M2/M3), Node.js runs natively - no Rosetta needed.
</details>

<details>
<summary><b>🪟 Windows</b></summary>

```powershell
# Check Node.js version (PowerShell or cmd.exe)
node --version  # Should be >= 18.0.0

# Install Claude Code if not already installed
# Follow: https://docs.anthropic.com/claude-code

# Install ccAutoRun
npm install -g ccautorun
```

**PowerShell Execution Policy**: If you encounter errors, you may need to adjust execution policy:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Path Issues**: After installation, restart your terminal to ensure `ccautorun` is in PATH.
</details>

<details>
<summary><b>🐧 Linux</b></summary>

```bash
# Check Node.js version
node --version  # Should be >= 18.0.0

# If Node.js not installed or outdated:
# Ubuntu/Debian:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL/Fedora:
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Install Claude Code if not already installed
# Follow: https://docs.anthropic.com/claude-code

# Install ccAutoRun
sudo npm install -g ccautorun
```

**Permissions**: If you get EACCES errors, either:
1. Use `sudo` (above), OR
2. Configure npm to install globally without sudo:
   ```bash
   mkdir ~/.npm-global
   npm config set prefix '~/.npm-global'
   echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
   source ~/.bashrc
   npm install -g ccautorun
   ```
</details>

### Installation

```bash
npm install -g ccautorun
```

### First-Time Setup

#### All Platforms

```bash
# Navigate to your project
cd /path/to/your/project

# Initialize with automatic hook setup (recommended)
ccautorun init --setup-hooks

# This will:
# ✓ Create .ccautorun/ directory
# ✓ Configure Claude Code hooks (.claude/hooks/)
# ✓ Set up default configuration
# ✓ You're ready to go!
```

#### Platform-Specific Notes

**macOS/Linux:**
```bash
# Hooks are automatically made executable
# Location: .claude/hooks/check-and-continue.sh

# Verify hooks are working:
ccautorun doctor
```

**Windows:**
```powershell
# Hooks use PowerShell scripts
# Location: .claude/hooks/auto-continue.ps1

# Verify hooks are working:
ccautorun doctor

# If hooks don't work, ensure PowerShell scripts can execute:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Generate Your First Plan

In Claude Code, use the `/plan` slash command:

```
/plan I need to refactor the authentication module to use JWT tokens instead of sessions
```

Claude will:
1. Analyze your codebase
2. Generate a multi-stage execution plan
3. Choose the optimal architecture
4. Save the plan to `.ccautorun/plans/`

### Execute the Plan

Claude will automatically start executing the plan. The system will:
- ✅ Execute Stage 1
- ✅ Auto-continue to Stage 2
- ✅ Auto-continue to Stage 3
- ⏸️ Pause at safety limit for your review

You'll get desktop notifications at key milestones!

---

## 🎯 Core Features

### For Users
- **📋 Task Templates**: Quick-start with pre-built templates (refactor, feature, bugfix, docs)
- **🔔 Desktop Notifications**: Stay informed without constant monitoring
- **📊 Real-Time Progress**: Watch mode with progress bars and ETA
- **🩺 Smart Diagnostics**: `doctor` command checks environment and troubleshoots issues
- **📝 Rich Logging**: Detailed logs with rotation and easy access

### For Power Users
- **⚡ Manual Triggers**: Override auto-continue with `trigger` command
- **🔄 Pause/Resume**: Gracefully interrupt and continue later
- **↩️ Error Recovery**: Retry failed stages or rollback to snapshots
- **⏭️ Stage Control**: Skip stages or jump to specific points
- **📈 Statistics**: Track execution time, success rates, and efficiency

### For Teams
- **🔒 Security Audit**: Full audit trail of all operations
- **📋 Configuration Management**: Centralized config with validation
- **🔄 Version Migration**: Smooth upgrades with `migrate` command
- **🗂️ Archive System**: Organize completed plans

---

## 📖 Documentation

**📚 [Complete Documentation](docs/README.md)** | **🇨🇳 [中文文档](docs/README_CN.md)**

### Quick Start
- **[Getting Started](docs/GETTING_STARTED.md)** - 5-minute quick start guide ([中文](docs/GETTING_STARTED_CN.md))
- **[Quick Start Guide](docs/QUICK_START.md)** - Detailed 10-minute walkthrough

### Core Documentation
- **[Core Concepts](docs/CORE_CONCEPTS.md)** - Understand execution plans, architectures, and workflows ([中文](docs/CORE_CONCEPTS_CN.md))
- **[Command Reference](docs/COMMAND_REFERENCE.md)** - Complete list of all commands ([中文](docs/COMMAND_REFERENCE_CN.md))
- **[Configuration Guide](docs/CONFIGURATION.md)** - Customize ccAutoRun behavior ([中文](docs/CONFIGURATION_CN.md))
- **[Best Practices](docs/BEST_PRACTICES.md)** - Tips for effective usage ([中文](docs/BEST_PRACTICES_CN.md))

### Additional Resources
- **[Task Templates](docs/TEMPLATES.md)** - Pre-built templates for common tasks
- **[FAQ](docs/FAQ.md)** - 26 common questions answered
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Solve common issues
- **[Architecture Docs](docs/architecture/)** - Deep dives into design decisions

---

## 🎨 Use Cases

### 1. Large-Scale Refactoring
```
/plan Refactor the entire API layer to use TypeScript decorators for validation
```
- Auto-generates 7-stage plan
- Executes methodically file-by-file
- Creates snapshots before each stage
- Handles errors gracefully

### 2. Feature Development
```
/plan Implement user profile page with avatar upload, bio editing, and activity feed
```
- Breaks down into UI, backend, tests
- Creates comprehensive plan
- Executes with validation at each step

### 3. Documentation Generation
```
/plan --template docs Generate API documentation for all /api endpoints
```
- Uses pre-built template
- Fast generation and execution
- Consistent formatting

### 4. Bug Fixes with Tests
```
/plan Fix the race condition in user session handling and add regression tests
```
- Identifies root cause
- Implements fix
- Adds comprehensive tests
- Validates fix

---

## 🔧 Command Reference

### Essential Commands

```bash
# Initialize project
ccautorun init [--setup-hooks] [--enable-hooks]

# List all plans
ccautorun list [--status <status>]

# Check plan status
ccautorun status [plan-id]

# Validate plan quality
ccautorun validate <plan-id>

# Watch real-time progress
ccautorun watch <plan-id>

# View logs
ccautorun logs [plan-id] [--tail] [-f]
```

### Control Commands

```bash
# Pause auto-continuation
ccautorun pause [plan-id]

# Resume auto-continuation
ccautorun resume [plan-id]

# Skip a stage
ccautorun skip <plan-id> <stage-number>

# Retry failed stage
ccautorun retry <plan-id> [stage-number]

# Manually trigger next stage
ccautorun trigger <plan-id>

# Recover from errors
ccautorun recover <plan-id>
```

### Management Commands

```bash
# Diagnose issues
ccautorun doctor

# Manage configuration
ccautorun config [--get <key>] [--set <key> <value>] [--list]

# View statistics
ccautorun stats [plan-id]

# Archive completed plans
ccautorun archive <plan-id>

# Migrate configuration
ccautorun migrate

# Security audit
ccautorun audit [--check-deps] [--check-files] [--check-config]
```

### Slash Commands (in Claude Code)

```
# Generate a plan (AI automatically chooses architecture)
/plan <task description>

# Force split architecture (for complex tasks)
/plan --force-split <task description>

# Force single-file architecture (for simple tasks)
/plan --force-single <task description>

# Use a template
/plan --template refactor <task description>
/plan --template feature <task description>
/plan --template bugfix <task description>
/plan --template docs <task description>
```

---

## 🏗️ Architecture Decision Guide

### When to Use Split Architecture

**Best for:**
- Complex multi-stage tasks (4+ stages)
- Large codebases (>10,000 lines)
- Tasks requiring detailed planning
- Long-running refactors

**Benefits:**
- 90%+ token savings (loads only current stage)
- Better organization (one file per stage)
- Easier to review and modify
- Scales to 20+ stages easily

**Example:** Refactoring authentication system, migrating to new framework

### When to Use Single-File Architecture

**Best for:**
- Simple tasks (≤3 stages)
- Quick fixes or updates
- Focused, well-defined tasks
- Small scope changes

**Benefits:**
- Faster to generate
- Easier overview of entire plan
- Less file management
- Quick to modify

**Example:** Updating config file, fixing a specific bug, generating simple docs

### Auto-Select (Recommended)

Let Claude choose the best architecture:

```
/plan <your task>
```

Claude analyzes:
- Task complexity
- Estimated LOC
- Number of stages needed
- Your project size

And automatically picks the optimal architecture!

---

## 🛡️ Security & Safety

### Sandbox Mode (Default)

- **File Access Control**: Restricts access to project directory only
- **Command Whitelist**: Only safe commands (git, npm, node) allowed
- **Sensitive File Protection**: Auto-excludes .env, credentials, keys
- **Audit Logging**: All operations logged for review

### Safety Limits

- **Stage Limit**: Pauses after N stages (default: 3) for manual review
- **Execution Timeout**: Prevents hanging stages
- **Snapshot Backups**: Auto-backup before each stage
- **Error Detection**: Stops on critical failures

### Dangerous Mode

For advanced users who need unrestricted access:

```bash
# Use with caution!
ccautorun init --dangerously-skip-permissions
```

⚠️ **Warning**: Only use with plans you fully trust!

---

## 🧪 Testing

ccAutoRun v2.0 has comprehensive test coverage:

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit          # Unit tests (51+ cases)
npm run test:integration   # Integration tests (36+ cases)
npm run test:e2e          # End-to-end tests (3+ cases)

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage      # 73%+ coverage
```

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
git clone https://github.com/yourusername/ccautorun.git
cd ccautorun
npm install
npm test

# Run in development
npm link
ccautorun --version
```

### Running Tests

```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Generate coverage report
```

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built for [Claude Code](https://claude.ai/code) by Anthropic
- Inspired by the need for intelligent automation in AI-assisted development
- Thanks to the community for feedback and testing

---

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/yourusername/ccautorun/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/ccautorun/discussions)

---

## 🌟 What's New in v2.0?

### vs v1.0 (PowerShell/Bash Scripts)

- ✅ **Pure Node.js**: True cross-platform consistency
- ✅ **AI Plan Generation**: No more manual plan writing
- ✅ **Dual Architecture**: Automatic or manual choice
- ✅ **Rich CLI**: 15+ commands for full control
- ✅ **Error Recovery**: Retry, skip, or rollback
- ✅ **Production Ready**: 95+ tests, 73%+ coverage
- ✅ **Better UX**: Progress bars, notifications, real-time monitoring

### Key Improvements

| Feature | v1.0 | v2.0 |
|---------|------|------|
| Plan Generation | Manual | AI-Generated |
| Architecture | Single only | Dual (split/single) |
| Cross-Platform | Scripts (PS/Bash) | Pure Node.js |
| Commands | 3 | 15+ |
| Error Handling | Basic | Advanced (retry/rollback) |
| Testing | None | 95+ tests, 73% coverage |
| Real-Time Monitoring | No | Yes (watch command) |
| Configuration | Manual | Validated YAML |

---

## 🗺️ Roadmap

### v2.1 (Future)

- **Multi-Task Parallel Execution**: Run multiple plans simultaneously
- **Plugin System**: Extend with custom hooks and integrations
- **Cloud Sync**: Backup and share plans across devices
- **Web Dashboard**: Visual progress tracking and plan management
- **Team Collaboration**: Shared plans and execution

---

**Made with ❤️ for the Claude Code community**

**Transform complex tasks into self-executing workflows!** 🚀


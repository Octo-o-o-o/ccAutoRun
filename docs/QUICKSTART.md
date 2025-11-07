# Quick Start Guide - Get Running in 10 Minutes 🚀

> A complete guide from installation to your first successful automated task

## 📋 Prerequisites

Ensure your system has:
- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **Claude Code** latest version ([Installation Guide](https://docs.claude.com/claude-code))
- **Git** >= 2.20.0 (for version control integration)
- **npm** >= 8.0.0 (comes with Node.js)

## ⚡ Installation

### Option 1: Global Install (Recommended)

```bash
npm install -g ccautorun
```

Verify installation:
```bash
ccautorun --version
# Should output: 2.0.0
```

### Option 2: Use with npx (No Installation)

```bash
npx ccautorun --version
```

### Option 3: From Source (Developers)

```bash
git clone https://github.com/yourusername/ccautorun.git
cd ccautorun
npm install
npm link
ccautorun --version
```

## 🎯 First-Time Setup (3 Steps)

### Step 1: Initialize Your Project

Navigate to your project and run:

```bash
cd /path/to/your/project
ccautorun init --setup-hooks
```

You'll see an interactive wizard:

```
👋 Welcome to ccAutoRun v2.0!

✓ Detected Claude Code installation
✓ Detected Git repository
✓ Configuring Claude Code hooks...

📁 Created working directory: .ccautorun/
   ├── plans/        (execution plans storage)
   ├── sessions/     (session records)
   ├── snapshots/    (automatic backups)
   ├── logs/         (execution logs)
   └── config.yaml   (configuration)

🎉 Initialization complete! Run 'ccautorun --help' to see all commands
```

**What just happened?**
- Created `.ccautorun/` directory structure
- Configured Claude Code hooks for auto-continuation
- Set up default configuration
- Created logging infrastructure

### Step 2: Run Environment Check

```bash
ccautorun doctor
```

This diagnoses your environment:

```
🩺 ccAutoRun Environment Check

✓ Node.js version: 20.11.0 (OK)
✓ npm version: 10.2.4 (OK)
✓ Git version: 2.43.0 (OK)
✓ Claude Code: Detected at ~/.claude/
✓ Project root: /Users/you/project (Git repo)
✓ Configuration: Valid (v2.0.0)
✓ Hooks configured: Yes
✓ Write permissions: OK
✓ Disk space: 45.2 GB available

🎉 Everything looks good! Ready to create your first plan.
```

**If doctor finds issues**, it provides specific fixes:
```
⚠  Warning: Claude Code hooks not configured
   Fix: Run 'ccautorun init --setup-hooks'

✗ Error: Node.js version 16.x detected (requires >=18.0.0)
   Fix: Upgrade Node.js from https://nodejs.org
```

### Step 3: Generate Your First Plan

Open Claude Code and use the `/plan` slash command:

```
/plan Add unit testing framework to the project using vitest, including setup, example tests, and coverage reporting
```

**Claude will:**
1. Analyze your project structure
2. Generate a detailed execution plan
3. Choose optimal architecture (split/single)
4. Present the plan for your review

**Example output:**

```
📋 Generated Execution Plan: unit-testing-20250107-120000

Architecture: Split (5 stages, estimated 8-10 hours)

Stage 1: Install and Configure Vitest
Stage 2: Create Test Infrastructure
Stage 3: Write Example Test Suites
Stage 4: Configure Coverage Reporting
Stage 5: Update Documentation

✓ Plan saved to: .ccautorun/plans/unit-testing-20250107-120000/

Would you like to start execution? (Y/n)
```

### Step 4: Execute the Plan

**Automatic Mode (Recommended):**

Type `Y` and Claude will:
- ✅ Execute Stage 1
- ✅ Auto-continue to Stage 2
- ✅ Auto-continue to Stage 3
- ⏸️ Pause at safety limit (default: 3 stages)

You'll receive desktop notifications at key points!

**Manual Control Mode:**

```bash
# View plan status
ccautorun status

# List all plans
ccautorun list

# Watch real-time progress
ccautorun watch unit-testing-20250107-120000

# In Claude Code, manually load stages:
@.ccautorun/plans/unit-testing-20250107-120000/stages/stage-1.md
```

## 🎬 Complete Example: Adding a Feature

Let's add dark mode to an application:

### 1. Create the Plan

In Claude Code:
```
/plan Add dark mode toggle to the application with theme management, persistence, and UI components
```

### 2. Review Generated Plan

```
✓ Plan Generated: dark-mode-20250107-143022

Architecture: Split (4 stages)

├── EXECUTION_PLAN.md     (overview)
└── stages/
    ├── stage-1.md        (Create theme system)
    ├── stage-2.md        (Implement toggle UI)
    ├── stage-3.md        (Add persistence)
    └── stage-4.md        (Testing and polish)

Estimated time: 4-6 hours
```

### 3. Start Execution

Claude automatically begins:

```
[Stage 1/4] Creating theme system...
✓ Created src/theme/ThemeContext.js
✓ Created src/theme/themes.js
✓ Updated src/App.js
✓ Added theme provider

[Stage 1 Complete] ✅

🔄 Auto-continuing to Stage 2 in 5 seconds...
(Press Ctrl+C to pause)
```

### 4. Monitor Progress

In another terminal:

```bash
ccautorun watch dark-mode-20250107-143022
```

Real-time output:
```
📊 Plan: dark-mode-20250107-143022
   Status: Running
   Progress: [▓▓▓▓▓▓▓░░░] 68% (Stage 2/4)

   ✅ Stage 1: Create theme system (12m 34s)
   🔄 Stage 2: Implement toggle UI (in progress, 5m 12s)
   ⏳ Stage 3: Add persistence
   ⏳ Stage 4: Testing and polish

   ETA: 18 minutes remaining
```

### 5. Handle the Safety Pause

After 3 stages (default), the system pauses:

```
⏸️  Safety Limit Reached (3 stages executed)

✅ Completed:
   - Stage 1: Create theme system
   - Stage 2: Implement toggle UI
   - Stage 3: Add persistence

⏳ Remaining:
   - Stage 4: Testing and polish

📋 Review the changes and when ready:
   1. Run: ccautorun resume dark-mode-20250107-143022
   2. Or continue manually in Claude Code
```

### 6. Resume or Complete

```bash
# Review the changes
git diff

# If satisfied, resume
ccautorun resume dark-mode-20250107-143022

# Or if issues found, recover
ccautorun recover dark-mode-20250107-143022
```

### 7. Archive When Done

```bash
ccautorun archive dark-mode-20250107-143022
```

## 🛠️ Essential Commands

| Command | Purpose | Example |
|---------|---------|---------|
| `init` | Initialize project | `ccautorun init --setup-hooks` |
| `doctor` | Check environment | `ccautorun doctor` |
| `list` | List all plans | `ccautorun list --status active` |
| `status` | View current plan | `ccautorun status [plan-id]` |
| `watch` | Monitor progress | `ccautorun watch <plan-id>` |
| `pause` | Pause auto-continue | `ccautorun pause [plan-id]` |
| `resume` | Resume execution | `ccautorun resume [plan-id]` |
| `logs` | View logs | `ccautorun logs <plan-id>` |
| `recover` | Recover from error | `ccautorun recover <plan-id>` |
| `archive` | Archive completed | `ccautorun archive <plan-id>` |

## ⚙️ Recommended Configuration

Edit `.ccautorun/config.yaml`:

```yaml
version: "2.0.0"

# Auto-continue after each stage
autoContinue: true

# Pause after N stages (0 = unlimited)
safetyLimit: 3

# Desktop notifications
notifications:
  enabled: true
  onStageComplete: true
  onError: true
  onPlanComplete: true

# Architecture preference
defaultArchitecture: auto  # auto, split, or single

# Snapshot retention (number of stages to keep backups)
snapshotRetention: 5

# Skip permission prompts (use with caution!)
dangerouslySkipPermissions: false

# Logging level
logLevel: info  # error, warn, info, debug, trace
```

## 🎓 Next Steps

After mastering the basics, explore:

- **[User Guide](GUIDE.md)** - Complete command reference and workflows
- **[Task Templates](TEMPLATES.md)** - Pre-built templates for common tasks
- **[Examples](EXAMPLES.md)** - Real-world usage scenarios
- **[FAQ](FAQ.md)** - Common questions answered
- **[Troubleshooting](TROUBLESHOOTING.md)** - Solve common issues

## 💡 Best Practices

### 1. Write Specific Plan Descriptions

**Bad:**
```
/plan Optimize code
```

**Good:**
```
/plan Refactor the user authentication module to use JWT tokens instead of sessions, add comprehensive tests, and update documentation
```

### 2. Use Templates for Common Tasks

```
/plan --template refactor Modernize the API layer to use async/await
/plan --template feature Add user profile editing
/plan --template bugfix Fix memory leak in event listeners
/plan --template docs Generate API documentation for all endpoints
```

### 3. Let AI Choose Architecture

```
# AI automatically picks split vs single-file
/plan <your task>

# Override only if you know better
/plan --force-split <complex task>
/plan --force-single <simple task>
```

### 4. Monitor Long-Running Tasks

```bash
# Open a second terminal
ccautorun watch <plan-id>

# Or check status periodically
watch -n 5 ccautorun status <plan-id>
```

### 5. Use Doctor for Troubleshooting

```bash
# Before starting work
ccautorun doctor

# If something fails
ccautorun doctor --verbose
```

### 6. Review Before Resuming

```bash
# After safety pause, review changes
git status
git diff

# Check what was done
ccautorun logs <plan-id> --tail 50

# Then resume
ccautorun resume <plan-id>
```

### 7. Archive Regularly

```bash
# Archive completed plans
ccautorun archive --status completed

# Archive old plans
ccautorun archive --older-than 30d
```

## 🚨 Common Issues & Quick Fixes

### Issue: "Claude Code hooks not working"

```bash
# Re-configure hooks
ccautorun init --setup-hooks --force

# Verify
ccautorun doctor
```

### Issue: "Permission denied"

```bash
# Check file permissions
ls -la .ccautorun/

# Fix if needed
chmod -R u+rwX .ccautorun/
```

### Issue: "Plan execution failed"

```bash
# View error details
ccautorun logs <plan-id> --tail 100

# Try recovery
ccautorun recover <plan-id>

# Options: retry, skip, rollback, abort
```

### Issue: "Out of disk space"

```bash
# Check snapshot usage
ccautorun stats --disk-usage

# Clean old snapshots
ccautorun archive --cleanup-snapshots --older-than 7d
```

### Issue: "Auto-continue not working"

```bash
# Check configuration
ccautorun config --get autoContinue

# Enable if disabled
ccautorun config --set autoContinue true

# Verify hooks
cat .claude/hooks.yaml
```

## 🎉 Success!

Congratulations! You're now ready to:
- ✅ Generate AI-powered execution plans
- ✅ Automate complex development tasks
- ✅ Monitor and control plan execution
- ✅ Handle errors and recover gracefully
- ✅ Use templates for common workflows

## 📚 Learn More

- **[Complete Guide](GUIDE.md)** - All 19 commands in detail
- **[Architecture Docs](architecture/)** - Understanding the design
- **[Contributing](../CONTRIBUTING.md)** - Help improve ccAutoRun

## 💬 Get Help

- **Issues**: Found a bug? [Report it](https://github.com/yourusername/ccautorun/issues)
- **Questions**: [GitHub Discussions](https://github.com/yourusername/ccautorun/discussions)
- **Documentation**: Browse all docs in [docs/](.)

---

**[← Back to README](../README.md)** | **[View Templates →](TEMPLATES.md)** | **[Complete Guide →](GUIDE.md)**

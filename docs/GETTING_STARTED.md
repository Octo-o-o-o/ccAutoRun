# Getting Started with ccAutoRun v2.0

> Get up and running with ccAutoRun in 5 minutes

[中文版本](./GETTING_STARTED_CN.md) | [Complete User Guide](./USER_GUIDE.md)

---

## 📋 Table of Contents

- [System Requirements](#system-requirements)
- [Installation](#installation)
- [First-Time Setup](#first-time-setup)
- [Your First Execution Plan](#your-first-execution-plan)
- [Monitoring Execution](#monitoring-execution)
- [Next Steps](#next-steps)

---

## System Requirements

Before installing ccAutoRun, ensure your system has:

- **Node.js** >= 18.0.0 (Recommended: 20.x LTS)
- **npm** >= 8.0.0
- **Git** >= 2.20.0
- **Claude Code CLI** (latest version)

**Check your environment:**

```bash
node --version  # Should show v18.x.x or higher
npm --version   # Should show 8.x.x or higher
git --version   # Should show 2.20.x or higher
claude --version # Should show Claude Code version
```

---

## Installation

### Option 1: Global Install (Recommended)

```bash
npm install -g ccautorun
```

Verify installation:
```bash
ccautorun --version
# Output: 2.0.0
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

---

## First-Time Setup

### Step 1: Initialize Your Project

Navigate to your project directory and run:

```bash
cd /path/to/your/project
ccautorun init --setup-hooks
```

This creates the following structure:

```
.ccautorun/
├── config.yaml       # Configuration file
├── plans/            # Execution plans directory
├── sessions/         # Session tracking
├── logs/             # Application logs
├── snapshots/        # Automatic backups
└── archive/          # Archived plans

.claude/
└── hooks.yaml        # Claude Code hooks configuration
```

### Step 2: Verify Your Environment

```bash
ccautorun doctor
```

Expected output:

```
ccAutoRun System Check

✓ Node.js - Version v24.11.0
✓ npm - Version 11.6.1
✓ Git - Version 2.51.2
✓ Claude CLI - Found
✓ ccAutoRun Initialization - Initialized
✓ Project Structure - All required directories exist
✓ Configuration File - Valid

Summary: ✓ 7 passed
```

If you see any errors, follow the suggestions provided by the `doctor` command.

---

## Your First Execution Plan

### Step 1: Generate a Plan

Open **Claude Code** and use the `/plan` slash command:

```
/plan Add vitest testing framework to the project, including configuration, example tests, and coverage reporting
```

**Claude will:**
1. Analyze your project structure
2. Generate a detailed multi-stage execution plan
3. Automatically choose the optimal architecture (Split/Single)
4. Save the plan to `.ccautorun/plans/`

**Example output:**

```
✓ Generated Execution Plan: vitest-setup-20250107

Architecture: Split (5 stages)
Estimated time: 3-4 hours

Stage 1: Install and Configure Vitest
Stage 2: Create Test Infrastructure
Stage 3: Write Example Test Suites
Stage 4: Configure Coverage Reporting
Stage 5: Update Documentation

Plan saved to: .ccautorun/plans/vitest-setup-20250107/
```

### Step 2: Review the Plan

```bash
# List all plans
ccautorun list

# View plan details
ccautorun status vitest-setup-20250107

# Validate plan format
ccautorun validate vitest-setup-20250107
```

### Step 3: Execute the Plan

**Automatic Mode (Recommended):**

Claude will automatically start executing Stage 1. When complete, the hook system will automatically trigger Stage 2, and so on.

**What happens:**
```
✓ Stage 1 Complete (12m 34s)
  → Auto-continuing to Stage 2...
✓ Stage 2 Complete (8m 12s)
  → Auto-continuing to Stage 3...
⏸️ Safety Limit Reached (after 3 stages)
  → Manual review required
```

**Manual Mode:**

```bash
# Pause auto-continue
ccautorun pause vitest-setup-20250107

# In Claude Code, manually execute each stage:
# Execute .ccautorun/plans/vitest-setup-20250107/stages/01-install.md
# Execute .ccautorun/plans/vitest-setup-20250107/stages/02-infrastructure.md
```

---

## Monitoring Execution

### Real-Time Monitoring

Open a new terminal and run:

```bash
ccautorun watch vitest-setup-20250107
```

Output:

```
📊 Plan: vitest-setup-20250107
   Status: Running
   Progress: [▓▓▓▓▓▓▓░░░] 68% (Stage 2/3)

   ✅ Stage 1: Install and Configure (12m 34s)
   🔄 Stage 2: Create Infrastructure (in progress, 5m 12s)
   ⏳ Stage 3: Write Example Tests
   ⏳ Stage 4: Configure Coverage
   ⏳ Stage 5: Update Documentation

   ETA: 18 minutes
```

### View Logs

```bash
# Recent logs
ccautorun logs vitest-setup-20250107 --tail 50

# Follow logs in real-time
ccautorun logs vitest-setup-20250107 -f
```

### Check Status

```bash
ccautorun status vitest-setup-20250107
```

---

## Handling Safety Pauses

After executing 3 stages (default safety limit), ccAutoRun pauses for manual review:

```
⏸️ Safety Limit Reached (3/3 stages)

✅ Completed:
   - Stage 1: Install and Configure
   - Stage 2: Create Infrastructure
   - Stage 3: Write Example Tests

⏳ Remaining:
   - Stage 4: Configure Coverage
   - Stage 5: Update Documentation

Review changes and run: ccautorun resume vitest-setup-20250107
```

**To resume:**

```bash
# Review changes
git status
git diff

# If satisfied, resume
ccautorun resume vitest-setup-20250107
```

---

## Error Handling

If a stage fails:

```bash
# View error details
ccautorun logs vitest-setup-20250107 --tail 100

# Use recovery command
ccautorun recover vitest-setup-20250107
```

**Recovery options:**

```
? Choose recovery strategy:
  ❯ Retry      - Retry current stage (for temporary errors)
    Skip       - Skip current stage and continue
    Rollback   - Roll back to previous snapshot
    Abort      - Abort the entire plan
```

---

## Completing a Plan

Once all stages are complete:

```bash
# View statistics
ccautorun stats vitest-setup-20250107

# Archive the plan
ccautorun archive vitest-setup-20250107
```

---

## Essential Commands Quick Reference

| Command | Purpose | Example |
|---------|---------|---------|
| `init` | Initialize project | `ccautorun init --setup-hooks` |
| `doctor` | Check environment | `ccautorun doctor` |
| `list` | List all plans | `ccautorun list` |
| `status` | View plan status | `ccautorun status <plan-id>` |
| `watch` | Monitor progress | `ccautorun watch <plan-id>` |
| `pause` | Pause execution | `ccautorun pause <plan-id>` |
| `resume` | Resume execution | `ccautorun resume <plan-id>` |
| `logs` | View logs | `ccautorun logs <plan-id>` |
| `recover` | Recover from error | `ccautorun recover <plan-id>` |
| `archive` | Archive plan | `ccautorun archive <plan-id>` |

---

## Next Steps

Now that you've completed your first plan, explore:

- **[Core Concepts](./CORE_CONCEPTS.md)** - Understand execution plans, sessions, and architectures
- **[Command Reference](./COMMAND_REFERENCE.md)** - Complete list of all commands
- **[Configuration Guide](./CONFIGURATION.md)** - Customize ccAutoRun behavior
- **[Task Templates](./TEMPLATES.md)** - Pre-built templates for common tasks
- **[Best Practices](./BEST_PRACTICES.md)** - Tips for effective usage
- **[FAQ](./FAQ.md)** - Common questions answered

---

## Troubleshooting

### Hook not triggering

```bash
# Re-configure hooks
ccautorun init --setup-hooks

# Verify
ccautorun doctor
```

### Permission denied

```bash
# Fix permissions (macOS/Linux)
chmod -R u+rwX .ccautorun/
```

### Auto-continue not working

```bash
# Check configuration
cat .ccautorun/config.yaml | grep auto_continue
# Should show: enabled: true

# Check hooks
cat .claude/hooks.yaml | grep enabled
# Should show: enabled: true
```

---

## Get Help

- **Issues**: [Report a bug](https://github.com/yourusername/ccautorun/issues)
- **Discussions**: [Ask questions](https://github.com/yourusername/ccautorun/discussions)
- **Documentation**: Browse all docs in [docs/](.)

---

**[← Back to README](../README.md)** | **[Core Concepts →](./CORE_CONCEPTS.md)** | **[中文版本](./GETTING_STARTED_CN.md)**

# Core Concepts

> Understanding the fundamentals of ccAutoRun

[中文版本](./CORE_CONCEPTS_CN.md) | [Getting Started](./GETTING_STARTED.md)

---

## 📋 Table of Contents

- [What is ccAutoRun](#what-is-ccautorun)
- [Execution Plans](#execution-plans)
- [Architecture Types](#architecture-types)
- [Sessions](#sessions)
- [Safety Limiter](#safety-limiter)
- [Snapshot System](#snapshot-system)
- [Hook Mechanism](#hook-mechanism)

---

## What is ccAutoRun

ccAutoRun is an **AI-powered task automation tool** for Claude Code that transforms complex development tasks into self-executing workflows.

### Key Features

- **AI-Generated Plans**: Claude automatically breaks down complex tasks into manageable stages
- **Zero-Intervention Execution**: Hook-based system automatically progresses through stages
- **Token Efficiency**: Split architecture saves 90%+ tokens by loading only current stage
- **Production Safety**: Snapshots, safety limits, and error recovery built-in

### Use Cases

✅ **Best for:**
- Large-scale refactoring (e.g., migrating to TypeScript)
- Feature development (e.g., user authentication system)
- Adding test frameworks
- Performance optimization
- Documentation generation
- CI/CD setup

❌ **Not suitable for:**
- Single-file quick fixes
- Creative content (writing, design)
- Tasks requiring frequent human decisions

---

## Execution Plans

An execution plan is a structured description of a task, broken down into stages.

### Plan Structure (Split Architecture)

```
.ccautorun/plans/auth-feature-20250107/
├── EXECUTION_PLAN.md       # Plan overview
├── metadata.json           # Metadata
└── stages/
    ├── 01-database.md      # Stage 1 detailed steps
    ├── 02-api.md           # Stage 2 detailed steps
    └── 03-frontend.md      # Stage 3 detailed steps
```

### Plan Metadata

Each plan contains configuration metadata:

```markdown
<!-- AUTO-RUN-CONFIG
stages: 3
current: 1
auto_continue: true
safety_limit: 10
task_type: feature
estimated_time: 4-6h
architecture: split
-->
```

**Metadata Fields:**
- `stages`: Total number of stages
- `current`: Current stage being executed
- `auto_continue`: Enable/disable auto-continuation
- `safety_limit`: Pause after N stages for review
- `task_type`: Type of task (feature/refactor/bugfix/docs)
- `estimated_time`: Expected completion time
- `architecture`: split or single

---

## Architecture Types

ccAutoRun supports two architecture types:

### Split Architecture

**When to use:**
- Complex tasks with 4+ stages
- Large codebase modifications
- Long-running refactors
- Each stage has 800-2500 lines of code

**Benefits:**
- ✅ Only loads current stage → 90%+ token savings
- ✅ Each stage in separate file → easy to manage
- ✅ Scales to 20+ stages easily
- ✅ Easier to review and modify

**Structure:**
```
plan-directory/
├── EXECUTION_PLAN.md    # Overview + metadata
└── stages/
    ├── 01-stage.md      # Detailed steps
    ├── 02-stage.md
    └── 03-stage.md
```

**Example:**
```
Large Refactor: Migrate REST API to GraphQL
├── Stage 1: Analyze existing API structure
├── Stage 2: Design GraphQL schema
├── Stage 3: Implement resolvers (batch 1)
├── Stage 4: Implement resolvers (batch 2)
├── Stage 5: Client migration
├── Stage 6: Deprecate old API
└── Stage 7: Testing and documentation
```

### Single Architecture

**When to use:**
- Simple tasks with ≤3 stages
- Quick fixes or updates
- Total code < 2500 lines
- Well-defined, focused tasks

**Benefits:**
- ✅ Faster to generate
- ✅ Easy overview of entire plan
- ✅ Less file management
- ✅ Quick to modify

**Structure:**
```
plan-file.md
├── Metadata (in header)
├── Overview
├── Stage 1
├── Stage 2
└── Stage 3
```

**Example:**
```
Update README Documentation
├── Stage 1: Update installation instructions
├── Stage 2: Add usage examples
└── Stage 3: Update contribution guidelines
```

### Auto-Select (Recommended)

Let Claude automatically choose the best architecture:

```
/plan <your task description>
```

Claude analyzes:
- Task complexity
- Estimated lines of code
- Number of stages needed
- Project size

And picks the optimal architecture automatically!

---

## Sessions

A session tracks the execution state of a plan.

### Session Structure

```json
{
  "taskName": "auth-feature",
  "currentStage": 2,
  "status": "active",
  "count": 1,
  "startTime": "2025-11-07T08:00:00.000Z",
  "lastUpdated": "2025-11-07T08:30:00.000Z"
}
```

### Session Status

- **active**: Currently executing
- **paused**: Temporarily paused
- **completed**: All stages finished
- **failed**: Execution failed

### Session Management

```bash
# View current session
ccautorun status <plan-id>

# Reset session (start over)
ccautorun reset <plan-id>

# Pause session
ccautorun pause <plan-id>

# Resume session
ccautorun resume <plan-id>
```

---

## Safety Limiter

The safety limiter prevents runaway execution by pausing after N stages for manual review.

### How It Works

```
Execute Stage 1 → Auto-continue
Execute Stage 2 → Auto-continue
Execute Stage 3 → ⏸️ Pause (safety limit reached)
Wait for user confirmation → Resume
Execute Stage 4 → ...
```

### Configuration

```yaml
# .ccautorun/config.yaml
safety_limit: 3        # Pause after 3 stages
# or
safety_limit: unlimited  # No limit (use with caution)
```

### Recommended Values

| Environment | Recommended | Reason |
|-------------|-------------|--------|
| Development | 5-10 | Balance efficiency and safety |
| Simple tasks | 3-5 | Quick review |
| Complex tasks | 10-15 | Reduce interruptions |
| Trusted plans | unlimited | Highest risk |
| Production | 3 | Safest |

### Handling Safety Pauses

When the limit is reached:

```bash
# Review changes
git status
git diff

# View what was done
ccautorun logs <plan-id> --tail 50

# Resume if satisfied
ccautorun resume <plan-id>
```

---

## Snapshot System

Automatic backups before each stage execution.

### How It Works

Before executing each stage, ccAutoRun creates a snapshot:

```
Stage 1: Create snapshot → Execute → Success
Stage 2: Create snapshot → Execute → Success
Stage 3: Create snapshot → Execute → Failed!
         ↓
    Rollback to Stage 2 snapshot
```

### Snapshot Structure

```
.ccautorun/snapshots/auth-feature/
├── stage-1-before.tar.gz
├── stage-2-before.tar.gz
└── stage-3-before.tar.gz
```

### Configuration

```yaml
# Keep last N snapshots
snapshot_retention: 5
```

### Snapshot Management

```bash
# List snapshots
ccautorun snapshot list <plan-id>

# Rollback to snapshot
ccautorun snapshot rollback <plan-id> stage-2-before

# Clean old snapshots
ccautorun snapshot clean --older-than 7d

# View snapshot disk usage
ccautorun stats --disk-usage
```

---

## Hook Mechanism

Hooks enable automatic stage progression without manual intervention.

### How Hooks Work

```
Claude completes Stage 1
    ↓
Hook detects completion (.claude/hooks.yaml)
    ↓
Hook updates session state
    ↓
Hook loads Stage 2 content
    ↓
Claude automatically starts Stage 2
```

### Hook Configuration

`.claude/hooks.yaml`:

```yaml
hooks:
  - event: Stop                # Trigger when Claude stops
    command: node src/hooks/auto-continue.js
    description: Auto-continue to next stage
    enabled: false             # Set to true to enable
```

### Enabling Auto-Continue

Edit `.claude/hooks.yaml` and set `enabled: true`:

```yaml
hooks:
  - event: Stop
    command: node src/hooks/auto-continue.js
    description: Auto-continue to next stage
    enabled: true              # ← Change this
```

### Manual Triggering

If hooks aren't working, manually trigger the next stage:

```bash
ccautorun trigger <plan-id>
```

---

## Workflow Overview

Complete execution workflow:

```
1. Generate Plan (/plan command)
   ↓
2. Claude analyzes and creates execution plan
   ↓
3. Save plan to .ccautorun/plans/
   ↓
4. Execute Stage 1
   - Create snapshot
   - Execute steps
   - Update session
   ↓
5. Hook auto-triggers Stage 2
   ↓
6. Repeat until:
   A. All stages complete ✅
   B. Safety limit reached ⏸️
   C. Error encountered ❌
   ↓
7. Complete/Pause/Recover
```

---

## Best Practices

### Plan Design

✅ **DO:**
- Break tasks into 3-8 logical stages
- Each stage should have clear objectives
- Include testing steps in the plan
- Use descriptive stage names

❌ **DON'T:**
- Don't cram too much into one stage
- Don't skip testing and validation
- Don't use unlimited safety limit in production

### Execution Monitoring

✅ **DO:**
- Use `watch` command for long-running tasks
- Review changes periodically
- Enable desktop notifications
- Check logs for warnings

❌ **DON'T:**
- Don't run plans completely unmonitored
- Don't ignore warning messages
- Don't skip stages without understanding why they failed

---

## Next Steps

- **[Command Reference](./COMMAND_REFERENCE.md)** - Complete command list
- **[Configuration Guide](./CONFIGURATION.md)** - Customize behavior
- **[Best Practices](./BEST_PRACTICES.md)** - Advanced tips
- **[FAQ](./FAQ.md)** - Common questions

---

**[← Getting Started](./GETTING_STARTED.md)** | **[Command Reference →](./COMMAND_REFERENCE.md)** | **[中文版本](./CORE_CONCEPTS_CN.md)**

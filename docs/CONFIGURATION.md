# Configuration Guide

> Customize ccAutoRun behavior for your workflow

[中文版本](./CONFIGURATION_CN.md) | [Command Reference](./COMMAND_REFERENCE.md)

---

## Configuration Files

ccAutoRun uses two main configuration files:

```
.ccautorun/config.yaml     # Main configuration
.claude/hooks.yaml         # Claude Code hooks configuration
```

---

## config.yaml Reference

Location: `.ccautorun/config.yaml`

### Complete Configuration

```yaml
# ccAutoRun version
version: 2.0.0

# Default architecture: auto | split | single
default_architecture: auto

# Safety limit: number | unlimited
safety_limit: unlimited

# Desktop notifications
notifications:
  enabled: true
  sound: true
  progress_frequency: every-stage  # every-stage | milestone-only

# Auto-continue settings
auto_continue:
  enabled: true
  skip_permissions: true  # Dangerous mode - skip permission checks

# Default editor
editor: code  # code | vim | nano | idea

# Language
language: en  # en | zh

# Snapshot retention (number of snapshots to keep)
snapshot_retention: 5

# Log level
log_level: info  # error | warn | info | debug | trace

# Git integration (experimental)
git:
  auto_commit: false
  commit_message_prefix: "[ccAutoRun]"
```

### Configuration Options

#### `default_architecture`

Choose default architecture for plan generation.

**Values:**
- `auto` - Let Claude decide (recommended)
- `split` - Always use split architecture
- `single` - Always use single-file architecture

**When to change:**
- Set to `split` if you always work on complex tasks
- Set to `single` if you mostly do quick fixes

---

#### `safety_limit`

Number of stages to execute before pausing for review.

**Values:**
- Number (e.g., `3`, `5`, `10`)
- `unlimited` - No automatic pauses

**Recommendations:**

| Environment | Value | Reason |
|-------------|-------|--------|
| Development | 5-10 | Balance efficiency and safety |
| Production | 3 | Maximum safety |
| Simple tasks | 3-5 | Quick review |
| Complex tasks | 10-15 | Reduce interruptions |
| Fully trusted | unlimited | Highest risk |

---

#### `notifications`

Configure desktop notifications.

```yaml
notifications:
  enabled: true              # Enable/disable notifications
  sound: true                # Play sound with notifications
  progress_frequency: every-stage  # When to notify
```

**`progress_frequency` values:**
- `every-stage` - Notify after each stage completes
- `milestone-only` - Notify only at major milestones (25%, 50%, 75%, 100%)

---

#### `auto_continue`

Control automatic stage continuation.

```yaml
auto_continue:
  enabled: true              # Enable auto-continue
  skip_permissions: true     # Skip Claude permission prompts
```

**⚠️ Warning:** `skip_permissions: true` is dangerous in production!

**When to disable:**
- Testing new plans
- Production environments
- Untrusted plans

---

#### `editor`

Default editor for opening files.

**Supported values:**
- `code` - Visual Studio Code
- `vim` - Vim
- `nano` - Nano
- `idea` - IntelliJ IDEA

---

#### `snapshot_retention`

Number of snapshots to keep per plan.

**Default:** `5`

**Disk usage considerations:**
- Each snapshot can be 10-100MB depending on project size
- 5 snapshots ≈ 50-500MB per plan
- Increase for critical projects
- Decrease to save disk space

---

#### `log_level`

Logging verbosity.

**Values:**
- `error` - Only errors
- `warn` - Warnings and errors
- `info` - General information (default)
- `debug` - Detailed debugging info
- `trace` - Everything (very verbose)

---

## hooks.yaml Reference

Location: `.claude/hooks.yaml`

### Complete Configuration

```yaml
hooks:
  - event: Stop                          # Event type
    command: node src/hooks/auto-continue.js
    description: Auto-continue to next stage
    enabled: false                       # Set to true to enable

user-prompt-submit:
  command: node
  args:
    - .ccautorun/hooks/auto-continue.js
  enabled: false                         # Set to true to enable
  background: false
  timeout: 30000                         # 30 seconds
```

### Enabling Auto-Continue

To enable automatic stage progression:

1. Open `.claude/hooks.yaml`
2. Change `enabled: false` to `enabled: true`
3. Save the file

```yaml
hooks:
  - event: Stop
    command: node src/hooks/auto-continue.js
    description: Auto-continue to next stage
    enabled: true  # ← Change this
```

---

## Environment-Specific Configurations

### Development Environment

```yaml
# .ccautorun/config.yaml
version: 2.0.0
default_architecture: auto
safety_limit: unlimited      # No limits for rapid development
notifications:
  enabled: true
  sound: true
  progress_frequency: every-stage
auto_continue:
  enabled: true
  skip_permissions: true     # OK for dev
snapshot_retention: 3        # Save disk space
log_level: debug            # Verbose logging
```

### Production Environment

```yaml
# .ccautorun/config.yaml
version: 2.0.0
default_architecture: auto
safety_limit: 3              # Strict safety
notifications:
  enabled: true
  sound: true
  progress_frequency: milestone-only
auto_continue:
  enabled: true
  skip_permissions: false    # IMPORTANT: false for production
snapshot_retention: 5        # Keep more snapshots
log_level: info             # Moderate logging
```

### CI/CD Environment

```yaml
# .ccautorun/config.yaml
version: 2.0.0
default_architecture: split
safety_limit: unlimited      # No human review in CI
notifications:
  enabled: false             # No notifications in CI
auto_continue:
  enabled: false             # Manual control in CI
snapshot_retention: 1        # Minimal snapshots
log_level: info
```

---

## Configuration Best Practices

### Security

✅ **DO:**
- Set `skip_permissions: false` in production
- Use `safety_limit` to prevent runaway execution
- Keep `snapshot_retention >= 3` for rollback capability
- Use `audit` command regularly

❌ **DON'T:**
- Don't use `skip_permissions: true` in production
- Don't set `safety_limit: unlimited` without careful consideration
- Don't disable snapshots (`snapshot_retention: 0`)

### Performance

✅ **DO:**
- Set `default_architecture: split` for large projects
- Lower `snapshot_retention` if disk space is limited
- Use `log_level: info` or `warn` in production

❌ **DON'T:**
- Don't use `log_level: trace` in production (performance impact)
- Don't keep too many snapshots (disk usage)

### User Experience

✅ **DO:**
- Enable notifications for long-running tasks
- Set appropriate `safety_limit` based on task complexity
- Use `progress_frequency: milestone-only` to reduce notification noise

❌ **DON'T:**
- Don't disable notifications completely (miss important events)
- Don't set `safety_limit` too low (constant interruptions)

---

## Modifying Configuration

### Recommended Method

Edit the file directly:

```bash
# macOS/Linux
vim .ccautorun/config.yaml

# Windows
notepad .ccautorun\config.yaml

# VS Code
code .ccautorun/config.yaml
```

### After Changing Configuration

Verify your changes:

```bash
ccautorun doctor
```

The `doctor` command will validate your configuration and report any errors.

---

## Configuration Validation

ccAutoRun validates configuration on startup. Common errors:

### Invalid YAML syntax

```
✗ Error: Invalid YAML syntax in config.yaml
  Line 5: unexpected token
```

**Fix:** Check YAML syntax (indentation, colons, quotes)

### Invalid value

```
✗ Error: Invalid value for safety_limit
  Expected: number or 'unlimited'
  Got: 'yes'
```

**Fix:** Use correct data type

### Missing required field

```
✗ Error: Missing required field 'version'
```

**Fix:** Add the required field

---

## Migrating Configuration

When upgrading ccAutoRun:

```bash
ccautorun migrate
```

This will:
- Backup old configuration
- Update to new format
- Preserve your custom settings
- Report any issues

---

## See Also

- [Command Reference](./COMMAND_REFERENCE.md) - All commands
- [Best Practices](./BEST_PRACTICES.md) - Usage tips
- [FAQ](./FAQ.md) - Common questions

---

**[← Command Reference](./COMMAND_REFERENCE.md)** | **[Best Practices →](./BEST_PRACTICES.md)** | **[中文版本](./CONFIGURATION_CN.md)**

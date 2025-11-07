# Best Practices

> Tips and techniques for effective ccAutoRun usage

[中文版本](./BEST_PRACTICES_CN.md) | [Configuration](./CONFIGURATION.md)

---

## 📋 Table of Contents

- [Plan Design](#plan-design)
- [Execution Monitoring](#execution-monitoring)
- [Error Handling](#error-handling)
- [Security](#security)
- [Performance](#performance)
- [Team Collaboration](#team-collaboration)

---

## Plan Design

### Write Clear Task Descriptions

❌ **Bad:**
```
/plan Optimize code
```

✅ **Good:**
```
/plan Optimize homepage loading performance

Current issues:
- Load time: 3.5s (Lighthouse score: 45)
- Large unoptimized images (avg 2MB each)
- No code splitting, bundle size 5MB

Goals:
- Load time < 1.5s (Lighthouse > 85)
- Images: WebP + lazy loading
- Implement code splitting

Tech stack: React 18 + Webpack 5
```

**Why it matters:** Specific descriptions lead to better AI-generated plans with accurate stage breakdown and time estimates.

---

### Break Down Large Tasks

❌ **Bad:**
```
Single massive plan:
- Stage 1: Refactor entire codebase (2000+ lines)
```

✅ **Good:**
```
Multiple focused plans:
Plan 1: Refactor authentication module (300 lines)
Plan 2: Refactor API layer (400 lines)
Plan 3: Refactor database models (250 lines)
```

**Why it matters:**
- Easier to review and validate
- Lower risk of errors
- Can be parallelized across team members

---

### Include Validation Steps

✅ **Always include:**
```
Stage 4: Testing and Validation
- Run existing test suite
- Add new test cases
- Manual testing checklist
- Performance benchmarks
```

❌ **Never skip:**
- Testing stages
- Code review checkpoints
- Validation criteria

---

### Use Descriptive Stage Names

❌ **Bad:**
```
Stage 1: Setup
Stage 2: Implementation
Stage 3: Testing
```

✅ **Good:**
```
Stage 1: Install vitest and configure test environment
Stage 2: Create test infrastructure (helpers, mocks, fixtures)
Stage 3: Write unit tests for core business logic
Stage 4: Configure coverage reporting and CI integration
```

---

## Execution Monitoring

### Always Monitor Long-Running Tasks

✅ **DO:**
```bash
# Terminal 1: Run Claude Code
claude

# Terminal 2: Monitor progress
ccautorun watch <plan-id>

# Terminal 3: Check logs if needed
ccautorun logs <plan-id> -f
```

❌ **DON'T:**
- Run plans completely unattended
- Ignore warning messages
- Skip progress checks

---

### Review at Safety Pauses

When ccAutoRun pauses:

```bash
# 1. Check what was done
git status
git diff

# 2. Review logs
ccautorun logs <plan-id> --tail 100

# 3. Run tests
npm test

# 4. If satisfied, resume
ccautorun resume <plan-id>
```

---

### Enable Notifications

```yaml
# .ccautorun/config.yaml
notifications:
  enabled: true
  sound: true
  progress_frequency: every-stage
```

**Notifications alert you to:**
- Stage completions
- Errors
- Safety limit reached
- Plan completion

---

## Error Handling

### Use Retry Before Skip

When a stage fails:

```bash
# 1. View error details
ccautorun logs <plan-id> --tail 100

# 2. Try retry first
ccautorun retry <plan-id>

# 3. Only skip if:
#    - Error is understood
#    - You've fixed it manually
#    - Stage is no longer needed
ccautorun skip <plan-id> <stage-number>
```

**Recovery strategy decision tree:**

```
Stage fails
    ↓
Is it a temporary error? (network, dependency)
    ├─ Yes → Retry
    └─ No → Is the error understood?
        ├─ Yes → Can you fix it manually?
        │   ├─ Yes → Fix → Skip
        │   └─ No → Rollback
        └─ No → Check logs → Decide
```

---

### Keep Snapshots

```yaml
# .ccautorun/config.yaml
snapshot_retention: 5  # Keep at least 5
```

**Never:**
- Disable snapshots completely
- Delete snapshot directory during execution
- Keep less than 3 snapshots

---

### Learn from Failures

After recovering:

```bash
# 1. Document what went wrong
echo "Stage 3 failed due to missing dependency X" >> .ccautorun/notes.md

# 2. Update plan to prevent future failures
code .ccautorun/plans/<plan-id>/EXECUTION_PLAN.md

# 3. Consider adding validation step
```

---

## Security

### Never Skip Permissions in Production

```yaml
# Development: OK
auto_continue:
  enabled: true
  skip_permissions: true

# Production: NEVER
auto_continue:
  enabled: true
  skip_permissions: false  # IMPORTANT
```

---

### Review Plans Before Execution

```bash
# 1. Generate plan
/plan Add user authentication

# 2. Review before starting
cat .ccautorun/plans/<plan-id>/EXECUTION_PLAN.md

# 3. Check each stage
cat .ccautorun/plans/<plan-id>/stages/01-*.md

# 4. Look for:
#    - Suspicious commands
#    - Hardcoded secrets
#    - Destructive operations
#    - External network calls
```

---

### Run Security Audits

```bash
# Regular audits
ccautorun audit

# Before production deployment
ccautorun audit --check-deps --check-files --check-config
```

---

### Use .gitignore Properly

```gitignore
# .gitignore

# Don't commit temporary data
.ccautorun/sessions/
.ccautorun/logs/
.ccautorun/snapshots/

# Optional: commit plans for team sharing
# .ccautorun/plans/

# Always commit hooks for team consistency
# .claude/

# Never commit secrets
.env
.env.local
*.key
*.pem
credentials.json
```

---

## Performance

### Use Split Architecture for Large Tasks

```yaml
# .ccautorun/config.yaml
default_architecture: split  # For complex projects
```

**When to use split:**
- 4+ stages
- 800+ lines per stage
- Large codebase modifications

**Benefits:**
- 90%+ token savings
- Faster Claude responses
- Better context management

---

### Clean Up Regularly

```bash
# Clean old snapshots (weekly)
ccautorun snapshot clean --older-than 7d

# Archive completed plans (monthly)
ccautorun archive --older-than 30d

# Check disk usage
ccautorun stats --disk-usage
```

---

### Optimize Snapshot Size

```yaml
# .ccautorun/config.yaml
snapshot_retention: 3  # If disk space limited
```

**Also add to .gitignore:**
```gitignore
node_modules/
.git/
dist/
build/
*.log
```

---

## Team Collaboration

### Share Plans via Git

```bash
# Setup: Don't ignore plans
# Edit .gitignore, comment out:
# # .ccautorun/plans/

# Commit plans
git add .ccautorun/plans/
git commit -m "Add authentication feature plan"
git push

# Team members pull and use
git pull
ccautorun list
```

---

### Create Team Templates

```bash
# 1. Create successful plan
/plan Feature X implementation

# 2. After completion, save as template
mkdir -p .ccautorun/templates/
cp -r .ccautorun/plans/feature-x .ccautorun/templates/feature-template

# 3. Team members use template
ccautorun plan from-template feature-template
```

---

### Document Decisions

Create `.ccautorun/README.md`:

```markdown
# Team ccAutoRun Guidelines

## Configuration Standards
- safety_limit: 5 for all projects
- skip_permissions: false (production)

## Naming Conventions
- Plans: `<type>-<feature>-<date>` (e.g., `feature-auth-20250107`)
- Branches: Create branch per plan

## Review Process
1. Generate plan
2. Team review (PR)
3. Execute after approval
4. Review changes before merge

## Templates
- feature-template: New features
- refactor-template: Code refactoring
- bugfix-template: Bug fixes
```

---

### Coordinate Plan Execution

❌ **Don't:**
```bash
# Multiple people running plans in same project simultaneously
Person A: ccautorun run plan-auth
Person B: ccautorun run plan-api  # ← File conflicts!
```

✅ **Do:**
```bash
# Option 1: Sequential execution
Person A: completes plan-auth
         ↓
Person B: starts plan-api

# Option 2: Different branches
Person A: git checkout -b feature-auth && ccautorun run plan-auth
Person B: git checkout -b feature-api && ccautorun run plan-api

# Option 3: Different projects
Person A: cd project-frontend && ccautorun run plan-ui
Person B: cd project-backend && ccautorun run plan-api
```

---

## General Tips

### Start Simple

1. **First plan:** Simple, well-defined task (≤3 stages)
2. **Second plan:** Moderate complexity (4-6 stages)
3. **Advanced plans:** Complex refactoring (7+ stages)

---

### Test in Development First

```bash
# 1. Test plan in dev branch
git checkout -b test-plan
ccautorun run plan-id

# 2. If successful, use in production
git checkout main
ccautorun run plan-id
```

---

### Keep Plans Focused

✅ **Good:**
```
Plan: Add user authentication
- Stage 1: Database models
- Stage 2: Auth API
- Stage 3: Frontend forms
- Stage 4: Tests
```

❌ **Too broad:**
```
Plan: Build entire user system
- Stage 1-5: Authentication
- Stage 6-10: Authorization
- Stage 11-15: User profiles
- Stage 16-20: Admin panel
```

**Instead:** Create 4 separate plans

---

### Review and Iterate

After each plan:

1. **What worked well?**
2. **What could be improved?**
3. **Update your personal best practices**
4. **Share learnings with team**

---

## Anti-Patterns to Avoid

❌ **Don't:**
- Skip doctor checks before starting
- Ignore safety limit warnings
- Delete snapshots prematurely
- Run with unlimited safety limit in production
- Commit sensitive data
- Execute plans without review
- Skip testing stages
- Ignore error logs

✅ **Do:**
- Run `ccautorun doctor` regularly
- Respect safety limits
- Keep snapshots
- Use appropriate safety limits
- Use .gitignore properly
- Review plans before execution
- Include comprehensive tests
- Monitor logs actively

---

## See Also

- [Configuration Guide](./CONFIGURATION.md) - Detailed configuration options
- [Command Reference](./COMMAND_REFERENCE.md) - All commands
- [FAQ](./FAQ.md) - Common questions
- [Troubleshooting](./TROUBLESHOOTING.md) - Problem solving

---

**[← Configuration](./CONFIGURATION.md)** | **[FAQ →](./FAQ.md)** | **[中文版本](./BEST_PRACTICES_CN.md)**

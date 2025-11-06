# Documentation Automation Guide

This guide explains how to use the automation tools to streamline the documentation development process.

## 🎯 Problem Statement

The documentation project has **145 tasks** to complete. Due to context window limitations, completing all tasks in a single Claude Code session is not feasible. This guide provides tools and workflows to make the process more efficient and less manual.

## 🛠️ Available Tools

### 1. Custom Slash Command: `/continue-docs`

**What it does:** Automatically reads the progress file, identifies the next batch of incomplete tasks, writes the documentation, and updates progress.

**How to use:**
```bash
# In Claude Code chat
/continue-docs
```

**What happens:**
1. Reads `DOCUMENTATION_PROGRESS.md`
2. Identifies next 5-10 incomplete pages
3. Creates MDX files with proper content
4. Updates progress tracking
5. Reports completion status

**When to use:** At the start of each new session to continue where you left off.

---

### 2. Progress Automation Script

**What it does:** Analyzes progress, identifies next tasks, generates session prompts, and checks file status.

**Available commands:**

```bash
# Show overall progress statistics
npm run docs:status

# Show next N tasks to work on (default: 7)
npm run docs:next
npm run docs:next 10

# Generate a ready-to-paste session prompt
npm run docs:prompt
npm run docs:prompt 5

# Check which files exist vs. marked complete
npm run docs:auto check
```

**Example output:**

```
📚 Documentation Automation Tool

Progress Overview:
  Total tasks: 145
  Completed: 53 (36.6%)
  Remaining: 92

Progress by Section:
  01: ████████████████████ 4/4 (100%)
  02: ████████████████████ 5/5 (100%)
  03: ████████████████████ 6/6 (100%)
  04: ████████████████████ 18/18 (100%)
  05: ████████░░░░░░░░░░░░ 8/20 (40%)
  ...
```

---

### 3. Recommended Workflow

Here's the most efficient workflow for continuing documentation work:

#### **Option A: Fully Automated (Recommended)**

```bash
# Step 1: Check progress
npm run docs:status

# Step 2: Start a new Claude Code session and use:
/continue-docs

# Step 3: Claude automatically:
# - Reads progress file
# - Writes next 5-10 pages
# - Updates progress
# - Reports completion

# Step 4: Repeat in new sessions until complete
```

#### **Option B: Semi-Automated (More Control)**

```bash
# Step 1: See what's next
npm run docs:next 7

# Step 2: Generate a prompt
npm run docs:prompt 7

# Step 3: Copy the prompt to Claude Code

# Step 4: Monitor progress and manually review

# Step 5: Repeat
```

---

## 🔄 Session Workflow

### Starting a New Session

1. **Check current status:**
   ```bash
   npm run docs:status
   ```

2. **Use the slash command:**
   ```
   /continue-docs
   ```

3. **Wait for completion** (Claude will report when done)

4. **Verify quality** (spot-check a few pages)

5. **Start next session** when ready

### Between Sessions

- **Review completed pages** for accuracy
- **Test code examples** to ensure they work
- **Check progress statistics** to track velocity
- **Adjust batch size** if sessions are too long/short

---

## 📊 Monitoring Progress

### Quick Status Check

```bash
npm run docs:status
```

Shows:
- Total tasks and completion percentage
- Progress by section
- Visual progress bars

### Detailed Next Steps

```bash
npm run docs:next 10
```

Shows:
- Next 10 tasks to complete
- File paths and page numbers
- Task descriptions

### File Verification

```bash
npm run docs:auto check
```

Shows:
- Which files have been created
- Which tasks are marked complete but file is missing
- Which tasks need attention

---

## 🎛️ Customization Options

### Adjust Batch Size

Depending on page complexity and context window usage:

**Small batches (5 pages):** Complex technical topics
```bash
npm run docs:next 5
/continue-docs   # Will auto-select ~5 pages
```

**Medium batches (7 pages):** Default, balanced
```bash
npm run docs:next 7
```

**Large batches (10 pages):** Simple reference pages
```bash
npm run docs:next 10
```

### Targeting Specific Sections

If you want to work on a specific section:

1. **Manually edit the prompt:**
   ```bash
   npm run docs:prompt
   ```

2. **Copy output and modify** to specify which pages

3. **Paste into Claude Code**

---

## 🚀 Advanced Automation (Optional)

For completely hands-off automation (experimental):

### Option 1: Shell Loop Script

Create `continue-loop.sh`:

```bash
#!/bin/bash

# Run until all tasks are complete
while true; do
  echo "Checking progress..."
  REMAINING=$(npm run docs:status --silent | grep "Remaining:" | awk '{print $2}')

  if [ "$REMAINING" = "0" ]; then
    echo "✅ All documentation complete!"
    break
  fi

  echo "📝 Remaining tasks: $REMAINING"
  echo "Starting new Claude Code session..."

  # Generate prompt
  PROMPT=$(npm run docs:prompt --silent)

  # TODO: Integrate with Claude Code CLI to auto-submit prompt
  # This requires Claude Code to support automation mode

  echo "$PROMPT"
  echo ""
  echo "Press Enter to continue to next batch, or Ctrl+C to stop..."
  read

done
```

**Note:** Full automation requires Claude Code CLI support, which may not be available yet.

### Option 2: Git Hooks for Auto-Commit

Create `.git/hooks/post-commit`:

```bash
#!/bin/bash

# Auto-push progress after each commit
if git log -1 --pretty=%B | grep -q "docs: completed pages"; then
  git push origin main
fi
```

---

## 📝 Best Practices

### 1. **Regular Progress Commits**

Commit after each batch:
```bash
git add peta-docs/
git commit -m "docs: completed pages 5.4.1 to 5.4.7"
git push
```

### 2. **Quality Over Speed**

- Spot-check completed pages
- Verify code examples work
- Ensure cross-references are correct
- Check for English language quality

### 3. **Track Velocity**

Monitor how many pages you complete per session:
- Adjust batch size if sessions are too long/short
- Identify sections that take more time
- Plan sessions accordingly

### 4. **Session Notes**

Keep a simple log:
```
Session 1: Pages 5.4.1 - 5.4.7 (7 pages, 45 min)
Session 2: Pages 5.5.1 - 5.5.3 (3 pages, 30 min)
Session 3: Pages 5.6.1 - 5.6.4 (4 pages, 40 min)
```

This helps predict completion time.

---

## 🎯 Estimated Timeline

Based on current progress (53/145 tasks complete):

- **Remaining:** 92 tasks
- **Batch size:** 7 pages per session
- **Sessions needed:** ~13 sessions
- **Time per session:** 30-60 minutes
- **Total remaining effort:** 6-13 hours

**Projected completion:**
- **At 1 session/day:** ~2 weeks
- **At 2 sessions/day:** ~1 week
- **At 4 sessions/day:** ~3 days

---

## ❓ Troubleshooting

### Issue: Batch size too large, running out of context

**Solution:**
```bash
npm run docs:prompt 5
# Manually specify smaller batch
```

### Issue: Progress file not updating

**Solution:**
- Ensure DOCUMENTATION_PROGRESS.md is not read-only
- Check file permissions
- Manually update if needed

### Issue: Generated content quality is low

**Solution:**
- Reduce batch size to allow more context per page
- Add more specific instructions to the prompt
- Review and edit completed pages manually

### Issue: Want to skip certain pages

**Solution:**
- Manually mark them as `[x]` in DOCUMENTATION_PROGRESS.md
- Or modify the automation script to skip them

---

## 🎉 Completion

When all 145 tasks are complete:

1. Run final checks:
   ```bash
   npm run docs:check
   npm run type-check
   npm run build
   ```

2. Verify all pages render correctly

3. Move to **Phase 3: Enhancement & Polish**

4. Celebrate! 🎊

---

## 📞 Support

If you encounter issues with automation tools:

1. Check this guide
2. Review DOCUMENTATION_PROGRESS.md
3. Inspect scripts/docs-automation.mjs
4. Modify as needed for your workflow

---

**Happy documenting! 🚀**

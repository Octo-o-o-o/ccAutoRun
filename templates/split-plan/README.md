# [Task Name] - Execution Plan

<!-- AUTO-RUN-CONFIG
stages: [NUMBER_OF_STAGES]
current: 1
auto_continue: true
safety_limit: 0
task_type: [feature|refactor|bugfix|docs]
estimated_time: [X-Y hours]
architecture: split
-->

## 📋 Task Overview

- **Task Name**: [Brief task name]
- **Task Type**: [feature|refactor|bugfix|docs]
- **Technology Stack**: [List key technologies]
- **Estimated Time**: [X-Y hours] ([NUMBER_OF_STAGES] stages)
- **Architecture**: Split (Main plan + detailed stages)
- **Created**: [ISO Date]
- **Project Path**: [Absolute path]

## 🎯 Background and Goals

### Current State
[Describe the current situation, pain points, or existing implementation]

### Goals
[List the main objectives of this task]
1. Goal 1
2. Goal 2
3. Goal 3

### Success Criteria
[Define what "done" looks like]
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## 📐 Execution Rules

1. **Sequential Execution**: Execute stages in order (Stage 1 → 2 → 3...)
2. **Quality First**: All completion criteria must be met before moving to next stage
3. **Incremental Commits**: Create a git commit after each stage completion
4. **Error Handling**: If a stage fails, follow the error recovery process
5. **Documentation**: Update progress and documentation as you go

## 📑 Stage Index

### Stage 1: [Stage Name]
**Goal**: [One-sentence description]
**Estimated Lines**: [600-1000]
**Detailed Doc**: [stages/01-stage-name.md](stages/01-stage-name.md)

**Key Tasks**:
- Task 1
- Task 2
- Task 3

---

### Stage 2: [Stage Name]
**Goal**: [One-sentence description]
**Estimated Lines**: [600-1000]
**Detailed Doc**: [stages/02-stage-name.md](stages/02-stage-name.md)

**Key Tasks**:
- Task 1
- Task 2
- Task 3

---

### Stage 3: [Stage Name]
**Goal**: [One-sentence description]
**Estimated Lines**: [600-1000]
**Detailed Doc**: [stages/03-stage-name.md](stages/03-stage-name.md)

**Key Tasks**:
- Task 1
- Task 2
- Task 3

---

[... Additional stages ...]

## 📊 Progress Tracking

| Stage | Status | Estimated | Actual | Completed | Issues |
|-------|--------|-----------|--------|-----------|--------|
| Stage 1 | ⏳ Pending | [X-Y]h | - | - | - |
| Stage 2 | ⏳ Pending | [X-Y]h | - | - | - |
| Stage 3 | ⏳ Pending | [X-Y]h | - | - | - |
| ... | ... | ... | ... | ... | ... |

**Total**: [X-Y] hours ([NUMBER_OF_STAGES] stages)

## 📝 Notes and Assumptions

[List any important assumptions, dependencies, or constraints]
- Assumption 1
- Assumption 2
- Dependency 1

## 🔗 Related Resources

- [Link to requirements doc]
- [Link to design doc]
- [Link to related issues]

## 🚀 Getting Started

To start executing this plan:
```bash
# Start with Stage 1
claude "@stages/01-stage-name.md" 开始执行 Stage 1

# After Stage 1 completion, continue with Stage 2
claude "@stages/02-stage-name.md" 继续执行 Stage 2

# Or use auto-continue (if configured)
ccautorun run [task-name]
```

---

**Architecture**: Split
**AI-Generated**: Yes
**Auto-Run Compatible**: Yes

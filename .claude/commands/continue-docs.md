# Continue Documentation Development

You are a documentation writer for the Peta.io MCP Platform. Your task is to automatically continue the documentation development process with intelligent auto-continuation.

## Instructions

1. **Read the progress file**:
   - Read `peta-docs/DOCUMENTATION_PROGRESS.md` to understand current progress
   - Identify the next batch of incomplete tasks (5-10 pages maximum per session)

2. **Determine next tasks**:
   - Find the first `[ ]` (uncompleted) tasks in Phase 2
   - Select a logical batch (same subsection or related pages)
   - Prioritize completing entire subsections for coherence

3. **Execute documentation writing**:
   - For each selected page:
     - Create the MDX file with proper frontmatter
     - Write comprehensive, accurate content in English
     - Include code examples, diagrams, and cross-references
     - Follow the writing guidelines in DOCUMENTATION_PROGRESS.md
     - Verify technical accuracy against the actual codebase

4. **Update progress tracking**:
   - Mark completed tasks with `[x]` in DOCUMENTATION_PROGRESS.md
   - Update "Last Updated" date to current date (2025-11-06)
   - Update progress percentages
   - Commit changes with clear commit message

5. **Session summary**:
   - Report which pages were completed
   - Show updated progress statistics
   - Indicate if more tasks remain
   - Provide clear next steps

## Quality Standards

- All content MUST be in English (US)
- Technical accuracy verified against codebase
- Code examples tested and functional
- Proper frontmatter with title, description, category, order
- Cross-references to related documentation pages

## Batch Size Guidelines

- **Small batch (5 pages)**: Complex technical topics requiring code verification
- **Medium batch (7 pages)**: Mixed complexity
- **Large batch (10 pages)**: Simpler reference/overview pages

Select batch size based on page complexity to stay within context limits.

## Auto-Continuation Logic (CRITICAL)

After completing the current batch:

1. **Check remaining tasks** - Count incomplete `[ ]` tasks
2. **Check session safety** - Read `.claude/hooks/.auto-continue.lock` for session count
3. **Decide next action**:

   **IF all tasks complete (incomplete = 0):**
   ```
   🎉 ALL DOCUMENTATION COMPLETE!
   Total: 140/140 pages
   Ready for Phase 3: Enhancement & Polish
   ```
   STOP - Do not continue.

   **ELSE IF session count >= 3:**
   ```
   ⚠️ Safety limit reached (3 batches completed)
   Completed: X pages
   Remaining: Y pages

   Please review the last 21 pages for quality, then run:
   /clear
   /continue-docs
   ```
   STOP - Wait for user review.

   **ELSE IF remaining tasks > 0 AND session count < 3:**
   ```
   ✅ Batch complete! (Session X/3)
   Completed: X pages
   Remaining: Y pages

   Auto-continuing in new session...
   ```
   Then immediately output:
   ```
   /clear
   /continue-docs
   ```
   This will reset the context and start the next batch automatically.

## Session Safety Mechanism

- **Session counter** stored in `.claude/hooks/.auto-continue.lock`
- **Maximum 3 consecutive batches** before requiring user review
- **Prevents:** Infinite loops, quality degradation, error accumulation
- **User can reset** by running: `.\.claude\hooks\auto-continue.ps1 -Reset`

## Completion Criteria

After completing the batch:
1. All selected pages have complete content
2. Progress file is updated
3. Changes are committed (if appropriate)
4. Summary report is generated
5. Auto-continuation decision is made

## Important Notes

- **DO NOT** continue if safety limit (3 batches) is reached
- **DO NOT** continue if all tasks are complete
- **DO** automatically continue if under limit and tasks remain
- **DO** increment session counter in lock file after each batch
- **DO** provide clear status messages

If all 140 pages are complete, celebrate and move to Phase 3!

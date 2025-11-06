#!/usr/bin/env node

/**
 * Documentation Automation Script
 *
 * This script helps manage the documentation development process:
 * - Analyzes current progress
 * - Identifies next batch of tasks
 * - Generates session prompts
 * - Tracks completion statistics
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROGRESS_FILE = path.join(__dirname, '..', 'DOCUMENTATION_PROGRESS.md');
const DOCS_DIR = path.join(__dirname, '..', 'content', 'docs');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

/**
 * Parse the progress file and extract task information
 */
function parseProgressFile() {
  const content = fs.readFileSync(PROGRESS_FILE, 'utf-8');
  const lines = content.split('\n');

  const tasks = [];
  let currentSection = null;
  let currentSubsection = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect main sections
    if (line.startsWith('### Section ')) {
      currentSection = line.replace('### Section ', '').split(':')[0];
      currentSubsection = null;
    }

    // Detect subsections
    if (line.startsWith('#### ')) {
      currentSubsection = line.replace('#### ', '').split(':')[0];
    }

    // Detect tasks
    const taskMatch = line.match(/^- \[([ x])\] \*\*Page ([\d.]+):\*\* `([^`]+)`/);
    if (taskMatch && currentSection) {
      const [, status, pageNum, filePath] = taskMatch;
      const completed = status === 'x';

      // Get description (next line or current line after filepath)
      let description = '';
      let j = i + 1;
      while (j < lines.length && lines[j].trim().startsWith('-') && !lines[j].includes('**Page')) {
        description += lines[j].trim().replace(/^- /, '') + ' ';
        j++;
      }

      tasks.push({
        section: currentSection,
        subsection: currentSubsection,
        pageNum,
        filePath,
        completed,
        description: description.trim(),
        lineNumber: i + 1,
      });
    }
  }

  return tasks;
}

/**
 * Analyze progress and generate statistics
 */
function analyzeProgress(tasks) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const remaining = total - completed;
  const percentage = ((completed / total) * 100).toFixed(1);

  const bySectionStatus = {};
  tasks.forEach(task => {
    if (!bySectionStatus[task.section]) {
      bySectionStatus[task.section] = { total: 0, completed: 0 };
    }
    bySectionStatus[task.section].total++;
    if (task.completed) {
      bySectionStatus[task.section].completed++;
    }
  });

  return {
    total,
    completed,
    remaining,
    percentage,
    bySectionStatus,
  };
}

/**
 * Get next batch of tasks to work on
 */
function getNextBatch(tasks, batchSize = 7) {
  const incomplete = tasks.filter(t => !t.completed);

  if (incomplete.length === 0) {
    return [];
  }

  // Try to get a coherent batch from the same subsection
  const firstTask = incomplete[0];
  const sameSubsection = incomplete.filter(
    t => t.section === firstTask.section && t.subsection === firstTask.subsection
  );

  if (sameSubsection.length >= batchSize) {
    return sameSubsection.slice(0, batchSize);
  }

  // If subsection is small, include tasks from same section
  const sameSection = incomplete.filter(t => t.section === firstTask.section);
  if (sameSection.length >= batchSize) {
    return sameSection.slice(0, batchSize);
  }

  // Otherwise, just return the next N tasks
  return incomplete.slice(0, batchSize);
}

/**
 * Generate a session prompt for Claude Code
 */
function generateSessionPrompt(batch) {
  const fileList = batch.map(t => `- ${t.filePath} (${t.pageNum})`).join('\n');

  return `
@peta-docs/DOCUMENTATION_PROGRESS.md

Please continue the documentation development process. Focus on the next batch of pages:

${fileList}

Instructions:
1. Read the progress file to understand the current state
2. Create each MDX file with proper frontmatter (title, description, category, order)
3. Write comprehensive, accurate content in English (US)
4. Include code examples, diagrams, and cross-references where appropriate
5. Verify technical accuracy against the actual codebase
6. Update DOCUMENTATION_PROGRESS.md as you complete each page
7. Provide a summary when done

Remember:
- All content must be in English (US)
- Follow the writing guidelines in DOCUMENTATION_PROGRESS.md
- Use design tokens from lib/ui-styles.ts
- Test code examples before including them
- Add cross-references to related pages

Let's continue building great documentation!
`.trim();
}

/**
 * Check which files have been created
 */
function checkFilesExist(tasks) {
  return tasks.map(task => {
    const fullPath = path.join(DOCS_DIR, task.filePath.replace('docs/', ''));
    const exists = fs.existsSync(fullPath);
    return { ...task, exists };
  });
}

/**
 * Main CLI interface
 */
function main() {
  const command = process.argv[2] || 'status';

  console.log(`${colors.bright}${colors.cyan}📚 Documentation Automation Tool${colors.reset}\n`);

  const tasks = parseProgressFile();
  const stats = analyzeProgress(tasks);

  switch (command) {
    case 'status':
    case 'stats':
      console.log(`${colors.bright}Progress Overview:${colors.reset}`);
      console.log(`  Total tasks: ${colors.bright}${stats.total}${colors.reset}`);
      console.log(`  Completed: ${colors.green}${stats.completed}${colors.reset} (${stats.percentage}%)`);
      console.log(`  Remaining: ${colors.yellow}${stats.remaining}${colors.reset}`);
      console.log();

      console.log(`${colors.bright}Progress by Section:${colors.reset}`);
      Object.entries(stats.bySectionStatus).forEach(([section, data]) => {
        const pct = ((data.completed / data.total) * 100).toFixed(0);
        const bar = '█'.repeat(Math.floor(pct / 5)) + '░'.repeat(20 - Math.floor(pct / 5));
        const statusColor = data.completed === data.total ? colors.green : colors.yellow;
        console.log(`  ${section}: ${statusColor}${bar}${colors.reset} ${data.completed}/${data.total} (${pct}%)`);
      });
      break;

    case 'next':
      const batchSize = parseInt(process.argv[3]) || 7;
      const batch = getNextBatch(tasks, batchSize);

      if (batch.length === 0) {
        console.log(`${colors.green}${colors.bright}🎉 All tasks completed!${colors.reset}\n`);
        console.log('Ready to move to Phase 3: Enhancement & Polish\n');
        break;
      }

      console.log(`${colors.bright}Next ${batch.length} tasks to complete:${colors.reset}\n`);
      batch.forEach((task, i) => {
        console.log(`${i + 1}. ${colors.cyan}${task.pageNum}${colors.reset} - ${task.filePath}`);
        if (task.description) {
          console.log(`   ${colors.reset}${task.description}${colors.reset}`);
        }
      });
      console.log();
      break;

    case 'prompt':
      const promptBatchSize = parseInt(process.argv[3]) || 7;
      const promptBatch = getNextBatch(tasks, promptBatchSize);

      if (promptBatch.length === 0) {
        console.log(`${colors.green}All documentation pages completed!${colors.reset}\n`);
        break;
      }

      const prompt = generateSessionPrompt(promptBatch);
      console.log(prompt);
      console.log();
      break;

    case 'check':
      console.log(`${colors.bright}Checking file existence:${colors.reset}\n`);
      const allTasks = checkFilesExist(tasks);
      const incomplete = allTasks.filter(t => !t.completed);

      incomplete.slice(0, 20).forEach(task => {
        const status = task.exists
          ? `${colors.green}✓ exists${colors.reset}`
          : `${colors.red}✗ missing${colors.reset}`;
        const checkbox = task.completed ? '[x]' : '[ ]';
        console.log(`  ${checkbox} ${task.filePath} - ${status}`);
      });

      if (incomplete.length > 20) {
        console.log(`\n  ... and ${incomplete.length - 20} more incomplete tasks\n`);
      }
      break;

    case 'help':
    default:
      console.log(`${colors.bright}Usage:${colors.reset}`);
      console.log(`  npm run docs:auto status           - Show progress statistics`);
      console.log(`  npm run docs:auto next [N]         - Show next N tasks (default: 7)`);
      console.log(`  npm run docs:auto prompt [N]       - Generate session prompt for next N tasks`);
      console.log(`  npm run docs:auto check            - Check which files exist vs. marked complete`);
      console.log(`  npm run docs:auto help             - Show this help message`);
      console.log();
      break;
  }
}

main();

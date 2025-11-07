/**
 * ccAutoRun validate command
 *
 * Validate execution plan format and structure
 */

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

const CCAUTORUN_DIR = '.ccautorun';
const PLANS_DIR = 'plans';

/**
 * Parse AUTO-RUN-CONFIG from markdown file
 */
function parseAutoRunConfig(content) {
  const configRegex = /<!--\s*AUTO-RUN-CONFIG\s*([\s\S]*?)-->/;
  const match = content.match(configRegex);

  if (!match) {
    return null;
  }

  const configText = match[1];
  const config = {};

  const lines = configText.split('\n').filter(line => line.trim());
  for (const line of lines) {
    const [key, value] = line.split(':').map(s => s.trim());
    if (key && value) {
      config[key] = value;
    }
  }

  return config;
}

/**
 * Count tokens (rough estimate: ~1.5 tokens per word, or ~0.75 tokens per character)
 */
function estimateTokens(text) {
  // Rough estimate: 1 token ≈ 4 characters for English, 1 token ≈ 2 characters for Chinese
  const hasLotOfChinese = (text.match(/[\u4e00-\u9fa5]/g) || []).length > text.length * 0.3;
  const divisor = hasLotOfChinese ? 2 : 4;
  return Math.ceil(text.length / divisor);
}

/**
 * Validate a single plan (split architecture)
 */
async function validateSplitPlan(planPath, taskName) {
  const errors = [];
  const warnings = [];
  let totalTokens = 0;

  // Check README.md
  const readmePath = path.join(planPath, 'README.md');
  try {
    const readmeContent = await fs.readFile(readmePath, 'utf-8');
    const config = parseAutoRunConfig(readmeContent);

    if (!config) {
      errors.push('README.md is missing AUTO-RUN-CONFIG header');
    } else {
      // Validate config fields
      const requiredFields = ['stages', 'current', 'task_type', 'estimated_time', 'architecture'];
      for (const field of requiredFields) {
        if (!config[field]) {
          errors.push(`AUTO-RUN-CONFIG is missing required field: ${field}`);
        }
      }

      if (config.architecture !== 'split') {
        errors.push(`Expected architecture: split, found: ${config.architecture}`);
      }
    }

    // Check README size
    const readmeLines = readmeContent.split('\n').length;
    if (readmeLines < 50) {
      warnings.push('README.md seems too short (< 50 lines)');
    } else if (readmeLines > 500) {
      warnings.push('README.md seems too long (> 500 lines). Consider simplifying.');
    }

    totalTokens += estimateTokens(readmeContent);
  } catch (error) {
    errors.push(`Failed to read README.md: ${error.message}`);
    return { errors, warnings, totalTokens: 0 };
  }

  // Check stages/ directory
  const stagesPath = path.join(planPath, 'stages');
  try {
    const stageFiles = await fs.readdir(stagesPath);
    const mdFiles = stageFiles.filter(f => f.endsWith('.md'));

    if (mdFiles.length === 0) {
      errors.push('No stage files found in stages/ directory');
      return { errors, warnings, totalTokens };
    }

    // Check stage file naming convention (01-name.md, 02-name.md, etc.)
    const stageNumberRegex = /^(\d{2})-(.+)\.md$/;
    const validStages = [];

    for (const file of mdFiles) {
      const match = file.match(stageNumberRegex);
      if (!match) {
        warnings.push(`Stage file has incorrect naming: ${file} (expected format: 01-name.md)`);
      } else {
        const stageNumber = parseInt(match[1], 10);
        validStages.push({ number: stageNumber, file });
      }

      // Check stage file content and size
      const stagePath = path.join(stagesPath, file);
      const stageContent = await fs.readFile(stagePath, 'utf-8');
      const stageLines = stageContent.split('\n').length;
      const stageTokens = estimateTokens(stageContent);

      totalTokens += stageTokens;

      // Check token efficiency
      if (stageTokens > 1500) {
        warnings.push(`${file} has ~${stageTokens} tokens (> 1500). Consider splitting into smaller stages.`);
      }

      if (stageLines < 300) {
        warnings.push(`${file} seems too short (${stageLines} lines). Consider adding more details.`);
      } else if (stageLines > 1200) {
        warnings.push(`${file} seems too long (${stageLines} lines). Consider breaking it down.`);
      }

      // Check for required sections
      const requiredSections = ['## 📋 Stage Information', '### 🎯 Goal', '### 📝 Task Checklist', '### ✅ Completion Criteria'];
      for (const section of requiredSections) {
        if (!stageContent.includes(section)) {
          warnings.push(`${file} is missing required section: "${section}"`);
        }
      }
    }

    // Check stage numbering sequence
    validStages.sort((a, b) => a.number - b.number);
    for (let i = 0; i < validStages.length; i++) {
      if (validStages[i].number !== i + 1) {
        warnings.push(`Stage numbering gap detected: expected stage ${i + 1}, found ${validStages[i].number}`);
      }
    }

  } catch (error) {
    errors.push(`Failed to read stages/ directory: ${error.message}`);
  }

  return { errors, warnings, totalTokens };
}

/**
 * Validate a single plan (single file architecture)
 */
async function validateSinglePlan(planPath, taskName) {
  const errors = [];
  const warnings = [];

  try {
    const content = await fs.readFile(planPath, 'utf-8');
    const config = parseAutoRunConfig(content);

    if (!config) {
      errors.push('Plan file is missing AUTO-RUN-CONFIG header');
    } else {
      // Validate config fields
      const requiredFields = ['stages', 'current', 'task_type', 'estimated_time', 'architecture'];
      for (const field of requiredFields) {
        if (!config[field]) {
          errors.push(`AUTO-RUN-CONFIG is missing required field: ${field}`);
        }
      }

      if (config.architecture !== 'single') {
        errors.push(`Expected architecture: single, found: ${config.architecture}`);
      }
    }

    // Check file size
    const lines = content.split('\n').length;
    const tokens = estimateTokens(content);

    if (lines < 500) {
      warnings.push('Plan seems too short (< 500 lines). Consider adding more details.');
    } else if (lines > 4000) {
      warnings.push('Plan seems too long (> 4000 lines). Consider using split architecture instead.');
    }

    if (tokens > 5000) {
      warnings.push(`Plan has ~${tokens} tokens (> 5000). Consider using split architecture for better token efficiency.`);
    }

    // Check for required sections
    const requiredSections = ['## 📋 Task Overview', '## 🎯 Background and Goals', '## 📑 Stage Index'];
    for (const section of requiredSections) {
      if (!content.includes(section)) {
        warnings.push(`Plan is missing required section: "${section}"`);
      }
    }

    // Check for stage markers (## Stage 1:, ## Stage 2:, etc.)
    const stageMatches = content.match(/##\s+Stage\s+\d+:/g);
    if (!stageMatches) {
      errors.push('No stage sections found (expected "## Stage 1:", etc.)');
    } else {
      const expectedStages = config.stages ? parseInt(config.stages, 10) : 0;
      if (stageMatches.length !== expectedStages) {
        warnings.push(`Expected ${expectedStages} stages, found ${stageMatches.length} stage sections`);
      }
    }

    return { errors, warnings, totalTokens: tokens };

  } catch (error) {
    errors.push(`Failed to read plan file: ${error.message}`);
    return { errors, warnings, totalTokens: 0 };
  }
}

/**
 * Validate command
 */
export async function validate(taskName, options = {}) {
  console.log(chalk.cyan('🔍 Validating execution plan...\n'));

  if (!taskName) {
    console.error(chalk.red('❌ Error: Task name is required'));
    console.log(chalk.gray('Usage: ccautorun validate <task-name>'));
    process.exit(1);
  }

  const plansBaseDir = path.join(process.cwd(), CCAUTORUN_DIR, PLANS_DIR);

  // Check if task exists (could be directory or .md file)
  const splitPlanPath = path.join(plansBaseDir, taskName);
  const singlePlanPath = path.join(plansBaseDir, `${taskName}.md`);

  let architecture = null;
  let planPath = null;

  try {
    const splitStat = await fs.stat(splitPlanPath);
    if (splitStat.isDirectory()) {
      architecture = 'split';
      planPath = splitPlanPath;
    }
  } catch (error) {
    // Not a directory, try single file
  }

  if (!architecture) {
    try {
      const singleStat = await fs.stat(singlePlanPath);
      if (singleStat.isFile()) {
        architecture = 'single';
        planPath = singlePlanPath;
      }
    } catch (error) {
      // Not a file either
    }
  }

  if (!architecture) {
    console.error(chalk.red(`❌ Error: Plan "${taskName}" not found`));
    console.log(chalk.gray(`\nSearched in:`));
    console.log(chalk.gray(`  - ${splitPlanPath} (split architecture)`));
    console.log(chalk.gray(`  - ${singlePlanPath} (single architecture)`));
    process.exit(1);
  }

  console.log(chalk.blue(`📁 Plan: ${taskName}`));
  console.log(chalk.blue(`🏗️  Architecture: ${architecture}\n`));

  // Validate based on architecture
  const result = architecture === 'split'
    ? await validateSplitPlan(planPath, taskName)
    : await validateSinglePlan(planPath, taskName);

  const { errors, warnings, totalTokens } = result;

  // Display results
  if (errors.length > 0) {
    console.log(chalk.red('❌ Validation Failed\n'));
    console.log(chalk.red('Errors:'));
    errors.forEach((error, i) => {
      console.log(chalk.red(`  ${i + 1}. ${error}`));
    });
    console.log('');
  }

  if (warnings.length > 0) {
    console.log(chalk.yellow('⚠️  Warnings:'));
    warnings.forEach((warning, i) => {
      console.log(chalk.yellow(`  ${i + 1}. ${warning}`));
    });
    console.log('');
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log(chalk.green('✅ Validation Passed!\n'));
  }

  // Display summary
  console.log(chalk.cyan('📊 Summary:'));
  console.log(chalk.gray(`  Architecture: ${architecture}`));
  console.log(chalk.gray(`  Estimated Tokens: ~${totalTokens}`));
  console.log(chalk.gray(`  Errors: ${errors.length}`));
  console.log(chalk.gray(`  Warnings: ${warnings.length}`));
  console.log('');

  if (errors.length === 0) {
    console.log(chalk.green('🚀 Plan is ready for execution!'));
    console.log('');
    console.log(chalk.gray('To start execution:'));

    if (architecture === 'split') {
      console.log(chalk.cyan(`  claude "@${path.relative(process.cwd(), path.join(planPath, 'stages/01-*.md'))}" 开始执行 Stage 1`));
    } else {
      console.log(chalk.cyan(`  claude "@${path.relative(process.cwd(), planPath)}" 开始执行`));
    }

    console.log(chalk.gray('\nOr use auto-continue:'));
    console.log(chalk.cyan(`  ccautorun run ${taskName}`));
  } else {
    console.log(chalk.red('❌ Please fix the errors before execution.'));
    process.exit(1);
  }
}

/**
 * Execution Plan Parser
 *
 * Parse EXECUTION_PLAN.md and stage files (split architecture)
 * Supports both single-file and split architecture
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

/**
 * Parse configuration header from markdown content
 * Format: <!-- AUTO-RUN-CONFIG\nkey: value\n... -->
 */
function parseConfigHeader(content) {
  const configMatch = content.match(/<!--\s*AUTO-RUN-CONFIG\s*\n([\s\S]*?)-->/);
  if (!configMatch) {
    return null;
  }

  const configText = configMatch[1];
  const config = {};

  // Parse YAML-like format
  const lines = configText.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const key = trimmed.substring(0, colonIndex).trim();
    const value = trimmed.substring(colonIndex + 1).trim();

    // Parse value
    if (value === 'true') config[key] = true;
    else if (value === 'false') config[key] = false;
    else if (/^\d+$/.test(value)) config[key] = parseInt(value, 10);
    else config[key] = value;
  }

  return config;
}

/**
 * Update configuration header in markdown content
 */
export function updateConfigHeader(content, updates) {
  const configMatch = content.match(/(<!--\s*AUTO-RUN-CONFIG\s*\n)([\s\S]*?)(-->)/);
  if (!configMatch) {
    throw new Error('Configuration header not found');
  }

  const prefix = configMatch[1];
  const suffix = configMatch[3];
  const configText = configMatch[2];

  // Parse existing config
  const lines = configText.split('\n');
  const updatedLines = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      updatedLines.push(line);
      continue;
    }

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) {
      updatedLines.push(line);
      continue;
    }

    const key = trimmed.substring(0, colonIndex).trim();
    if (key in updates) {
      // Update this line
      const indent = line.match(/^\s*/)[0];
      updatedLines.push(`${indent}${key}: ${updates[key]}`);
    } else {
      updatedLines.push(line);
    }
  }

  const newConfigText = updatedLines.join('\n');
  return content.replace(
    /(<!--\s*AUTO-RUN-CONFIG\s*\n)([\s\S]*?)(-->)/,
    `${prefix}${newConfigText}${suffix}`
  );
}

/**
 * Detect architecture type
 * @param {string} planPath - Path to plan file or directory
 * @returns {'single' | 'split' | null}
 */
export function detectArchitecture(planPath) {
  try {
    const stats = fs.statSync(planPath);

    if (stats.isDirectory()) {
      // Check if README.md exists
      const readmePath = path.join(planPath, 'README.md');
      if (fs.existsSync(readmePath)) {
        return 'split';
      }

      // Check if EXECUTION_PLAN.md exists
      const execPlanPath = path.join(planPath, 'EXECUTION_PLAN.md');
      if (fs.existsSync(execPlanPath)) {
        return 'split';
      }

      return null;
    } else if (stats.isFile() && planPath.endsWith('.md')) {
      return 'single';
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Parse split architecture plan
 * @param {string} planDir - Plan directory path
 * @returns {Object} Parsed plan data
 */
function parseSplitArchitecture(planDir) {
  // Try README.md first, then EXECUTION_PLAN.md
  let readmePath = path.join(planDir, 'README.md');
  if (!fs.existsSync(readmePath)) {
    readmePath = path.join(planDir, 'EXECUTION_PLAN.md');
  }

  if (!fs.existsSync(readmePath)) {
    throw new Error(`Plan README not found in ${planDir}`);
  }

  const readmeContent = fs.readFileSync(readmePath, 'utf-8');
  const config = parseConfigHeader(readmeContent);

  if (!config) {
    throw new Error(`Configuration header not found in ${readmePath}`);
  }

  // Scan stages directory
  const stagesDir = path.join(planDir, 'stages');
  if (!fs.existsSync(stagesDir)) {
    throw new Error(`Stages directory not found: ${stagesDir}`);
  }

  // Find all stage files with pattern: 01-*.md, 02-*.md, etc.
  // Use strict pattern to avoid matching backup files
  const stagePattern = path.join(stagesDir, '[0-9][0-9]-*.md');
  let allStageFiles = glob.sync(stagePattern);

  // Filter out backup files (*.backup, *.old, *.draft, etc.)
  allStageFiles = allStageFiles.filter(file => {
    const basename = path.basename(file, '.md');
    return !basename.match(/\.(backup|old|draft|bak|tmp)$/);
  });

  // Sort by stage number
  allStageFiles.sort((a, b) => {
    const numA = parseInt(path.basename(a).match(/^(\d+)-/)[1], 10);
    const numB = parseInt(path.basename(b).match(/^(\d+)-/)[1], 10);
    return numA - numB;
  });

  // Check for duplicate stage numbers
  const stageNumbers = new Set();
  for (const file of allStageFiles) {
    const num = parseInt(path.basename(file).match(/^(\d+)-/)[1], 10);
    if (stageNumbers.has(num)) {
      throw new Error(
        `Duplicate stage number ${num} found. Please remove backup/old/draft files from stages/ directory.`
      );
    }
    stageNumbers.add(num);
  }

  const currentStage = config.current || 1;
  const totalStages = config.stages || allStageFiles.length;

  // Find current stage file
  const currentStagePattern = `${String(currentStage).padStart(2, '0')}-*.md`;
  const currentStageFile = allStageFiles.find(file =>
    path.basename(file).match(new RegExp(`^${String(currentStage).padStart(2, '0')}-`))
  );

  if (!currentStageFile) {
    throw new Error(`Current stage file not found: ${currentStagePattern}`);
  }

  const completed = currentStage - 1;
  const percentage = Math.round((completed / totalStages) * 100);

  return {
    type: 'split',
    config,
    currentStageFile,
    allStageFiles,
    readmePath,
    progress: {
      completed,
      total: totalStages,
      percentage,
      current: currentStage
    }
  };
}

/**
 * Parse single file architecture plan
 * @param {string} planFile - Plan file path
 * @returns {Object} Parsed plan data
 */
function parseSingleArchitecture(planFile) {
  if (!fs.existsSync(planFile)) {
    throw new Error(`Plan file not found: ${planFile}`);
  }

  const content = fs.readFileSync(planFile, 'utf-8');
  const config = parseConfigHeader(content);

  if (!config) {
    throw new Error(`Configuration header not found in ${planFile}`);
  }

  const currentStage = config.current || 1;
  const totalStages = config.stages || 0;
  const completed = currentStage - 1;
  const percentage = totalStages > 0 ? Math.round((completed / totalStages) * 100) : 0;

  return {
    type: 'single',
    config,
    currentStageFile: planFile,
    allStageFiles: null, // Not applicable for single file
    readmePath: null,
    progress: {
      completed,
      total: totalStages,
      percentage,
      current: currentStage
    }
  };
}

/**
 * Parse execution plan
 * @param {string} planPath - Path to plan file or directory
 * @returns {Object} Parsed plan data
 */
export function parsePlan(planPath) {
  const archType = detectArchitecture(planPath);

  if (!archType) {
    throw new Error(`Invalid plan path: ${planPath}`);
  }

  if (archType === 'split') {
    return parseSplitArchitecture(planPath);
  } else {
    return parseSingleArchitecture(planPath);
  }
}

/**
 * Get next stage file path
 * @param {Object} planData - Parsed plan data from parsePlan()
 * @returns {string|null} Next stage file path or null if no more stages
 */
export function getNextStageFile(planData) {
  const { config, allStageFiles, currentStageFile, type } = planData;
  const currentStage = config.current || 1;
  const totalStages = config.stages;

  if (currentStage >= totalStages) {
    return null; // All stages completed
  }

  if (type === 'split') {
    const nextStageNum = currentStage + 1;
    const nextStageFile = allStageFiles.find(file =>
      path.basename(file).match(new RegExp(`^${String(nextStageNum).padStart(2, '0')}-`))
    );
    return nextStageFile || null;
  } else {
    // Single file: same file
    return currentStageFile;
  }
}

/**
 * Update plan progress (increment current stage)
 * @param {string} planPath - Path to plan file or directory
 * @param {number} newStage - New stage number
 */
export function updateProgress(planPath, newStage) {
  const archType = detectArchitecture(planPath);

  if (archType === 'split') {
    // Update README.md
    let readmePath = path.join(planPath, 'README.md');
    if (!fs.existsSync(readmePath)) {
      readmePath = path.join(planPath, 'EXECUTION_PLAN.md');
    }

    if (!fs.existsSync(readmePath)) {
      throw new Error(`README not found in ${planPath}`);
    }

    const content = fs.readFileSync(readmePath, 'utf-8');
    const updatedContent = updateConfigHeader(content, { current: newStage });

    // Atomic write: write to temp file then rename
    const tmpPath = `${readmePath}.tmp`;
    fs.writeFileSync(tmpPath, updatedContent, 'utf-8');
    fs.renameSync(tmpPath, readmePath);
  } else {
    // Update single file
    const content = fs.readFileSync(planPath, 'utf-8');
    const updatedContent = updateConfigHeader(content, { current: newStage });

    // Atomic write
    const tmpPath = `${planPath}.tmp`;
    fs.writeFileSync(tmpPath, updatedContent, 'utf-8');
    fs.renameSync(tmpPath, planPath);
  }
}

/**
 * Extract task name from plan path
 * @param {string} planPath - Path like "xxx/stages/02-api.md" or "xxx.md"
 * @returns {string} Task name
 */
export function extractTaskName(planPath) {
  // Handle split architecture: "xxx/stages/02-api.md" -> "xxx"
  if (planPath.includes('/stages/') || planPath.includes('\\stages\\')) {
    const parts = planPath.split(/[/\\]/);
    const stagesIndex = parts.findIndex(p => p === 'stages');
    if (stagesIndex > 0) {
      return parts[stagesIndex - 1];
    }
  }

  // Handle single file: "xxx.md" -> "xxx"
  const basename = path.basename(planPath, '.md');
  return basename;
}

export class PlanParser {
  /**
   * Parse execution plan metadata
   */
  static parseMetadata(content) {
    return parseConfigHeader(content);
  }

  /**
   * Parse plan from path
   */
  static parsePlan(planPath) {
    return parsePlan(planPath);
  }

  /**
   * Detect architecture type
   */
  static detectArchitecture(planPath) {
    return detectArchitecture(planPath);
  }

  /**
   * Get next stage file
   */
  static getNextStageFile(planData) {
    return getNextStageFile(planData);
  }

  /**
   * Update progress
   */
  static updateProgress(planPath, newStage) {
    return updateProgress(planPath, newStage);
  }

  /**
   * Extract task name
   */
  static extractTaskName(planPath) {
    return extractTaskName(planPath);
  }
}

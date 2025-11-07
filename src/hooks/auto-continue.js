#!/usr/bin/env node

/**
 * ccAutoRun auto-continue hook
 *
 * Hook implementation for automatic stage continuation
 * Supports three-tier fallback strategy for stage completion detection
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import notifier from 'node-notifier';
import {
  parsePlan,
  getNextStageFile,
  updateProgress,
  extractTaskName,
  detectArchitecture
} from '../core/plan-parser.js';
import {
  readSession,
  updateSession,
  setStatus,
  incrementCount
} from '../core/session-manager.js';
import { checkLimit } from '../core/safety-limiter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Timeout for hook execution (10 seconds)
const HOOK_TIMEOUT = 10000;

/**
 * Read stdin data with timeout
 */
function readStdinWithTimeout(timeout) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Hook timeout: stdin read exceeded 10 seconds'));
    }, timeout);

    let data = '';
    process.stdin.setEncoding('utf-8');

    process.stdin.on('data', chunk => {
      data += chunk;
    });

    process.stdin.on('end', () => {
      clearTimeout(timer);
      resolve(data);
    });

    process.stdin.on('error', err => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

/**
 * Parse hook data from stdin
 */
async function getHookData() {
  try {
    const data = await readStdinWithTimeout(HOOK_TIMEOUT);
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to parse hook data:', error.message);
    return null;
  }
}

/**
 * Read last N lines from file
 */
function readLastLines(filePath, lines = 100) {
  if (!fs.existsSync(filePath)) {
    return '';
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const allLines = content.split('\n');
  return allLines.slice(-lines).join('\n');
}

/**
 * Detect stage completion marker in transcript
 * Pattern: [STAGE_COMPLETE:N] where N is stage number
 */
function detectStageComplete(transcript) {
  const match = transcript.match(/\[STAGE_COMPLETE:(\d+)\]/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

/**
 * Check standalone marker file
 * File: .ccautorun/sessions/<task>.stage-complete
 */
function checkMarkerFile(taskName) {
  const markerPath = path.join(
    process.env.HOME || process.env.USERPROFILE,
    '.ccautorun',
    'sessions',
    `${taskName}.stage-complete`
  );

  if (fs.existsSync(markerPath)) {
    try {
      const content = fs.readFileSync(markerPath, 'utf-8').trim();
      const stageNum = parseInt(content, 10);

      // Delete marker file after reading
      fs.unlinkSync(markerPath);

      return isNaN(stageNum) ? null : stageNum;
    } catch (error) {
      console.error('Failed to read marker file:', error.message);
      return null;
    }
  }

  return null;
}

/**
 * Check file modification time (fallback strategy 2)
 */
function checkFileModification(planPath, timeWindowSeconds = 15) {
  try {
    const stats = fs.statSync(planPath);
    const modifiedTime = stats.mtime.getTime();
    const now = Date.now();
    const diff = (now - modifiedTime) / 1000;

    return diff <= timeWindowSeconds;
  } catch (error) {
    return false;
  }
}

/**
 * Three-tier fallback strategy for stage completion detection
 */
function detectCompletion(taskName, transcriptPath, planPath) {
  // Strategy 1: Check transcript for [STAGE_COMPLETE:N] marker
  const transcript = readLastLines(transcriptPath, 100);
  const stageFromMarker = detectStageComplete(transcript);

  if (stageFromMarker !== null) {
    console.log(`[auto-continue] Stage completion detected from transcript: ${stageFromMarker}`);
    return { detected: true, method: 'transcript', stage: stageFromMarker };
  }

  // Strategy 2: Check standalone marker file
  const stageFromFile = checkMarkerFile(taskName);

  if (stageFromFile !== null) {
    console.log(`[auto-continue] Stage completion detected from marker file: ${stageFromFile}`);
    return { detected: true, method: 'marker-file', stage: stageFromFile };
  }

  // Strategy 3: Check file modification time
  if (checkFileModification(planPath, 15)) {
    console.log('[auto-continue] Plan file modified recently, assuming AI completed stage');

    // Read current stage from plan
    try {
      const planData = parsePlan(planPath);
      const currentStage = planData.config.current || 1;
      return { detected: true, method: 'file-modification', stage: currentStage };
    } catch (error) {
      console.error('[auto-continue] Failed to parse plan:', error.message);
    }
  }

  // Final fallback: Not detected
  return { detected: false, method: null, stage: null };
}

/**
 * Extract plan path from transcript
 * Look for @ references like "@EXECUTION_PLAN.md" or "@docs/stages/stage-3.md"
 */
function extractPlanPath(transcript, cwd) {
  // Match @file references
  const matches = transcript.match(/@([^\s"']+\.md)/g);

  if (!matches || matches.length === 0) {
    return null;
  }

  // Find the most recent @ reference
  const lastMatch = matches[matches.length - 1];
  const filePath = lastMatch.substring(1); // Remove @

  // Resolve relative to cwd
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(cwd, filePath);

  return absolutePath;
}

/**
 * Detect errors in transcript
 */
function detectErrors(transcript) {
  const errorPatterns = [
    /error:/i,
    /exception:/i,
    /failed:/i,
    /compilation failed/i,
    /test failed/i,
    /command not found/i,
    /cannot find module/i,
    /syntax error/i
  ];

  for (const pattern of errorPatterns) {
    if (pattern.test(transcript)) {
      const match = transcript.match(pattern);
      return { hasError: true, pattern: pattern.source, match: match[0] };
    }
  }

  return { hasError: false };
}

/**
 * Send desktop notification
 */
function sendNotification(title, message, sound = false) {
  notifier.notify({
    title: `ccAutoRun - ${title}`,
    message,
    sound: sound,
    timeout: 5
  });
}

/**
 * Execute claude command
 */
function executeClaude(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

/**
 * Main auto-continue logic
 */
async function autoContinueHook() {
  try {
    console.log('[auto-continue] Hook started');

    // Read hook data from stdin
    const hookData = await getHookData();

    if (!hookData) {
      console.error('[auto-continue] No hook data received');
      return;
    }

    const { session_id, transcript_path, cwd } = hookData;

    console.log(`[auto-continue] Session ID: ${session_id}`);
    console.log(`[auto-continue] Transcript: ${transcript_path}`);
    console.log(`[auto-continue] CWD: ${cwd}`);

    // Read transcript
    const transcript = readLastLines(transcript_path, 100);

    // Extract plan path from transcript
    const planPath = extractPlanPath(transcript, cwd);

    if (!planPath) {
      console.log('[auto-continue] No plan file reference found in transcript');
      return;
    }

    console.log(`[auto-continue] Plan path: ${planPath}`);

    // Detect architecture
    const archType = detectArchitecture(planPath);

    if (!archType) {
      console.error('[auto-continue] Invalid plan path');
      return;
    }

    console.log(`[auto-continue] Architecture: ${archType}`);

    // Extract task name
    const taskName = extractTaskName(planPath);
    console.log(`[auto-continue] Task name: ${taskName}`);

    // Detect stage completion
    const completion = detectCompletion(taskName, transcript_path, planPath);

    if (!completion.detected) {
      console.log('[auto-continue] Stage completion not detected');
      sendNotification(
        'Manual Intervention Needed',
        `Stage completion not detected for task "${taskName}". Please run "ccautorun trigger ${taskName}" to continue manually.`,
        true
      );
      return;
    }

    console.log(`[auto-continue] Completion detected via ${completion.method}`);

    // Read session status
    let session = readSession(taskName);

    if (!session) {
      console.log('[auto-continue] No session found, creating new one');
      session = {
        taskName,
        count: 0,
        status: 'active',
        currentStage: 1,
        lastExecuted: new Date().toISOString(),
        lastSessionId: session_id,
        lastError: null
      };
    }

    // Check if paused
    if (session.status === 'paused') {
      console.log('[auto-continue] Session is paused, skipping auto-continue');
      sendNotification('Session Paused', `Task "${taskName}" is paused. Use "ccautorun resume" to continue.`);
      return;
    }

    // Check if failed
    if (session.status === 'failed') {
      console.log('[auto-continue] Session is in failed state, skipping auto-continue');
      sendNotification(
        'Session Failed',
        `Task "${taskName}" failed. Use "ccautorun recover" or "ccautorun retry" to fix.`,
        true
      );
      return;
    }

    // Detect errors in transcript
    const errorCheck = detectErrors(transcript);

    if (errorCheck.hasError) {
      console.error(`[auto-continue] Error detected: ${errorCheck.match}`);
      setStatus(taskName, 'failed', errorCheck.match);
      sendNotification('Execution Failed', `Error detected in task "${taskName}": ${errorCheck.match}`, true);
      return;
    }

    // Parse plan
    let planData;
    try {
      planData = parsePlan(planPath);
    } catch (error) {
      console.error('[auto-continue] Failed to parse plan:', error.message);
      setStatus(taskName, 'failed', `Failed to parse plan: ${error.message}`);
      sendNotification('Plan Parse Error', error.message, true);
      return;
    }

    const { config, progress } = planData;
    const totalStages = config.stages || 0;
    const currentStage = config.current || 1;
    const safetyLimit = config.safety_limit || 0;

    console.log(`[auto-continue] Current stage: ${currentStage}/${totalStages}`);

    // Increment session count
    incrementCount(taskName);

    // Check safety limit
    const limitCheck = checkLimit(taskName, safetyLimit);

    if (!limitCheck.shouldContinue) {
      console.log(`[auto-continue] ${limitCheck.message}`);
      setStatus(taskName, 'paused', limitCheck.message);
      sendNotification('Safety Limit Reached', limitCheck.message, true);
      return;
    }

    // Check if all stages completed
    if (currentStage >= totalStages) {
      console.log('[auto-continue] All stages completed');
      setStatus(taskName, 'completed');
      sendNotification('Task Completed', `All stages completed for task "${taskName}"`, true);
      return;
    }

    // Update progress to next stage
    const nextStage = currentStage + 1;
    console.log(`[auto-continue] Updating progress to stage ${nextStage}`);

    try {
      updateProgress(planPath, nextStage);
    } catch (error) {
      console.error('[auto-continue] Failed to update progress:', error.message);
      setStatus(taskName, 'failed', `Failed to update progress: ${error.message}`);
      sendNotification(
        'Progress Update Failed',
        `Failed to update progress. Please run "ccautorun doctor" to diagnose. Error: ${error.message}`,
        true
      );
      return;
    }

    // Get next stage file
    const nextStageFile = getNextStageFile(planData);

    if (!nextStageFile) {
      console.error('[auto-continue] Next stage file not found');
      setStatus(taskName, 'failed', 'Next stage file not found');
      sendNotification('Next Stage Not Found', 'Please check your plan structure', true);
      return;
    }

    console.log(`[auto-continue] Next stage file: ${nextStageFile}`);

    // Update session
    updateSession(taskName, {
      currentStage: nextStage,
      lastSessionId: session_id,
      status: 'active'
    });

    // Build claude command
    const skipPermissions = config.auto_continue?.skip_permissions !== false; // Default true
    const skipPermsFlag = skipPermissions ? '--dangerously-skip-permissions' : '';

    if (!skipPermissions) {
      console.warn('[auto-continue] Warning: skip_permissions is disabled, auto-continue may be interrupted');
    }

    const claudeCommand = `claude ${skipPermsFlag} --resume ${session_id} "@${nextStageFile}" "开始执行 Stage ${nextStage}"`;

    console.log(`[auto-continue] Executing: ${claudeCommand}`);

    // Execute asynchronously (don't wait)
    exec(claudeCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('[auto-continue] Failed to execute claude:', error.message);
      } else {
        console.log('[auto-continue] Claude command executed successfully');
      }
    });

    // Send notification
    sendNotification('Stage Completed', `Stage ${currentStage}/${totalStages} completed. Starting stage ${nextStage}...`);

    console.log('[auto-continue] Hook completed successfully');
  } catch (error) {
    console.error('[auto-continue] Hook error:', error);
    sendNotification('Hook Error', error.message, true);
  }
}

// Execute hook if run as script
if (process.argv[1] === __filename || process.argv[1].endsWith('auto-continue.js')) {
  autoContinueHook().catch(error => {
    console.error('[auto-continue] Fatal error:', error);
    process.exit(1);
  });
}

export { autoContinueHook };

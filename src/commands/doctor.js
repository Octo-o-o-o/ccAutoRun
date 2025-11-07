/**
 * ccAutoRun doctor command
 *
 * Check system requirements and configuration
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { Config } from '../utils/config.js';
import { getLogger } from '../utils/logger.js';

const execAsync = promisify(exec);
const logger = getLogger();

/**
 * Check if a command exists in PATH
 */
async function commandExists(command) {
  try {
    const { stdout } = await execAsync(
      process.platform === 'win32' ? `where ${command}` : `which ${command}`,
      { timeout: 5000 }
    );
    return { exists: true, path: stdout.trim() };
  } catch {
    return { exists: false, path: null };
  }
}

/**
 * Check Node.js version
 */
async function checkNodeVersion() {
  const version = process.version;
  const majorVersion = parseInt(version.slice(1).split('.')[0]);
  const minVersion = 18;

  return {
    name: 'Node.js',
    status: majorVersion >= minVersion ? 'pass' : 'fail',
    message: `Version ${version}`,
    expected: `>= ${minVersion}.0.0`,
    canFix: false,
  };
}

/**
 * Check npm version
 */
async function checkNpmVersion() {
  try {
    const { stdout } = await execAsync('npm --version', { timeout: 5000 });
    const version = stdout.trim();
    const majorVersion = parseInt(version.split('.')[0]);
    const minVersion = 8;

    return {
      name: 'npm',
      status: majorVersion >= minVersion ? 'pass' : 'fail',
      message: `Version ${version}`,
      expected: `>= ${minVersion}.0.0`,
      canFix: false,
    };
  } catch {
    return {
      name: 'npm',
      status: 'fail',
      message: 'Not found',
      expected: '>= 8.0.0',
      canFix: false,
    };
  }
}

/**
 * Check Git installation
 */
async function checkGit() {
  const gitCheck = await commandExists('git');

  if (!gitCheck.exists) {
    return {
      name: 'Git',
      status: 'fail',
      message: 'Not found',
      expected: '>= 2.20.0',
      canFix: false,
    };
  }

  try {
    const { stdout } = await execAsync('git --version', { timeout: 5000 });
    const versionMatch = stdout.match(/(\d+\.\d+\.\d+)/);
    const version = versionMatch ? versionMatch[1] : 'unknown';

    return {
      name: 'Git',
      status: 'pass',
      message: `Version ${version}`,
      expected: '>= 2.20.0',
      canFix: false,
    };
  } catch {
    return {
      name: 'Git',
      status: 'warn',
      message: 'Installed but version unknown',
      expected: '>= 2.20.0',
      canFix: false,
    };
  }
}

/**
 * Check Claude CLI installation
 */
async function checkClaudeCLI() {
  const claudeCheck = await commandExists('claude');

  if (!claudeCheck.exists) {
    return {
      name: 'Claude CLI',
      status: 'warn',
      message: 'Not found (optional but recommended)',
      expected: 'Latest version',
      canFix: false,
    };
  }

  return {
    name: 'Claude CLI',
    status: 'pass',
    message: `Found at ${claudeCheck.path}`,
    expected: 'Latest version',
    canFix: false,
  };
}

/**
 * Check ccAutoRun initialization
 */
async function checkInitialization() {
  const config = new Config();
  const isInitialized = await config.isInitialized();

  if (!isInitialized) {
    return {
      name: 'ccAutoRun Initialization',
      status: 'fail',
      message: 'Not initialized',
      fix: 'Run: ccautorun init',
      canFix: true,
    };
  }

  return {
    name: 'ccAutoRun Initialization',
    status: 'pass',
    message: 'Initialized',
    canFix: false,
  };
}

/**
 * Check Claude Code hooks configuration
 */
async function checkHooksConfiguration() {
  const hookPath = '.claude/hooks/user-prompt-submit.js';

  try {
    await fs.access(hookPath);
    const content = await fs.readFile(hookPath, 'utf-8');

    if (content.includes('ccautorun') || content.includes('auto-continue')) {
      return {
        name: 'Claude Code Hooks',
        status: 'pass',
        message: 'Configured',
        canFix: false,
      };
    }

    return {
      name: 'Claude Code Hooks',
      status: 'warn',
      message: 'Hook file exists but may not be configured for ccAutoRun',
      fix: 'Run: ccautorun init --setup-hooks',
      canFix: true,
    };
  } catch {
    return {
      name: 'Claude Code Hooks',
      status: 'warn',
      message: 'Not configured (optional but recommended)',
      fix: 'Run: ccautorun init --setup-hooks',
      canFix: true,
    };
  }
}

/**
 * Check project structure
 */
async function checkProjectStructure() {
  const requiredDirs = ['.ccautorun', '.ccautorun/plans'];
  const missingDirs = [];

  for (const dir of requiredDirs) {
    try {
      await fs.access(dir);
    } catch {
      missingDirs.push(dir);
    }
  }

  if (missingDirs.length > 0) {
    return {
      name: 'Project Structure',
      status: 'fail',
      message: `Missing directories: ${missingDirs.join(', ')}`,
      fix: 'Run: ccautorun init',
      canFix: true,
    };
  }

  return {
    name: 'Project Structure',
    status: 'pass',
    message: 'All required directories exist',
    canFix: false,
  };
}

/**
 * Check configuration file
 */
async function checkConfigFile() {
  const configPath = '.ccautorun/config.yaml';

  try {
    await fs.access(configPath);
    const config = new Config();
    await config.load();

    return {
      name: 'Configuration File',
      status: 'pass',
      message: 'Valid',
      canFix: false,
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {
        name: 'Configuration File',
        status: 'warn',
        message: 'Not found, using defaults',
        fix: 'Run: ccautorun config',
        canFix: true,
      };
    }

    return {
      name: 'Configuration File',
      status: 'fail',
      message: `Invalid: ${error.message}`,
      fix: 'Run: ccautorun config',
      canFix: true,
    };
  }
}

/**
 * Auto-fix issues
 */
async function autoFix(checks, dryRun = false) {
  const fixableIssues = checks.filter(c => c.canFix && c.status !== 'pass');

  if (fixableIssues.length === 0) {
    logger.info('No fixable issues found');
    return 0;
  }

  console.log(chalk.bold('\nFixable issues:\n'));

  for (const issue of fixableIssues) {
    console.log(chalk.yellow('⚠'), issue.name);
    console.log(chalk.gray('  Fix: '), issue.fix);
  }

  console.log();

  if (dryRun) {
    logger.info(chalk.gray('[DRY RUN] Would attempt to fix the above issues'));
    return fixableIssues.length;
  }

  logger.warn('Please run the suggested fix commands manually');
  return fixableIssues.length;
}

/**
 * Doctor command handler
 */
export async function doctor(options = {}) {
  const { fix = false, dryRun = false } = options;

  console.log(chalk.bold('\nccAutoRun System Check\n'));
  console.log(chalk.gray('Checking system requirements and configuration...\n'));

  // Run all checks
  const checks = await Promise.all([
    checkNodeVersion(),
    checkNpmVersion(),
    checkGit(),
    checkClaudeCLI(),
    checkInitialization(),
    checkHooksConfiguration(),
    checkProjectStructure(),
    checkConfigFile(),
  ]);

  // Display results
  let hasFailures = false;
  let hasWarnings = false;

  for (const check of checks) {
    const icon =
      check.status === 'pass' ? chalk.green('✓') :
      check.status === 'warn' ? chalk.yellow('⚠') :
      chalk.red('✗');

    console.log(icon, chalk.bold(check.name));
    console.log(chalk.gray('  Status: '), check.message);

    if (check.expected) {
      console.log(chalk.gray('  Expected: '), check.expected);
    }

    if (check.fix) {
      console.log(chalk.gray('  Fix: '), chalk.white(check.fix));
    }

    console.log();

    if (check.status === 'fail') hasFailures = true;
    if (check.status === 'warn') hasWarnings = true;
  }

  // Summary
  const passCount = checks.filter(c => c.status === 'pass').length;
  const warnCount = checks.filter(c => c.status === 'warn').length;
  const failCount = checks.filter(c => c.status === 'fail').length;

  console.log(chalk.bold('Summary:'));
  console.log(chalk.green(`  ✓ ${passCount} passed`));
  if (warnCount > 0) console.log(chalk.yellow(`  ⚠ ${warnCount} warnings`));
  if (failCount > 0) console.log(chalk.red(`  ✗ ${failCount} failed`));
  console.log();

  // Auto-fix if requested
  if (fix) {
    await autoFix(checks, dryRun);
  }

  // Exit status
  if (hasFailures) {
    logger.error('System check failed. Please fix the issues above.');
    return 1;
  }

  if (hasWarnings) {
    logger.warn('System check passed with warnings.');
    return 0;
  }

  logger.info(chalk.green('✓ All checks passed!'));
  return 0;
}

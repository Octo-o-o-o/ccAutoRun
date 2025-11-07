/**
 * ccAutoRun audit command
 *
 * Security audit - check dependencies, sensitive files, and security policies
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import chalk from 'chalk';
import { Config } from '../utils/config.js';
import { getLogger } from '../utils/logger.js';
import { Errors } from '../utils/error-handler.js';

const execAsync = promisify(exec);
const logger = getLogger();

/**
 * Sensitive file patterns
 */
const SENSITIVE_PATTERNS = [
  '.env',
  '.env.local',
  '.env.production',
  '.env.development',
  'credentials.json',
  'secrets.yaml',
  'secrets.yml',
  '*.pem',
  '*.key',
  '*.cert',
  'id_rsa',
  'id_ed25519',
  'id_ecdsa',
  'config.json', // May contain secrets
];

/**
 * Dangerous commands
 */
const DANGEROUS_COMMANDS = [
  'rm -rf /',
  'rm -rf /*',
  'format',
  'del /s',
  'mkfs',
  'dd if=/dev/zero',
  ':(){ :|:& };:', // Fork bomb
];

/**
 * Audit result structure
 */
class AuditResult {
  constructor() {
    this.timestamp = new Date().toISOString();
    this.passed = true;
    this.issues = [];
    this.warnings = [];
    this.suggestions = [];
    this.details = {
      dependencies: null,
      sensitiveFiles: null,
      commandSecurity: null,
      auditLog: null,
    };
  }

  addIssue(category, severity, message, fix = null) {
    this.issues.push({ category, severity, message, fix });
    if (severity === 'high' || severity === 'critical') {
      this.passed = false;
    }
  }

  addWarning(category, message) {
    this.warnings.push({ category, message });
  }

  addSuggestion(message) {
    this.suggestions.push(message);
  }

  toJSON() {
    return {
      timestamp: this.timestamp,
      passed: this.passed,
      issueCount: this.issues.length,
      warningCount: this.warnings.length,
      issues: this.issues,
      warnings: this.warnings,
      suggestions: this.suggestions,
      details: this.details,
    };
  }
}

/**
 * Run npm audit
 */
async function auditDependencies() {
  try {
    logger.info('Running npm audit...');

    const { stdout, stderr } = await execAsync('npm audit --json', {
      cwd: process.cwd(),
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });

    const auditData = JSON.parse(stdout || '{}');

    const result = {
      vulnerabilities: auditData.metadata?.vulnerabilities || {},
      totalVulnerabilities:
        (auditData.metadata?.vulnerabilities?.info || 0) +
        (auditData.metadata?.vulnerabilities?.low || 0) +
        (auditData.metadata?.vulnerabilities?.moderate || 0) +
        (auditData.metadata?.vulnerabilities?.high || 0) +
        (auditData.metadata?.vulnerabilities?.critical || 0),
      hasHighSeverity:
        (auditData.metadata?.vulnerabilities?.high || 0) +
          (auditData.metadata?.vulnerabilities?.critical || 0) >
        0,
    };

    logger.success('npm audit completed');
    return result;
  } catch (error) {
    // npm audit exits with code 1 if vulnerabilities found
    if (error.stdout) {
      try {
        const auditData = JSON.parse(error.stdout);
        return {
          vulnerabilities: auditData.metadata?.vulnerabilities || {},
          totalVulnerabilities:
            (auditData.metadata?.vulnerabilities?.info || 0) +
            (auditData.metadata?.vulnerabilities?.low || 0) +
            (auditData.metadata?.vulnerabilities?.moderate || 0) +
            (auditData.metadata?.vulnerabilities?.high || 0) +
            (auditData.metadata?.vulnerabilities?.critical || 0),
          hasHighSeverity:
            (auditData.metadata?.vulnerabilities?.high || 0) +
              (auditData.metadata?.vulnerabilities?.critical || 0) >
            0,
        };
      } catch (parseError) {
        logger.warn('Failed to parse npm audit output');
      }
    }

    return {
      error: error.message,
      vulnerabilities: {},
      totalVulnerabilities: 0,
      hasHighSeverity: false,
    };
  }
}

/**
 * Check for sensitive files
 */
async function checkSensitiveFiles() {
  try {
    logger.info('Checking for sensitive files...');

    const foundFiles = [];
    const gitignorePath = path.join(process.cwd(), '.gitignore');
    let gitignoreContent = '';

    // Read .gitignore if exists
    if (fsSync.existsSync(gitignorePath)) {
      gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
    }

    // Check for each sensitive pattern
    for (const pattern of SENSITIVE_PATTERNS) {
      const files = await findFiles(pattern);

      for (const file of files) {
        const isIgnored = isFileIgnored(file, gitignoreContent);
        foundFiles.push({
          file,
          pattern,
          ignored: isIgnored,
          risk: isIgnored ? 'low' : 'high',
        });
      }
    }

    logger.success('Sensitive files check completed');

    return {
      foundFiles,
      exposedFiles: foundFiles.filter(f => !f.ignored),
      protectedFiles: foundFiles.filter(f => f.ignored),
    };
  } catch (error) {
    logger.error('Failed to check sensitive files:', { error: error.message });
    return {
      error: error.message,
      foundFiles: [],
      exposedFiles: [],
      protectedFiles: [],
    };
  }
}

/**
 * Find files matching pattern (simplified glob)
 */
async function findFiles(pattern) {
  const found = [];

  async function scan(dir) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        // Skip node_modules and .git
        if (entry.name === 'node_modules' || entry.name === '.git') {
          continue;
        }

        if (entry.isDirectory()) {
          await scan(fullPath);
        } else if (entry.isFile()) {
          // Simple pattern matching
          if (matchesPattern(entry.name, pattern)) {
            found.push(path.relative(process.cwd(), fullPath));
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }

  await scan(process.cwd());
  return found;
}

/**
 * Check if pattern matches filename
 */
function matchesPattern(filename, pattern) {
  // Convert glob pattern to regex (simplified)
  const regex = pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');

  return new RegExp(`^${regex}$`).test(filename);
}

/**
 * Check if file is ignored in .gitignore
 */
function isFileIgnored(file, gitignoreContent) {
  const lines = gitignoreContent.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    // Simple pattern matching
    if (matchesPattern(path.basename(file), trimmed) || file.includes(trimmed)) {
      return true;
    }
  }

  return false;
}

/**
 * Check command security in hooks
 */
async function checkCommandSecurity() {
  try {
    logger.info('Checking hook command security...');

    const hooksDir = path.join(process.cwd(), '.claude', 'hooks');
    const issues = [];

    if (!fsSync.existsSync(hooksDir)) {
      return { checked: false, issues: [], message: 'No hooks directory found' };
    }

    const hookFiles = await fs.readdir(hooksDir);

    for (const hookFile of hookFiles) {
      const hookPath = path.join(hooksDir, hookFile);
      const content = await fs.readFile(hookPath, 'utf-8');

      // Check for dangerous commands
      for (const dangerousCmd of DANGEROUS_COMMANDS) {
        if (content.includes(dangerousCmd)) {
          issues.push({
            file: hookFile,
            command: dangerousCmd,
            severity: 'critical',
            message: `Dangerous command found: ${dangerousCmd}`,
          });
        }
      }

      // Check for command injection risks (e.g., unquoted variables)
      const injectionPatterns = [
        /\$\{[^}]+\}(?!\s*["'])/g, // Unquoted variable expansion
        /\$\([^)]+\)(?!\s*["'])/g, // Unquoted command substitution
      ];

      for (const pattern of injectionPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          issues.push({
            file: hookFile,
            pattern: pattern.toString(),
            severity: 'medium',
            message: 'Potential command injection risk (unquoted variable)',
            matches,
          });
        }
      }
    }

    logger.success('Command security check completed');

    return { checked: true, issues };
  } catch (error) {
    logger.error('Failed to check command security:', { error: error.message });
    return { checked: false, issues: [], error: error.message };
  }
}

/**
 * Check audit log
 */
async function checkAuditLog() {
  try {
    logger.info('Checking audit log...');

    const auditLogPath = path.join(process.cwd(), '.ccautorun', 'logs', 'audit.log');

    if (!fsSync.existsSync(auditLogPath)) {
      return { exists: false, message: 'Audit log not found (will be created on first audit event)' };
    }

    const stats = await fs.stat(auditLogPath);

    return {
      exists: true,
      size: stats.size,
      lastModified: stats.mtime,
    };
  } catch (error) {
    logger.warn('Failed to check audit log:', { error: error.message });
    return { exists: false, error: error.message };
  }
}

/**
 * Generate text report
 */
function generateTextReport(auditResult) {
  const report = [];

  report.push(chalk.bold('\n📋 Security Audit Report'));
  report.push(chalk.gray('─'.repeat(60)));
  report.push(chalk.gray(`Timestamp: ${auditResult.timestamp}`));
  report.push(chalk.gray(`Status: ${auditResult.passed ? chalk.green('✓ PASSED') : chalk.red('✗ FAILED')}\n`));

  // Dependencies
  if (auditResult.details.dependencies) {
    const deps = auditResult.details.dependencies;
    report.push(chalk.bold('Dependencies:'));

    if (deps.error) {
      report.push(chalk.yellow(`  ⚠ Error: ${deps.error}`));
    } else if (deps.totalVulnerabilities === 0) {
      report.push(chalk.green('  ✓ No vulnerabilities found'));
    } else {
      report.push(chalk.yellow(`  Found ${deps.totalVulnerabilities} vulnerabilities:`));
      const vulns = deps.vulnerabilities;
      if (vulns.critical) report.push(chalk.red(`    Critical: ${vulns.critical}`));
      if (vulns.high) report.push(chalk.red(`    High: ${vulns.high}`));
      if (vulns.moderate) report.push(chalk.yellow(`    Moderate: ${vulns.moderate}`));
      if (vulns.low) report.push(chalk.gray(`    Low: ${vulns.low}`));
      if (vulns.info) report.push(chalk.gray(`    Info: ${vulns.info}`));
    }
    report.push('');
  }

  // Sensitive files
  if (auditResult.details.sensitiveFiles) {
    const files = auditResult.details.sensitiveFiles;
    report.push(chalk.bold('Sensitive Files:'));

    if (files.exposedFiles.length === 0) {
      report.push(chalk.green('  ✓ No exposed sensitive files'));
    } else {
      report.push(chalk.red(`  ✗ Found ${files.exposedFiles.length} exposed files:`));
      files.exposedFiles.forEach(f => {
        report.push(chalk.red(`    - ${f.file} (${f.pattern})`));
      });
    }

    if (files.protectedFiles.length > 0) {
      report.push(chalk.gray(`  Protected: ${files.protectedFiles.length} files in .gitignore`));
    }
    report.push('');
  }

  // Command security
  if (auditResult.details.commandSecurity) {
    const cmd = auditResult.details.commandSecurity;
    report.push(chalk.bold('Command Security:'));

    if (!cmd.checked) {
      report.push(chalk.gray(`  - ${cmd.message || cmd.error}`));
    } else if (cmd.issues.length === 0) {
      report.push(chalk.green('  ✓ No security issues in hooks'));
    } else {
      report.push(chalk.red(`  ✗ Found ${cmd.issues.length} issues:`));
      cmd.issues.forEach(issue => {
        const color = issue.severity === 'critical' ? chalk.red : chalk.yellow;
        report.push(color(`    - ${issue.file}: ${issue.message}`));
      });
    }
    report.push('');
  }

  // Issues
  if (auditResult.issues.length > 0) {
    report.push(chalk.bold.red(`\n❌ Issues (${auditResult.issues.length}):`));
    auditResult.issues.forEach((issue, i) => {
      report.push(chalk.red(`  ${i + 1}. [${issue.severity}] ${issue.message}`));
      if (issue.fix) {
        report.push(chalk.gray(`     Fix: ${issue.fix}`));
      }
    });
  }

  // Warnings
  if (auditResult.warnings.length > 0) {
    report.push(chalk.bold.yellow(`\n⚠ Warnings (${auditResult.warnings.length}):`));
    auditResult.warnings.forEach((warning, i) => {
      report.push(chalk.yellow(`  ${i + 1}. ${warning.message}`));
    });
  }

  // Suggestions
  if (auditResult.suggestions.length > 0) {
    report.push(chalk.bold.blue(`\n💡 Suggestions:`));
    auditResult.suggestions.forEach((suggestion, i) => {
      report.push(chalk.blue(`  ${i + 1}. ${suggestion}`));
    });
  }

  report.push(chalk.gray('\n' + '─'.repeat(60)));

  return report.join('\n');
}

/**
 * Audit command handler
 */
export async function audit(options = {}) {
  const { report = 'text', output, fix = false } = options;

  try {
    logger.info('Starting security audit...');

    const auditResult = new AuditResult();

    // 1. Audit dependencies
    const depsResult = await auditDependencies();
    auditResult.details.dependencies = depsResult;

    if (depsResult.error) {
      auditResult.addWarning('dependencies', `npm audit failed: ${depsResult.error}`);
    } else if (depsResult.hasHighSeverity) {
      auditResult.addIssue(
        'dependencies',
        'high',
        `Found ${depsResult.vulnerabilities.high || 0} high and ${depsResult.vulnerabilities.critical || 0} critical vulnerabilities`,
        'Run "npm audit fix" to auto-fix'
      );
    } else if (depsResult.totalVulnerabilities > 0) {
      auditResult.addWarning(
        'dependencies',
        `Found ${depsResult.totalVulnerabilities} low/moderate vulnerabilities`
      );
    }

    // 2. Check sensitive files
    const filesResult = await checkSensitiveFiles();
    auditResult.details.sensitiveFiles = filesResult;

    if (filesResult.exposedFiles.length > 0) {
      auditResult.addIssue(
        'sensitive-files',
        'high',
        `Found ${filesResult.exposedFiles.length} sensitive files not in .gitignore`,
        'Add patterns to .gitignore'
      );
    }

    // 3. Check command security
    const cmdResult = await checkCommandSecurity();
    auditResult.details.commandSecurity = cmdResult;

    if (cmdResult.issues) {
      cmdResult.issues.forEach(issue => {
        auditResult.addIssue('command-security', issue.severity, issue.message, 'Review and fix hook code');
      });
    }

    // 4. Check audit log
    const logResult = await checkAuditLog();
    auditResult.details.auditLog = logResult;

    // Suggestions
    if (depsResult.totalVulnerabilities > 0) {
      auditResult.addSuggestion('Run "npm audit fix" to automatically fix vulnerabilities');
    }
    if (filesResult.exposedFiles.length > 0) {
      auditResult.addSuggestion('Add sensitive file patterns to .gitignore');
    }
    if (!logResult.exists) {
      auditResult.addSuggestion('Audit logging will be enabled after first security event');
    }

    // Apply fixes if requested
    if (fix && depsResult.totalVulnerabilities > 0) {
      logger.info('Applying automatic fixes...');
      try {
        await execAsync('npm audit fix');
        logger.success('npm audit fix completed');
      } catch (error) {
        logger.warn('npm audit fix failed:', { error: error.message });
      }
    }

    // Generate report
    let reportContent;
    if (report === 'json') {
      reportContent = JSON.stringify(auditResult.toJSON(), null, 2);
    } else if (report === 'html') {
      // Simplified HTML report
      reportContent = `<!DOCTYPE html>
<html>
<head><title>Security Audit Report</title></head>
<body>
  <h1>Security Audit Report</h1>
  <pre>${JSON.stringify(auditResult.toJSON(), null, 2)}</pre>
</body>
</html>`;
    } else {
      reportContent = generateTextReport(auditResult);
    }

    // Output report
    if (output) {
      await fs.writeFile(output, reportContent, 'utf-8');
      logger.success(`Report saved to: ${output}`);
    } else {
      console.log(reportContent);
    }

    logger.success('Security audit completed');

    // Exit with non-zero if failed
    if (!auditResult.passed) {
      process.exitCode = 1;
    }
  } catch (error) {
    logger.error('Audit failed:', { error: error.message });
    throw error;
  }
}

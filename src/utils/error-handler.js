/**
 * Error Handling Utility
 *
 * Unified error handling with error codes
 * See: docs/architecture/error-handling.md
 */

import chalk from 'chalk';

/**
 * Error code definitions
 */
export const ErrorCodes = {
  // Configuration errors (E001-E099)
  E001: 'CONFIG_NOT_FOUND',
  E002: 'CONFIG_INVALID',
  E003: 'CONFIG_VERSION_MISMATCH',
  E004: 'CONFIG_KEY_NOT_FOUND',

  // Initialization errors (E100-E199)
  E100: 'NOT_INITIALIZED',
  E101: 'ALREADY_INITIALIZED',
  E102: 'INIT_FAILED',

  // Plan errors (E200-E299)
  E200: 'PLAN_NOT_FOUND',
  E201: 'PLAN_INVALID',
  E202: 'PLAN_PARSE_ERROR',
  E203: 'STAGE_NOT_FOUND',

  // Execution errors (E300-E399)
  E300: 'EXECUTION_FAILED',
  E301: 'HOOK_NOT_CONFIGURED',
  E302: 'CLAUDE_NOT_FOUND',
  E303: 'CLAUDE_VERSION_TOO_OLD',

  // File system errors (E400-E499)
  E400: 'FILE_NOT_FOUND',
  E401: 'FILE_READ_ERROR',
  E402: 'FILE_WRITE_ERROR',
  E403: 'PERMISSION_DENIED',

  // Validation errors (E500-E599)
  E500: 'VALIDATION_FAILED',
  E501: 'SCHEMA_VALIDATION_FAILED',

  // System errors (E900-E999)
  E900: 'UNKNOWN_ERROR',
  E901: 'NODE_VERSION_TOO_OLD',
};

/**
 * Error messages and help text
 */
const ErrorMessages = {
  [ErrorCodes.E001]: {
    message: 'Configuration file not found',
    help: 'Run "ccautorun init" to initialize the project',
  },
  [ErrorCodes.E002]: {
    message: 'Configuration file is invalid',
    help: 'Check your .ccautorun/config.yaml for syntax errors or run "ccautorun doctor --fix" to auto-fix',
  },
  [ErrorCodes.E004]: {
    message: 'Configuration key not found',
    help: 'Use "ccautorun config --list" to see all available configuration keys',
  },
  [ErrorCodes.E100]: {
    message: 'Project not initialized',
    help: 'Run "ccautorun init" to set up ccAutoRun in this project',
  },
  [ErrorCodes.E101]: {
    message: 'Project already initialized',
    help: 'Use "ccautorun doctor" to verify the setup',
  },
  [ErrorCodes.E200]: {
    message: 'Plan not found',
    help: 'Use "ccautorun list" to see available plans',
  },
  [ErrorCodes.E301]: {
    message: 'Claude Code hooks not configured',
    help: 'Run "ccautorun init --setup-hooks" to configure hooks',
  },
  [ErrorCodes.E302]: {
    message: 'Claude CLI not found',
    help: 'Install Claude CLI from https://claude.com/claude-code',
  },
  [ErrorCodes.E303]: {
    message: 'Claude CLI version is too old',
    help: 'Upgrade Claude CLI: Run the installer from https://claude.com/claude-code',
  },
  [ErrorCodes.E901]: {
    message: 'Node.js version is too old',
    help: 'ccAutoRun requires Node.js >= 18.0.0. Please upgrade Node.js',
  },
};

export class ErrorHandler {
  /**
   * Handle error with proper formatting
   */
  static handle(error, context = {}) {
    const formatted = this.format(error, context);
    console.error(formatted);

    // Return exit code
    return error.exitCode || 1;
  }

  /**
   * Create user-friendly error
   */
  static createError(code, message, details = {}) {
    const errorDef = ErrorMessages[code];
    const error = new Error(message || errorDef?.message || 'Unknown error');
    error.code = code;
    error.details = details;
    error.help = errorDef?.help;
    error.exitCode = details.exitCode || 1;
    return error;
  }

  /**
   * Format error for display
   */
  static format(error, context = {}) {
    const lines = [];

    // Error header
    lines.push(chalk.red.bold('\n✗ Error: ') + chalk.red(error.message));

    // Error code
    if (error.code) {
      lines.push(chalk.gray(`  Code: ${error.code}`));
    }

    // Context information
    if (context.command) {
      lines.push(chalk.gray(`  Command: ${context.command}`));
    }

    // Details
    if (error.details && Object.keys(error.details).length > 0) {
      lines.push(chalk.gray('  Details:'));
      for (const [key, value] of Object.entries(error.details)) {
        if (key !== 'exitCode') {
          lines.push(chalk.gray(`    ${key}: ${value}`));
        }
      }
    }

    // Help text
    if (error.help) {
      lines.push(chalk.yellow('\n💡 Suggestion: ') + error.help);
    }

    // Stack trace in verbose mode
    if (context.verbose && error.stack) {
      lines.push(chalk.gray('\nStack trace:'));
      lines.push(chalk.gray(error.stack));
    }

    lines.push(''); // Empty line at the end

    return lines.join('\n');
  }

  /**
   * Throw formatted error
   */
  static throw(code, message, details = {}) {
    throw this.createError(code, message, details);
  }
}

/**
 * Common error creators for convenience
 */
export const Errors = {
  notInitialized: () => ErrorHandler.createError(ErrorCodes.E100),
  alreadyInitialized: () => ErrorHandler.createError(ErrorCodes.E101),
  configNotFound: () => ErrorHandler.createError(ErrorCodes.E001),
  configInvalid: (details) => ErrorHandler.createError(ErrorCodes.E002, null, details),
  configKeyNotFound: (key) => ErrorHandler.createError(ErrorCodes.E004, `Configuration key "${key}" not found`, { key }),
  planNotFound: (planName) => ErrorHandler.createError(ErrorCodes.E200, `Plan "${planName}" not found`, { planName }),
  claudeNotFound: () => ErrorHandler.createError(ErrorCodes.E302),
  claudeVersionTooOld: (currentVersion, requiredVersion) =>
    ErrorHandler.createError(ErrorCodes.E303, `Claude CLI version ${currentVersion} is too old (required: >= ${requiredVersion})`, { currentVersion, requiredVersion }),
  hookNotConfigured: () => ErrorHandler.createError(ErrorCodes.E301),
};

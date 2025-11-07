/**
 * Logging Utility
 *
 * Centralized logging with levels and rotation using winston
 */

import winston from 'winston';
import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Custom format for console output with colors
 */
const consoleFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
  const ts = chalk.gray(timestamp);
  let levelStr = level.toUpperCase().padEnd(5);

  // Colorize level
  switch (level) {
    case 'error':
      levelStr = chalk.red(levelStr);
      break;
    case 'warn':
      levelStr = chalk.yellow(levelStr);
      break;
    case 'info':
      levelStr = chalk.blue(levelStr);
      break;
    case 'debug':
      levelStr = chalk.gray(levelStr);
      break;
  }

  let output = `${ts} ${levelStr} ${message}`;

  // Add metadata if present
  if (Object.keys(meta).length > 0) {
    output += ' ' + chalk.gray(JSON.stringify(meta));
  }

  return output;
});

/**
 * Logger class using winston
 */
export class Logger {
  constructor(options = {}) {
    this.level = options.level || 'info';
    this.logDir = options.logDir || '.ccautorun/logs';
    this.verbose = options.verbose || false;

    // Create log directory if it doesn't exist
    this.ensureLogDir();

    // Create winston logger
    this.logger = this.createLogger();
  }

  /**
   * Ensure log directory exists
   */
  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      try {
        fs.mkdirSync(this.logDir, { recursive: true });
      } catch (error) {
        // Silently fail if we can't create log directory
        // Console logging will still work
      }
    }
  }

  /**
   * Create winston logger instance
   */
  createLogger() {
    const transports = [];

    // Console transport (always enabled)
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp({ format: 'HH:mm:ss' }),
          consoleFormat
        ),
        level: this.verbose ? 'debug' : this.level,
      })
    );

    // File transport (only if log directory exists)
    if (fs.existsSync(this.logDir)) {
      // Main log file
      transports.push(
        new winston.transports.File({
          filename: path.join(this.logDir, 'ccautorun.log'),
          format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.json()
          ),
          level: 'debug', // Always log debug to file
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: 5,
        })
      );

      // Error log file
      transports.push(
        new winston.transports.File({
          filename: path.join(this.logDir, 'error.log'),
          format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.json()
          ),
          level: 'error',
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: 5,
        })
      );
    }

    return winston.createLogger({
      level: 'debug',
      transports,
    });
  }

  /**
   * Log info message
   */
  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  /**
   * Log error message
   */
  error(message, meta = {}) {
    this.logger.error(message, meta);
  }

  /**
   * Log debug message
   */
  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  /**
   * Log warning message
   */
  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  /**
   * Log success message (info level with green color)
   */
  success(message, meta = {}) {
    // For console, we'll manually format success messages
    if (this.verbose || this.level !== 'error') {
      const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
      console.log(`${chalk.gray(timestamp)} ${chalk.green('✓')} ${chalk.green(message)}`);
    }
    // Still log to file as info
    this.logger.info(`SUCCESS: ${message}`, meta);
  }

  /**
   * Set log level dynamically
   */
  setLevel(level) {
    this.level = level;
    this.logger.transports.forEach(transport => {
      if (transport.name === 'console') {
        transport.level = level;
      }
    });
  }

  /**
   * Enable verbose mode
   */
  enableVerbose() {
    this.verbose = true;
    this.setLevel('debug');
  }
}

/**
 * Default logger instance (singleton)
 */
let defaultLogger = null;

export function getLogger(options = {}) {
  if (!defaultLogger) {
    defaultLogger = new Logger(options);
  }
  return defaultLogger;
}

/**
 * Initialize logger with options
 */
export function initLogger(options = {}) {
  defaultLogger = new Logger(options);
  return defaultLogger;
}

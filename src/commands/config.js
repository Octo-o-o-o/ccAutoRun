/**
 * ccAutoRun config command
 *
 * Manage ccAutoRun configuration
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import { Config } from '../utils/config.js';
import { getLogger } from '../utils/logger.js';
import { Errors } from '../utils/error-handler.js';

const logger = getLogger();

/**
 * Get nested value from object using dot notation
 * Example: get({a: {b: 1}}, 'a.b') => 1
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Set nested value in object using dot notation
 * Example: set({}, 'a.b', 1) => {a: {b: 1}}
 */
function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((current, key) => {
    if (!(key in current)) {
      current[key] = {};
    }
    return current[key];
  }, obj);

  target[lastKey] = value;
  return obj;
}

/**
 * Flatten nested object to dot notation
 * Example: {a: {b: 1}} => {'a.b': 1}
 */
function flattenObject(obj, prefix = '') {
  return Object.keys(obj).reduce((acc, key) => {
    const path = prefix ? `${prefix}.${key}` : key;

    if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      Object.assign(acc, flattenObject(obj[key], path));
    } else {
      acc[path] = obj[key];
    }

    return acc;
  }, {});
}

/**
 * Interactive configuration wizard
 */
async function interactiveConfig(currentConfig) {
  console.log(chalk.bold('\nccAutoRun Configuration Wizard\n'));
  console.log(chalk.gray('Press Enter to keep current value\n'));

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'default_architecture',
      message: 'Default plan architecture:',
      choices: [
        { name: 'Auto (recommended)', value: 'auto' },
        { name: 'Split (multi-file)', value: 'split' },
        { name: 'Single (single file)', value: 'single' },
      ],
      default: currentConfig.default_architecture || 'auto',
    },
    {
      type: 'input',
      name: 'safety_limit',
      message: 'Safety limit (max auto-continue iterations, 0 = unlimited):',
      default: currentConfig.safety_limit?.toString() || '0',
      validate: (input) => {
        const num = parseInt(input);
        if (isNaN(num) || num < 0) {
          return 'Please enter a non-negative number';
        }
        return true;
      },
      filter: (input) => parseInt(input),
    },
    {
      type: 'confirm',
      name: 'notifications_enabled',
      message: 'Enable desktop notifications:',
      default: currentConfig.notifications?.enabled !== false,
    },
    {
      type: 'confirm',
      name: 'notifications_sound',
      message: 'Play sound with notifications:',
      default: currentConfig.notifications?.sound !== false,
      when: (answers) => answers.notifications_enabled,
    },
    {
      type: 'list',
      name: 'notifications_progress_frequency',
      message: 'Notification frequency:',
      choices: [
        { name: 'Every stage', value: 'stage' },
        { name: 'Milestones only', value: 'milestone' },
        { name: 'Completion only', value: 'completion' },
      ],
      default: currentConfig.notifications?.progress_frequency || 'stage',
      when: (answers) => answers.notifications_enabled,
    },
    {
      type: 'confirm',
      name: 'auto_continue_enabled',
      message: 'Enable auto-continue (hooks):',
      default: currentConfig.auto_continue?.enabled !== false,
    },
    {
      type: 'confirm',
      name: 'auto_continue_skip_permissions',
      message: 'Skip permission checks (dangerous):',
      default: currentConfig.auto_continue?.skip_permissions === true,
      when: (answers) => answers.auto_continue_enabled,
    },
    {
      type: 'input',
      name: 'editor',
      message: 'Default editor for plan editing:',
      default: currentConfig.editor || 'code',
    },
    {
      type: 'input',
      name: 'snapshot_retention',
      message: 'Number of snapshots to retain per plan:',
      default: currentConfig.snapshot_retention?.toString() || '5',
      validate: (input) => {
        const num = parseInt(input);
        if (isNaN(num) || num < 1) {
          return 'Please enter a positive number';
        }
        return true;
      },
      filter: (input) => parseInt(input),
    },
  ]);

  // Build config object
  const newConfig = {
    default_architecture: answers.default_architecture,
    safety_limit: answers.safety_limit,
    notifications: {
      enabled: answers.notifications_enabled,
      sound: answers.notifications_sound !== false,
      progress_frequency: answers.notifications_progress_frequency || 'stage',
    },
    auto_continue: {
      enabled: answers.auto_continue_enabled,
      skip_permissions: answers.auto_continue_skip_permissions === true,
    },
    editor: answers.editor,
    snapshot_retention: answers.snapshot_retention,
  };

  return newConfig;
}

/**
 * List all configuration
 */
async function listConfig(config) {
  const flattened = flattenObject(config.data);

  console.log(chalk.bold('\nCurrent Configuration:\n'));

  for (const [key, value] of Object.entries(flattened)) {
    const displayValue = typeof value === 'boolean'
      ? (value ? chalk.green('true') : chalk.red('false'))
      : chalk.white(value);

    console.log(`${chalk.gray(key)}: ${displayValue}`);
  }

  console.log();
}

/**
 * Get configuration value
 */
async function getConfig(config, key) {
  const value = getNestedValue(config.data, key);

  if (value === undefined) {
    throw Errors.configKeyNotFound(key);
  }

  console.log(value);
  return value;
}

/**
 * Set configuration value
 */
async function setConfig(config, key, value, dryRun = false) {
  // Parse value
  let parsedValue = value;

  // Try to parse as boolean
  if (value === 'true') parsedValue = true;
  else if (value === 'false') parsedValue = false;
  // Try to parse as number
  else if (!isNaN(value) && value !== '') parsedValue = Number(value);

  if (dryRun) {
    console.log(chalk.gray('[DRY RUN] Would set:'));
    console.log(chalk.gray(`  ${key}: `), parsedValue);
    return;
  }

  // Update config
  const newData = { ...config.data };
  setNestedValue(newData, key, parsedValue);

  // Validate
  config.data = newData;
  await config.validate();

  // Save
  await config.save();

  logger.info(chalk.green('✓'), `Configuration updated: ${key} = ${parsedValue}`);
}

/**
 * Config command handler
 */
export async function config(options = {}) {
  const { get: getKey, set: setKey, setValue, list: showList, dryRun = false } = options;

  // Load config
  const configInstance = new Config();
  await configInstance.load();

  // Handle subcommands
  if (showList) {
    // List all config
    await listConfig(configInstance);
    return;
  }

  if (getKey) {
    // Get single config value
    await getConfig(configInstance, getKey);
    return;
  }

  if (setKey) {
    // Set single config value
    if (!setValue) {
      throw new Error('--set requires a value. Usage: --set <key> <value>');
    }

    await setConfig(configInstance, setKey, setValue, dryRun);
    return;
  }

  // Interactive wizard
  if (dryRun) {
    logger.info(chalk.gray('[DRY RUN] Would start interactive configuration wizard'));
    return;
  }

  const newConfig = await interactiveConfig(configInstance.data);

  // Show preview
  console.log(chalk.bold('\nNew Configuration:\n'));

  const flattened = flattenObject(newConfig);
  for (const [key, value] of Object.entries(flattened)) {
    const displayValue = typeof value === 'boolean'
      ? (value ? chalk.green('true') : chalk.red('false'))
      : chalk.white(value);

    console.log(`${chalk.gray(key)}: ${displayValue}`);
  }

  console.log();

  // Confirm
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Save this configuration?',
      default: true,
    },
  ]);

  if (!confirm) {
    logger.info('Configuration not saved');
    return;
  }

  // Update and save
  configInstance.data = newConfig;
  await configInstance.validate();
  await configInstance.save();

  logger.info(chalk.green('✓'), 'Configuration saved successfully');
}

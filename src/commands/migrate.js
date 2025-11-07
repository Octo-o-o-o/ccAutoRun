/**
 * Migrate Command
 *
 * Migrate configuration from older versions to v2.0
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { Config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { ConfigValidator } from '../utils/config-validator.js';

/**
 * Backup existing configuration
 */
async function backupConfig(configPath) {
  const backupPath = `${configPath}.backup-${Date.now()}`;

  try {
    await fs.copyFile(configPath, backupPath);
    return backupPath;
  } catch (error) {
    throw new Error(`Failed to backup configuration: ${error.message}`);
  }
}

/**
 * Migrate command handler
 */
export async function migrate(options = {}) {
  const { dryRun = false } = options;

  console.log(chalk.bold.cyan('\n  Configuration Migration\n'));

  // Load current configuration
  const config = new Config();

  try {
    const { config: currentConfig, migrated } = await config.load();

    if (migrated) {
      console.log(chalk.yellow('  ℹ  Configuration was already migrated during load'));
      console.log(chalk.green(`\n  ✓ Configuration is up to date (v${currentConfig.version})\n`));
      return;
    }

    // Check if migration is needed
    const validator = new ConfigValidator();
    const needsMigration = validator.needsMigration(currentConfig);

    if (!needsMigration) {
      console.log(chalk.green(`  ✓ Configuration is already at v${currentConfig.version}\n`));
      console.log(chalk.gray('    No migration needed.\n'));
      return;
    }

    // Perform migration
    const fromVersion = currentConfig.version || '1.0.0';
    const toVersion = '2.0.0';

    console.log(chalk.yellow(`  ⚠  Migration needed: v${fromVersion} → v${toVersion}\n`));

    if (dryRun) {
      console.log(chalk.cyan('  [DRY RUN] Preview of migration:\n'));

      const migratedConfig = validator.migrate(currentConfig, fromVersion, toVersion);

      console.log(chalk.gray('  Current configuration:'));
      console.log(chalk.gray(`    ${JSON.stringify(currentConfig, null, 2).split('\n').join('\n    ')}\n`));

      console.log(chalk.gray('  Migrated configuration:'));
      console.log(chalk.gray(`    ${JSON.stringify(migratedConfig, null, 2).split('\n').join('\n    ')}\n`));

      console.log(chalk.cyan('  [DRY RUN] No changes were made\n'));
      console.log(chalk.gray('    Run without --dry-run to apply migration.\n'));
      return;
    }

    // Backup current configuration
    const backupPath = await backupConfig(config.configPath);
    console.log(chalk.gray(`  📦 Backup created: ${backupPath}\n`));

    // Perform migration
    const migratedConfig = validator.migrate(currentConfig, fromVersion, toVersion);

    // Validate migrated configuration
    const validation = validator.validateConfig(migratedConfig);
    if (!validation.valid) {
      throw new Error(`Migration produced invalid configuration: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // Save migrated configuration
    await config.save(migratedConfig);

    console.log(chalk.green('  ✓ Migration completed successfully!\n'));
    console.log(chalk.gray(`    Version: v${fromVersion} → v${toVersion}`));
    console.log(chalk.gray(`    Backup: ${backupPath}\n`));

    // Show what was changed
    console.log(chalk.bold('  Changes made:\n'));
    const changes = getMigrationChanges(currentConfig, migratedConfig);
    changes.forEach(change => {
      console.log(chalk.green(`    + ${change}`));
    });
    console.log();

  } catch (error) {
    if (error.code === 'CONFIG_NOT_FOUND') {
      console.error(chalk.red('\n  ✗ Configuration not found\n'));
      console.log(chalk.gray('    Run "ccautorun init" first.\n'));
      process.exit(1);
    }

    logger.error('Migration failed:', error);
    console.error(chalk.red(`\n  ✗ Migration failed: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * Get human-readable migration changes
 */
function getMigrationChanges(oldConfig, newConfig) {
  const changes = [];

  // Version update
  if (oldConfig.version !== newConfig.version) {
    changes.push(`Updated version: ${oldConfig.version || '(none)'} → ${newConfig.version}`);
  }

  // New fields
  const oldKeys = new Set(Object.keys(oldConfig));
  const newKeys = Object.keys(newConfig);

  for (const key of newKeys) {
    if (!oldKeys.has(key)) {
      const value = JSON.stringify(newConfig[key]);
      changes.push(`Added field: ${key} = ${value}`);
    } else if (typeof newConfig[key] === 'object' && !Array.isArray(newConfig[key])) {
      // Check nested changes
      const nestedChanges = getNestedChanges(oldConfig[key], newConfig[key], key);
      changes.push(...nestedChanges);
    }
  }

  return changes.length > 0 ? changes : ['No structural changes (only version update)'];
}

/**
 * Get nested object changes
 */
function getNestedChanges(oldObj, newObj, prefix) {
  const changes = [];

  if (!oldObj) {
    return [`Added object: ${prefix}`];
  }

  const oldKeys = new Set(Object.keys(oldObj || {}));
  const newKeys = Object.keys(newObj || {});

  for (const key of newKeys) {
    if (!oldKeys.has(key)) {
      const value = JSON.stringify(newObj[key]);
      changes.push(`Added field: ${prefix}.${key} = ${value}`);
    }
  }

  return changes;
}

/**
 * Register migrate command with Commander
 */
export function registerMigrateCommand(program) {
  program
    .command('migrate')
    .description('Migrate configuration from older versions')
    .option('--dry-run', 'Preview migration without applying changes')
    .action(async (options) => {
      try {
        await migrate({
          ...options,
          dryRun: options.dryRun || program.opts().dryRun,
        });
      } catch (error) {
        logger.error('Migrate command failed:', error);
        console.error(chalk.red(`\n  ✗ Error: ${error.message}\n`));
        process.exit(1);
      }
    });
}

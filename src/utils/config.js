/**
 * Configuration Management
 *
 * Load and manage ccAutoRun configuration
 */

import fs from 'fs/promises';
import path from 'path';
import YAML from 'yaml';
import { ConfigValidator } from './config-validator.js';
import { Errors } from './error-handler.js';

export class Config {
  constructor(configDir = '.ccautorun') {
    this.configDir = configDir;
    this.configPath = path.join(configDir, 'config.yaml');
    this.validator = new ConfigValidator();
    this.config = null;
  }

  /**
   * Check if project is initialized
   */
  async isInitialized() {
    try {
      await fs.access(this.configPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Load configuration from file
   */
  async load() {
    try {
      const content = await fs.readFile(this.configPath, 'utf-8');
      const config = YAML.parse(content);

      // Check if migration is needed
      if (this.validator.needsMigration(config)) {
        const fromVersion = config.version || '1.0.0';
        const migratedConfig = this.validator.migrate(config, fromVersion, '2.0.0');

        // Save migrated config
        await this.save(migratedConfig);
        this.config = migratedConfig;

        return {
          config: migratedConfig,
          migrated: true,
          fromVersion,
        };
      }

      // Validate configuration
      const validation = this.validator.validateConfig(config);
      if (!validation.valid) {
        throw Errors.configInvalid({
          errors: this.validator.getErrorMessages(validation.errors),
        });
      }

      this.config = config;
      return { config, migrated: false };
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw Errors.configNotFound();
      }
      throw error;
    }
  }

  /**
   * Load or create default configuration
   */
  async loadOrDefault() {
    try {
      return await this.load();
    } catch (error) {
      if (error.code === 'CONFIG_NOT_FOUND') {
        this.config = ConfigValidator.getDefaultConfig();
        return { config: this.config, migrated: false };
      }
      throw error;
    }
  }

  /**
   * Save configuration to file
   */
  async save(config) {
    // Validate before saving
    const validation = this.validator.validateConfig(config);
    if (!validation.valid) {
      throw Errors.configInvalid({
        errors: this.validator.getErrorMessages(validation.errors),
      });
    }

    // Ensure config directory exists
    await fs.mkdir(this.configDir, { recursive: true });

    // Convert to YAML and save
    const yamlContent = YAML.stringify(config);
    await fs.writeFile(this.configPath, yamlContent, 'utf-8');

    this.config = config;
  }

  /**
   * Get configuration value by key (supports dot notation)
   */
  get(key, defaultValue) {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call load() first.');
    }

    const keys = key.split('.');
    let value = this.config;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }

    return value !== undefined ? value : defaultValue;
  }

  /**
   * Set configuration value by key (supports dot notation)
   */
  set(key, value) {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call load() first.');
    }

    const keys = key.split('.');
    let target = this.config;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in target) || typeof target[k] !== 'object') {
        target[k] = {};
      }
      target = target[k];
    }

    target[keys[keys.length - 1]] = value;
  }

  /**
   * Get all configuration
   */
  getAll() {
    return this.config;
  }

  /**
   * Update multiple values
   */
  update(updates) {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call load() first.');
    }

    this.config = {
      ...this.config,
      ...updates,
    };
  }

  /**
   * Create default configuration file
   */
  static async createDefault(configDir = '.ccautorun') {
    const config = new Config(configDir);
    await config.save(ConfigValidator.getDefaultConfig());
    return config;
  }
}

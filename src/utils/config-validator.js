/**
 * Configuration Validator
 *
 * Validate configuration using JSON Schema
 * See: docs/architecture/config-schema.md
 */

import Ajv from 'ajv';

/**
 * JSON Schema for ccAutoRun configuration
 */
const configSchema = {
  type: 'object',
  required: ['version'],
  properties: {
    version: {
      type: 'string',
      pattern: '^\\d+\\.\\d+\\.\\d+$',
      description: 'Configuration version (semver)',
    },
    default_architecture: {
      type: 'string',
      enum: ['auto', 'split', 'single'],
      default: 'auto',
      description: 'Default architecture for new plans',
    },
    safety_limit: {
      oneOf: [
        { type: 'number', minimum: 0 },
        { type: 'string', enum: ['unlimited'] },
      ],
      default: 'unlimited',
      description: 'Maximum auto-continue iterations (0 = unlimited)',
    },
    notifications: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean', default: true },
        sound: { type: 'boolean', default: true },
        progress_frequency: {
          type: 'string',
          enum: ['every-stage', 'every-2-stages', 'off'],
          default: 'every-stage',
        },
      },
      additionalProperties: false,
    },
    auto_continue: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean', default: true },
        skip_permissions: { type: 'boolean', default: true },
      },
      additionalProperties: false,
    },
    editor: {
      type: 'string',
      default: 'code',
      description: 'Default editor command',
    },
    language: {
      type: 'string',
      enum: ['en'],
      default: 'en',
      description: 'CLI output language',
    },
    snapshot_retention: {
      type: 'number',
      minimum: 1,
      default: 5,
      description: 'Number of snapshots to retain per plan',
    },
  },
  additionalProperties: false,
};

export class ConfigValidator {
  constructor() {
    this.ajv = new Ajv({ allErrors: true, useDefaults: true });
    this.validate = this.ajv.compile(configSchema);
  }

  /**
   * Validate configuration object
   * @returns {{ valid: boolean, errors: Array }}
   */
  validateConfig(config) {
    const valid = this.validate(config);

    if (!valid) {
      return {
        valid: false,
        errors: this.validate.errors.map(err => ({
          field: err.instancePath || err.params?.missingProperty,
          message: err.message,
          details: err,
        })),
      };
    }

    return { valid: true, errors: [] };
  }

  /**
   * Get formatted error messages
   */
  getErrorMessages(errors) {
    return errors.map(err => {
      const field = err.field ? `"${err.field}"` : 'configuration';
      return `  - ${field}: ${err.message}`;
    }).join('\n');
  }

  /**
   * Migrate configuration to latest version
   */
  migrate(config, fromVersion, toVersion) {
    // Simple version migration
    // v1.x.x -> v2.0.0
    if (fromVersion.startsWith('1.')) {
      // Add new fields with defaults
      return {
        ...config,
        version: '2.0.0',
        default_architecture: config.default_architecture || 'auto',
        safety_limit: config.safety_limit ?? 'unlimited',
        notifications: config.notifications || {
          enabled: true,
          sound: true,
          progress_frequency: 'every-stage',
        },
        auto_continue: config.auto_continue || {
          enabled: true,
          skip_permissions: true,
        },
        editor: config.editor || 'code',
        language: 'en',
      };
    }

    return config;
  }

  /**
   * Check if configuration needs migration
   */
  needsMigration(config, targetVersion = '2.0.0') {
    if (!config.version) return true;
    return config.version !== targetVersion;
  }

  /**
   * Get default configuration
   */
  static getDefaultConfig() {
    return {
      version: '2.0.0',
      default_architecture: 'auto',
      safety_limit: 'unlimited',
      notifications: {
        enabled: true,
        sound: true,
        progress_frequency: 'every-stage',
      },
      auto_continue: {
        enabled: true,
        skip_permissions: true,
      },
      editor: 'code',
      language: 'en',
      snapshot_retention: 5,
    };
  }
}

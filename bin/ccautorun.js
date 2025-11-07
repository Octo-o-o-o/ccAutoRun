#!/usr/bin/env node

/**
 * ccAutoRun v2.0 - Global CLI Entry Point
 *
 * This is the entry point for the `ccautorun` global command.
 * It imports and executes the main CLI module.
 */

import main from '../src/cli.js';

// Execute main CLI
try {
  main();
} catch (error) {
  console.error('Fatal error:', error.message);
  process.exit(1);
}

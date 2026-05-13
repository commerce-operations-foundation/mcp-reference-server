#!/usr/bin/env node

/**
 * Order Network eXchange MCP Server - SDK Version
 * Entry point using MCP SDK components
 */

import { realpathSync } from 'fs';
import { pathToFileURL } from 'url';

import { ConfigManager } from './config/config-manager.js';
import { MCPServerSDK } from './server.js';
import { Logger } from './utils/logger.js';
import { RetryHandler } from './utils/retry.js';
import { Sanitizer } from './utils/sanitizer.js';
import { TimeoutHandler } from './utils/timeout.js';

async function main() {
  try {
    // Initialize logger with safe defaults before config loading
    Logger.init('info');

    // Load configuration
    const configManager = ConfigManager.getInstance();
    const config = configManager.getAll();

    // Re-initialize logger with config values and structured logging if needed
    Logger.init(config.logging.level as any, true, {
      level: config.logging.level,
      dir: config.logging.dir,
    });

    // Configure utilities with config values
    RetryHandler.setConfig(config.resilience.retry);
    Sanitizer.setConfig(config.security.sanitization);
    TimeoutHandler.setConfig(config.performance.timeout);

    Logger.info('Starting Order Network eXchange MCP Server (SDK version)...');

    // Create and start server
    const server = new MCPServerSDK(config);
    await server.start();

    // Handle graceful shutdown
    const shutdown = async () => {
      Logger.info('Shutting down server...');
      await server.stop();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    // The SDK transport keeps the process alive, no need for setInterval
  } catch (error) {
    Logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Detect whether this module is the process entry point.
 *
 * `process.argv[1]` holds the path Node was invoked with. When the package is
 * installed via npm/npx, the `bin` entry is exposed as a symlink (for example
 * `node_modules/.bin/cof-mcp -> ../@virtocommerce/cof-mcp/dist/index.js`), so a
 * direct string comparison against `import.meta.url` fails on POSIX systems
 * and `main()` is silently skipped — the process exits with code 0 and no
 * output, which is what causes the server to "start and immediately disconnect"
 * under Claude Desktop on macOS/Linux.
 *
 * Resolving symlinks with `fs.realpathSync` and comparing canonical file URLs
 * makes the check correct on macOS, Linux, and Windows.
 */
function isMainModule(): boolean {
  const invokedPath = process.argv[1];
  if (!invokedPath) return false;
  try {
    return pathToFileURL(realpathSync(invokedPath)).href === import.meta.url;
  } catch {
    return false;
  }
}

if (isMainModule()) {
  main();
}

export { MCPServerSDK } from './server.js';
export { ConfigManager } from './config/config-manager.js';
export * from './types/index.js';
export * from './schemas/index.js';

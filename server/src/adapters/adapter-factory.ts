/**
 * Adapter Factory
 */

import * as path from 'path';
import * as fs from 'fs';
import { IFulfillmentAdapter, AdapterConfig, AdapterConstructor, AdapterError } from '../types/index.js';
import { Logger } from '../utils/logger.js';
import { MockAdapter } from './mock/mock-adapter.js';

/**
 * Factory for creating and managing adapter instances
 * Supports built-in, NPM, and local adapters with singleton pattern
 *
 * SECURITY WARNING:
 * This factory supports dynamic loading of adapters from NPM packages and local files.
 * Dynamic imports execute code with full system permissions. Only load adapters from
 * trusted sources. In production environments, consider:
 * - Using a whitelist of allowed adapter packages
 * - Running the MCP server in a containerized environment
 * - Implementing code signing for adapters
 * - Using Node.js permission flags to restrict file/network access
 *
 * For development and reference implementation use, the current approach provides
 * maximum flexibility for adapter developers.
 */
export class AdapterFactory {
  private static instances: Map<string, IFulfillmentAdapter> = new Map();
  private static builtInAdapters: Map<string, AdapterConstructor> = new Map();

  // Static initializer to register built-in adapters
  static {
    this.registerBuiltInAdapter('mock', MockAdapter as AdapterConstructor);
  }

  /**
   * Register a built-in adapter
   */
  static registerBuiltInAdapter(name: string, adapterClass: AdapterConstructor): void {
    this.builtInAdapters.set(name, adapterClass);
    Logger.debug(`Registered built-in adapter: ${name}`);
  }

  /**
   * Create or retrieve adapter instance
   */
  static async createAdapter(config: AdapterConfig): Promise<IFulfillmentAdapter> {
    const cacheKey = this.getCacheKey(config);

    // Return existing instance if available
    if (this.instances.has(cacheKey)) {
      Logger.debug(`Returning cached adapter instance: ${cacheKey}`);
      const existing = this.instances.get(cacheKey);
      if (existing) {
        return existing;
      }
    }

    let adapter: IFulfillmentAdapter;

    try {
      switch (config.type) {
        case 'built-in':
          adapter = await this.createBuiltInAdapter(config);
          break;
        case 'npm':
          adapter = await this.createNpmAdapter(config);
          break;
        case 'local':
          adapter = await this.createLocalAdapter(config);
          break;
        default:
          throw new AdapterError(
            `Unknown adapter type: ${(config as any).type}`,
            'UNKNOWN_ADAPTER_TYPE'
          );
      }

      // Validate adapter implements interface
      this.validateAdapter(adapter);

      // Cache instance
      this.instances.set(cacheKey, adapter);
      Logger.info(`Created adapter instance: ${cacheKey}`);

      return adapter;
    } catch (error) {
      Logger.error(`Failed to create adapter: ${cacheKey}`, error);
      throw error;
    }
  }

  /**
   * Create built-in adapter
   */
  private static async createBuiltInAdapter(config: AdapterConfig): Promise<IFulfillmentAdapter> {
    if (!config.name) {
      throw new AdapterError('Built-in adapter requires name', 'MISSING_ADAPTER_NAME');
    }

    const AdapterClass = this.builtInAdapters.get(config.name);
    if (!AdapterClass) {
      throw new AdapterError(
        `Built-in adapter not found: ${config.name}`,
        'ADAPTER_NOT_FOUND'
      );
    }

    return new AdapterClass(config);
  }

  /**
   * Create NPM adapter
   *
   * SECURITY NOTE: This method uses dynamic imports which could potentially load
   * any NPM package. Only use trusted adapter packages. In production environments,
   * consider implementing a whitelist of allowed packages.
   */
  private static async createNpmAdapter(config: AdapterConfig): Promise<IFulfillmentAdapter> {
    if (!config.package) {
      throw new AdapterError('NPM adapter requires package name', 'MISSING_PACKAGE_NAME');
    }

    // Log what's being loaded for transparency
    Logger.info(`Loading NPM adapter package: ${config.package}`);

    try {
      // Dynamically import NPM package
      const module = await import(config.package);
      const exportName = config.exportName || 'default';
      const AdapterClass = module[exportName];

      if (!AdapterClass) {
        throw new AdapterError(
          `Export '${exportName}' not found in package ${config.package}`,
          'EXPORT_NOT_FOUND'
        );
      }

      if (typeof AdapterClass !== 'function') {
        throw new AdapterError(
          `Export '${exportName}' is not a constructor`,
          'INVALID_CONSTRUCTOR'
        );
      }

      return new AdapterClass(config);
    } catch (error) {
      if (error instanceof AdapterError) {
        throw error;
      }
      throw new AdapterError(
        `Failed to load NPM adapter: ${config.package}`,
        'NPM_LOAD_ERROR',
        error
      );
    }
  }

  /**
   * Create local adapter
   *
   * SECURITY NOTE: This method loads JavaScript files from the filesystem using
   * dynamic imports. Only load adapter files from trusted sources. The loaded
   * code will have full access to your system with the same permissions as this
   * MCP server. Never load adapters from untrusted sources or user uploads.
   */
  private static async createLocalAdapter(config: AdapterConfig): Promise<IFulfillmentAdapter> {
    if (!config.path) {
      throw new AdapterError('Local adapter requires path', 'MISSING_ADAPTER_PATH');
    }

    const adapterPath = path.resolve(config.path);

    // Basic validation to prevent obvious mistakes
    if (!fs.existsSync(adapterPath)) {
      throw new AdapterError(
        `Local adapter file not found: ${adapterPath}`,
        'ADAPTER_FILE_NOT_FOUND'
      );
    }

    // Verify it's a file, not a directory
    const stats = fs.statSync(adapterPath);
    if (!stats.isFile()) {
      throw new AdapterError(
        `Adapter path must be a file, not a directory: ${adapterPath}`,
        'INVALID_ADAPTER_PATH'
      );
    }

    // Check for reasonable file extensions
    const ext = path.extname(adapterPath).toLowerCase();
    if (!['.js', '.ts', '.mjs', '.cjs'].includes(ext)) {
      Logger.warn(`Loading adapter with unusual extension: ${ext} from ${adapterPath}`);
    }

    // Log what's being loaded for transparency and debugging
    Logger.info(`Loading local adapter from: ${adapterPath}`);

    try {
      // Dynamically import local file
      const module = await import(adapterPath);
      const exportName = config.exportName || 'default';
      const AdapterClass = module[exportName];

      if (!AdapterClass) {
        throw new AdapterError(
          `Export '${exportName}' not found in ${adapterPath}`,
          'EXPORT_NOT_FOUND'
        );
      }

      if (typeof AdapterClass !== 'function') {
        throw new AdapterError(
          `Export '${exportName}' is not a constructor`,
          'INVALID_CONSTRUCTOR'
        );
      }

      return new AdapterClass(config);
    } catch (error) {
      if (error instanceof AdapterError) {
        throw error;
      }
      throw new AdapterError(
        `Failed to load local adapter: ${adapterPath}`,
        'LOCAL_LOAD_ERROR',
        error
      );
    }
  }

  /**
   * Validate adapter implements required interface
   */
  private static validateAdapter(adapter: any): void {
    const requiredMethods = [
      'connect', 'disconnect', 'healthCheck',
      'captureOrder', 'cancelOrder', 'updateOrder', 'returnOrder', 'exchangeOrder', 'shipOrder',
      'holdOrder', 'splitOrder', 'reserveInventory',
      'getOrder', 'getInventory', 'getProduct', 'getCustomer', 'getShipment'
    ];

    for (const method of requiredMethods) {
      if (typeof adapter[method] !== 'function') {
        throw new AdapterError(
          `Adapter missing required method: ${method}`,
          'INVALID_ADAPTER',
          { missingMethod: method }
        );
      }
    }

    Logger.debug('Adapter validation passed');
  }

  /**
   * Generate cache key for adapter configuration
   */
  private static getCacheKey(config: AdapterConfig): string {
    const keyParts: string[] = [config.type];

    switch (config.type) {
      case 'built-in':
        keyParts.push(config.name || 'unknown');
        break;
      case 'npm':
        keyParts.push(config.package || 'unknown');
        keyParts.push(config.exportName || 'default');
        break;
      case 'local':
        keyParts.push(path.resolve(config.path || 'unknown'));
        keyParts.push(config.exportName || 'default');
        break;
    }

    // Include options hash if present
    if (config.options) {
      keyParts.push(JSON.stringify(config.options));
    }

    return keyParts.join(':');
  }

  /**
   * List available built-in adapters
   */
  static getAvailableAdapters(): string[] {
    return Array.from(this.builtInAdapters.keys());
  }

  /**
   * Get existing adapter instance by config
   */
  static getInstance(config: AdapterConfig): IFulfillmentAdapter | undefined {
    const cacheKey = this.getCacheKey(config);
    return this.instances.get(cacheKey);
  }

  /**
   * Remove adapter instance from cache
   */
  static async removeInstance(config: AdapterConfig): Promise<void> {
    const cacheKey = this.getCacheKey(config);
    const adapter = this.instances.get(cacheKey);

    if (adapter) {
      try {
        await adapter.disconnect();
      } catch (error) {
        Logger.warn(`Failed to disconnect adapter during removal: ${cacheKey}`, error);
      }

      this.instances.delete(cacheKey);
      Logger.info(`Removed adapter instance: ${cacheKey}`);
    }
  }

  /**
   * Clear all adapter instances (for testing)
   */
  static async clearInstances(): Promise<void> {
    const disconnectPromises = Array.from(this.instances.values()).map(async (adapter) => {
      try {
        await adapter.disconnect();
      } catch (error) {
        Logger.warn('Failed to disconnect adapter during clear', error);
      }
    });

    await Promise.allSettled(disconnectPromises);
    this.instances.clear();
    Logger.info('Cleared all adapter instances');
  }
}

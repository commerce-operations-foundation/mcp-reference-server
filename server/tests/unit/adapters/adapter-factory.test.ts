/**
 * Unit tests for AdapterFactory
 */
import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import { AdapterFactory } from '../../../src/adapters/adapter-factory';
import { AdapterConfig } from '../../../src/types/adapter';

import { MockAdapter } from '../../../src/adapters/mock/mock-adapter';
import { Logger } from '../../../src/utils/logger';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tempDirs: string[] = [];

async function createTempModule(filename: string, contents: string): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'adapter-factory-'));
  tempDirs.push(dir);
  const filePath = path.join(dir, filename);
  await fs.writeFile(filePath, contents, 'utf8');
  return filePath;
}

async function removeTempResources(): Promise<void> {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
}

// Incomplete adapter for validation testing
class IncompleteAdapter {
  async connect(): Promise<void> {
    return Promise.resolve();
  }
  // Missing other required methods
}

describe('AdapterFactory', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await AdapterFactory.clearInstances();
  });

  afterEach(async () => {
    await AdapterFactory.clearInstances();
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await removeTempResources();
  });

  describe('Built-in Adapters', () => {
    it('should register built-in adapter', () => {
      expect(() => {
        AdapterFactory.registerBuiltInAdapter('mock', MockAdapter);
      }).not.toThrow();

      const available = AdapterFactory.getAvailableAdapters();
      expect(available).toContain('mock');
    });

    it('should create built-in adapter instance', async () => {
      AdapterFactory.registerBuiltInAdapter('mock', MockAdapter);

      const config: AdapterConfig = {
        type: 'built-in',
        name: 'mock',
      };

      const adapter = await AdapterFactory.createAdapter(config);
      expect(adapter).toBeInstanceOf(MockAdapter);
    });

    it('should return same instance for same config', async () => {
      AdapterFactory.registerBuiltInAdapter('mock', MockAdapter);

      const config: AdapterConfig = {
        type: 'built-in',
        name: 'mock',
      };

      const adapter1 = await AdapterFactory.createAdapter(config);
      const adapter2 = await AdapterFactory.createAdapter(config);

      expect(adapter1).toBe(adapter2);
    });

    it('should create new instance for different config', async () => {
      AdapterFactory.registerBuiltInAdapter('mock', MockAdapter);

      const config1: AdapterConfig = {
        type: 'built-in',
        name: 'mock',
        options: { setting: 'value1' },
      };

      const config2: AdapterConfig = {
        type: 'built-in',
        name: 'mock',
        options: { setting: 'value2' },
      };

      const adapter1 = await AdapterFactory.createAdapter(config1);
      const adapter2 = await AdapterFactory.createAdapter(config2);

      expect(adapter1).not.toBe(adapter2);
    });

    it('should throw error for unknown built-in adapter', async () => {
      const config: AdapterConfig = {
        type: 'built-in',
        name: 'unknown',
      };

      await expect(AdapterFactory.createAdapter(config)).rejects.toThrow('Built-in adapter not found: unknown');
    });

    it('should throw error for built-in adapter without name', async () => {
      const config: AdapterConfig = {
        type: 'built-in',
      };

      await expect(AdapterFactory.createAdapter(config)).rejects.toThrow('Built-in adapter requires name');
    });
  });

  describe('NPM Adapters', () => {
    it('should create NPM adapter instance', async () => {
      const packageName = 'virtual-npm-adapter';
      vi.doMock(packageName, () => ({
        default: MockAdapter,
      }));

      try {
        const config: AdapterConfig = {
          type: 'npm',
          package: packageName,
        };

        const adapter = await AdapterFactory.createAdapter(config);
        expect(adapter).toBeInstanceOf(MockAdapter);
      } finally {
        vi.unmock('virtual-npm-adapter');
        vi.resetModules();
      }
    });

    it('should throw error when NPM export is missing', async () => {
      const packageName = 'virtual-npm-missing-export';
      vi.doMock(packageName, () => ({}));

      try {
        const config: AdapterConfig = {
          type: 'npm',
          package: packageName,
          exportName: 'NotHere',
        };

        await expect(AdapterFactory.createAdapter(config)).rejects.toMatchObject({
          code: 'NPM_LOAD_ERROR',
          details: expect.objectContaining({
            message: expect.stringContaining('No "NotHere" export is defined'),
          }),
        });
      } finally {
        vi.unmock('virtual-npm-missing-export');
        vi.resetModules();
      }
    });

    it('should throw error when NPM export is not a constructor', async () => {
      const packageName = 'virtual-npm-invalid-constructor';
      vi.doMock(packageName, () => ({
        NotAClass: {},
      }));

      try {
        const config: AdapterConfig = {
          type: 'npm',
          package: packageName,
          exportName: 'NotAClass',
        };

        await expect(AdapterFactory.createAdapter(config)).rejects.toMatchObject({
          code: 'INVALID_CONSTRUCTOR',
        });
      } finally {
        vi.unmock('virtual-npm-invalid-constructor');
        vi.resetModules();
      }
    });

    it('should throw error for missing NPM package', async () => {
      const config: AdapterConfig = {
        type: 'npm',
        package: 'non-existent-package',
      };

      await expect(AdapterFactory.createAdapter(config)).rejects.toThrow(
        'Failed to load NPM adapter: non-existent-package'
      );
    });

    it('should throw error for NPM adapter without package name', async () => {
      const config: AdapterConfig = {
        type: 'npm',
      };

      await expect(AdapterFactory.createAdapter(config)).rejects.toThrow('NPM adapter requires package name');
    });
  });

  describe('Local Adapters', () => {
    it('should create local adapter instance', async () => {
      const filePath = await createTempModule(
        'local-adapter.mjs',
        `
          export default class LocalAdapter {
            async connect() {}
            async disconnect() {}
            async healthCheck() { return { status: 'healthy', checks: [] }; }
            async createSalesOrder() { return { success: true, order: { id: 'order' } }; }
            async cancelOrder() { return { success: true, order: { id: 'order' } }; }
            async updateOrder() { return { success: true, order: { id: 'order' } }; }
            async fulfillOrder() { return { success: true, fulfillment: { id: 'fulfillment' } }; }
            async getOrders() { return { success: true, orders: [] }; }
            async getInventory() { return { success: true, inventory: [] }; }
            async getProducts() { return { success: true, products: [] }; }
            async getProductVariants() { return { success: true, productVariants: [] }; }
            async getCustomers() { return { success: true, customers: [] }; }
            async getFulfillments() { return { success: true, fulfillments: [] }; }
          }
        `
      );

      const config: AdapterConfig = {
        type: 'local',
        path: filePath,
      };

      const adapter = await AdapterFactory.createAdapter(config);
      expect(adapter).toBeDefined();
      expect(typeof adapter.connect).toBe('function');
    });

    it('should throw error for directory path', async () => {
      const dirPath = await fs.mkdtemp(path.join(os.tmpdir(), 'adapter-factory-dir-'));
      tempDirs.push(dirPath);

      const config: AdapterConfig = {
        type: 'local',
        path: dirPath,
      };

      await expect(AdapterFactory.createAdapter(config)).rejects.toMatchObject({
        code: 'INVALID_ADAPTER_PATH',
      });
    });

    it('should throw error when local export is missing', async () => {
      const filePath = await createTempModule('missing-export.mjs', `export const somethingElse = {};`);

      const config: AdapterConfig = {
        type: 'local',
        path: filePath,
        exportName: 'default',
      };

      await expect(AdapterFactory.createAdapter(config)).rejects.toMatchObject({
        code: 'EXPORT_NOT_FOUND',
      });
    });

    it('should throw error when local export is not a constructor', async () => {
      const filePath = await createTempModule(
        'invalid-constructor.mjs',
        `export const defaultExport = {}; export { defaultExport as default };`
      );

      const config: AdapterConfig = {
        type: 'local',
        path: filePath,
      };

      await expect(AdapterFactory.createAdapter(config)).rejects.toMatchObject({
        code: 'INVALID_CONSTRUCTOR',
      });
    });

    it('should throw error for missing local file', async () => {
      const config: AdapterConfig = {
        type: 'local',
        path: './non-existent-file.js',
      };

      await expect(AdapterFactory.createAdapter(config)).rejects.toThrow('Local adapter file not found');
    });

    it('should throw error for local adapter without path', async () => {
      const config: AdapterConfig = {
        type: 'local',
      };

      await expect(AdapterFactory.createAdapter(config)).rejects.toThrow('Local adapter requires path');
    });
  });

  describe('Validation', () => {
    it('should validate adapter implements interface', async () => {
      AdapterFactory.registerBuiltInAdapter('mock', MockAdapter);

      const config: AdapterConfig = {
        type: 'built-in',
        name: 'mock',
      };

      // Should not throw
      await expect(AdapterFactory.createAdapter(config)).resolves.toBeDefined();
    });

    it('should reject invalid adapter', async () => {
      AdapterFactory.registerBuiltInAdapter('incomplete', IncompleteAdapter as any);

      const config: AdapterConfig = {
        type: 'built-in',
        name: 'incomplete',
      };

      await expect(AdapterFactory.createAdapter(config)).rejects.toThrow('Adapter missing required method');
    });
  });

  describe('Instance Management', () => {
    it('should get existing adapter instance', async () => {
      AdapterFactory.registerBuiltInAdapter('mock', MockAdapter);

      const config: AdapterConfig = {
        type: 'built-in',
        name: 'mock',
      };

      const adapter = await AdapterFactory.createAdapter(config);
      const retrieved = AdapterFactory.getInstance(config);

      expect(retrieved).toBe(adapter);
    });

    it('should return undefined for non-existent instance', () => {
      const config: AdapterConfig = {
        type: 'built-in',
        name: 'nonexistent',
      };

      const retrieved = AdapterFactory.getInstance(config);
      expect(retrieved).toBeUndefined();
    });

    it('should remove adapter instance', async () => {
      AdapterFactory.registerBuiltInAdapter('mock', MockAdapter);

      const config: AdapterConfig = {
        type: 'built-in',
        name: 'mock',
      };

      const adapter = await AdapterFactory.createAdapter(config);
      expect(AdapterFactory.getInstance(config)).toBe(adapter);

      await AdapterFactory.removeInstance(config);
      expect(AdapterFactory.getInstance(config)).toBeUndefined();
    });

    it('should clear all instances', async () => {
      AdapterFactory.registerBuiltInAdapter('mock', MockAdapter);

      const config1: AdapterConfig = {
        type: 'built-in',
        name: 'mock',
        options: { id: 1 },
      };

      const config2: AdapterConfig = {
        type: 'built-in',
        name: 'mock',
        options: { id: 2 },
      };

      await AdapterFactory.createAdapter(config1);
      await AdapterFactory.createAdapter(config2);

      expect(AdapterFactory.getInstance(config1)).toBeDefined();
      expect(AdapterFactory.getInstance(config2)).toBeDefined();

      await AdapterFactory.clearInstances();

      expect(AdapterFactory.getInstance(config1)).toBeUndefined();
      expect(AdapterFactory.getInstance(config2)).toBeUndefined();
    });

    it('should remove adapter instance even if disconnect fails', async () => {
      class FaultyDisconnectAdapter extends MockAdapter {
        async disconnect(): Promise<void> {
          throw new Error('disconnect failure');
        }
      }

      const warnSpy = vi.spyOn(Logger, 'warn').mockImplementation(() => {});

      try {
        AdapterFactory.registerBuiltInAdapter('faulty', FaultyDisconnectAdapter as any);

        const config: AdapterConfig = {
          type: 'built-in',
          name: 'faulty',
        };

        await AdapterFactory.createAdapter(config);

        await expect(AdapterFactory.removeInstance(config)).resolves.toBeUndefined();
        expect(AdapterFactory.getInstance(config)).toBeUndefined();
        expect(warnSpy).toHaveBeenCalled();
      } finally {
        warnSpy.mockRestore();
      }
    });

    it('should clear instances even when disconnect rejects', async () => {
      class RejectingAdapter extends MockAdapter {
        constructor() {
          super({});
        }

        async disconnect(): Promise<void> {
          throw new Error('disconnect failed');
        }
      }

      const warnSpy = vi.spyOn(Logger, 'warn').mockImplementation(() => {});

      try {
        AdapterFactory.registerBuiltInAdapter('rejecting', RejectingAdapter as any);

        const config1: AdapterConfig = {
          type: 'built-in',
          name: 'rejecting',
          options: { id: 1 },
        };

        const config2: AdapterConfig = {
          type: 'built-in',
          name: 'rejecting',
          options: { id: 2 },
        };

        await AdapterFactory.createAdapter(config1);
        await AdapterFactory.createAdapter(config2);

        await AdapterFactory.clearInstances();

        expect(AdapterFactory.getInstance(config1)).toBeUndefined();
        expect(AdapterFactory.getInstance(config2)).toBeUndefined();
        expect(warnSpy).toHaveBeenCalled();
      } finally {
        warnSpy.mockRestore();
      }
    });
  });

  describe('Mock Adapter', () => {
    it('should create mock adapter', async () => {
      const config: AdapterConfig = {
        type: 'built-in',
        name: 'mock',
      };

      const mockAdapter = await AdapterFactory.createAdapter(config);
      expect(mockAdapter).toBeDefined();
    });

    it('should have working connect/disconnect/healthCheck', async () => {
      const config: AdapterConfig = {
        type: 'built-in',
        name: 'mock',
      };

      const mockAdapter = await AdapterFactory.createAdapter(config);

      await expect(mockAdapter.connect()).resolves.toBeUndefined();

      const health = await mockAdapter.healthCheck();
      expect(health.status).toBe('healthy');
      expect(health.checks).toBeDefined();

      await expect(mockAdapter.disconnect()).resolves.toBeUndefined();
    });

    it('should have working order methods', async () => {
      const config: AdapterConfig = {
        type: 'built-in',
        name: 'mock',
      };

      const mockAdapter = await AdapterFactory.createAdapter(config);

      // Test that the adapter methods work correctly
      await mockAdapter.connect();

      const orderResult = await mockAdapter.createSalesOrder({
        order: {
          lineItems: [{ id: 'li-1', sku: 'TEST', quantity: 1 }],
        },
      } as any);

      expect(orderResult).toBeDefined();
      expect(orderResult.success).toBe(true);
      if (orderResult.success) {
        expect(orderResult.order).toBeDefined();
      }
    });
  });

  describe('Error Handling', () => {
    it('should throw error for unknown adapter type', async () => {
      const config = {
        type: 'unknown',
      } as any;

      await expect(AdapterFactory.createAdapter(config)).rejects.toThrow('Unknown adapter type: unknown');
    });

    it('should handle adapter creation errors gracefully', async () => {
      class ErrorAdapter {
        constructor() {
          throw new Error('Constructor error');
        }
      }

      AdapterFactory.registerBuiltInAdapter('error', ErrorAdapter as any);

      const config: AdapterConfig = {
        type: 'built-in',
        name: 'error',
      };

      await expect(AdapterFactory.createAdapter(config)).rejects.toThrow('Constructor error');
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate different cache keys for different configs', async () => {
      AdapterFactory.registerBuiltInAdapter('mock', MockAdapter);

      const config1: AdapterConfig = {
        type: 'built-in',
        name: 'mock',
      };

      const config2: AdapterConfig = {
        type: 'built-in',
        name: 'mock',
        options: { test: true },
      };

      const adapter1 = await AdapterFactory.createAdapter(config1);
      const adapter2 = await AdapterFactory.createAdapter(config2);

      expect(adapter1).not.toBe(adapter2);
    });

    it('should generate same cache key for equivalent configs', async () => {
      AdapterFactory.registerBuiltInAdapter('mock', MockAdapter);

      const config1: AdapterConfig = {
        type: 'built-in',
        name: 'mock',
        options: { a: 1, b: 2 },
      };

      const config2: AdapterConfig = {
        type: 'built-in',
        name: 'mock',
        options: { a: 1, b: 2 },
      };

      const adapter1 = await AdapterFactory.createAdapter(config1);
      const adapter2 = await AdapterFactory.createAdapter(config2);

      expect(adapter1).toBe(adapter2);
    });

    it('should differentiate cache keys by NPM export name', () => {
      const getCacheKey = (AdapterFactory as any).getCacheKey.bind(AdapterFactory);
      const baseConfig: AdapterConfig = {
        type: 'npm',
        package: 'pkg',
      };

      const defaultKey = getCacheKey(baseConfig);
      const namedKey = getCacheKey({ ...baseConfig, exportName: 'Named' });

      expect(defaultKey).not.toBe(namedKey);
    });

    it('should resolve local paths in cache key', () => {
      const getCacheKey = (AdapterFactory as any).getCacheKey.bind(AdapterFactory);
      const relativePath = './relative/local-adapter.js';
      const key = getCacheKey({
        type: 'local',
        path: relativePath,
      } as AdapterConfig);

      expect(key).toContain(path.resolve(relativePath));
    });

    it('should include options serialization in cache key', () => {
      const getCacheKey = (AdapterFactory as any).getCacheKey.bind(AdapterFactory);
      const configA: AdapterConfig = {
        type: 'built-in',
        name: 'mock',
        options: { a: 1, b: 2 },
      };

      const configB: AdapterConfig = {
        type: 'built-in',
        name: 'mock',
        options: { a: 2, b: 1 },
      };

      expect(getCacheKey(configA)).not.toBe(getCacheKey(configB));
    });
  });
});

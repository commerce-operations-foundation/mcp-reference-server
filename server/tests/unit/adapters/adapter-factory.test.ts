/**
 * Unit tests for AdapterFactory
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AdapterFactory } from '../../../src/adapters/adapter-factory';
import {
  IFulfillmentAdapter,
  AdapterConfig,
  OrderResult,
  FulfillmentToolResult,
} from '../../../src/types/adapter';
import type {
  Order,
  Inventory,
  Product,
  ProductVariant,
  Customer,
  Fulfillment,
} from '../../../src/schemas/index';

// Mock adapter class for testing - minimal implementation with proper types
class MockFulfillmentAdapter implements IFulfillmentAdapter {
  constructor(_config: AdapterConfig) {}

  async connect(): Promise<void> {
    return Promise.resolve();
  }

  async disconnect(): Promise<void> {
    return Promise.resolve();
  }

  async healthCheck() {
    return {
      status: 'healthy' as const,
      timestamp: new Date().toISOString(),
      checks: [],
    };
  }

  async createSalesOrder(): Promise<OrderResult> {
    return {
      success: true,
      order: {
        id: 'test-order',
        externalId: 'ext-123',
        lineItems: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tenantId: 'test-tenant',
      } as Order,
    };
  }

  async cancelOrder(): Promise<OrderResult> {
    return {
      success: true,
      order: {
        id: 'test-order',
        externalId: 'ext-123',
        lineItems: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tenantId: 'test-tenant',
      } as Order,
    };
  }

  async updateOrder(): Promise<OrderResult> {
    return {
      success: true,
      order: {
        id: 'test-order',
        externalId: 'ext-123',
        lineItems: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tenantId: 'test-tenant',
      } as Order,
    };
  }

  async fulfillOrder(): Promise<FulfillmentToolResult<{ fulfillment: Fulfillment }>> {
    return {
      success: true,
      fulfillment: {
        id: 'fulfillment-123',
        externalId: 'ext-fulfillment-123',
        orderId: 'test-order',
        lineItems: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tenantId: 'test-tenant',
      } as Fulfillment,
    };
  }

  async getOrders(): Promise<FulfillmentToolResult<{ orders: Order[] }>> {
    return {
      success: true,
      orders: [
        {
          id: 'test-order',
          externalId: 'ext-123',
          lineItems: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tenantId: 'test-tenant',
        } as Order,
      ],
    };
  }

  async getInventory(): Promise<FulfillmentToolResult<{ inventory: Inventory[] }>> {
    return {
      success: true,
      inventory: [
        {
          id: 'inv-123',
          externalId: 'ext-inv-123',
          sku: 'test-sku',
          locationId: 'loc-123',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tenantId: 'test-tenant',
        } as Inventory,
      ],
    };
  }

  async getProducts(): Promise<FulfillmentToolResult<{ products: Product[] }>> {
    return {
      success: true,
      products: [
        {
          id: 'prod-123',
          externalId: 'ext-prod-123',
          name: 'Test Product',
          options: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tenantId: 'test-tenant',
        } as Product,
      ],
    };
  }

  async getProductVariants(): Promise<FulfillmentToolResult<{ productVariants: ProductVariant[] }>> {
    return {
      success: true,
      productVariants: [
        {
          id: 'variant-123',
          externalId: 'ext-variant-123',
          productId: 'prod-123',
          sku: 'test-sku',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tenantId: 'test-tenant',
        } as ProductVariant,
      ],
    };
  }

  async getCustomers(): Promise<FulfillmentToolResult<{ customers: Customer[] }>> {
    return {
      success: true,
      customers: [
        {
          id: 'cust-123',
          externalId: 'ext-cust-123',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tenantId: 'test-tenant',
        } as Customer,
      ],
    };
  }

  async getFulfillments(): Promise<FulfillmentToolResult<{ fulfillments: Fulfillment[] }>> {
    return {
      success: true,
      fulfillments: [
        {
          id: 'fulfillment-123',
          externalId: 'ext-fulfillment-123',
          orderId: 'test-order',
          lineItems: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tenantId: 'test-tenant',
        } as Fulfillment,
      ],
    };
  }
}

// Incomplete adapter for validation testing
class IncompleteAdapter {
  async connect(): Promise<void> {
    return Promise.resolve();
  }
  // Missing other required methods
}

describe('AdapterFactory', () => {
  beforeEach(() => {
    AdapterFactory.clearInstances();
  });

  afterEach(() => {
    AdapterFactory.clearInstances();
  });

  describe('Built-in Adapters', () => {
    it('should register built-in adapter', () => {
      expect(() => {
        AdapterFactory.registerBuiltInAdapter('mock', MockFulfillmentAdapter);
      }).not.toThrow();

      const available = AdapterFactory.getAvailableAdapters();
      expect(available).toContain('mock');
    });

    it('should create built-in adapter instance', async () => {
      AdapterFactory.registerBuiltInAdapter('mock', MockFulfillmentAdapter);

      const config: AdapterConfig = {
        type: 'built-in',
        name: 'mock',
      };

      const adapter = await AdapterFactory.createAdapter(config);
      expect(adapter).toBeInstanceOf(MockFulfillmentAdapter);
    });

    it('should return same instance for same config', async () => {
      AdapterFactory.registerBuiltInAdapter('mock', MockFulfillmentAdapter);

      const config: AdapterConfig = {
        type: 'built-in',
        name: 'mock',
      };

      const adapter1 = await AdapterFactory.createAdapter(config);
      const adapter2 = await AdapterFactory.createAdapter(config);

      expect(adapter1).toBe(adapter2);
    });

    it('should create new instance for different config', async () => {
      AdapterFactory.registerBuiltInAdapter('mock', MockFulfillmentAdapter);

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
      AdapterFactory.registerBuiltInAdapter('mock', MockFulfillmentAdapter);

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
      AdapterFactory.registerBuiltInAdapter('mock', MockFulfillmentAdapter);

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
      AdapterFactory.registerBuiltInAdapter('mock', MockFulfillmentAdapter);

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
      AdapterFactory.registerBuiltInAdapter('mock', MockFulfillmentAdapter);

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
      await expect(mockAdapter.disconnect()).resolves.toBeUndefined();

      const health = await mockAdapter.healthCheck();
      expect(health.status).toBe('healthy');
      expect(health.checks).toBeDefined();
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
      AdapterFactory.registerBuiltInAdapter('mock', MockFulfillmentAdapter);

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
      AdapterFactory.registerBuiltInAdapter('mock', MockFulfillmentAdapter);

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
  });
});

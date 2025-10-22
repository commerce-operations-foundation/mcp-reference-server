/**
 * Unit tests for Mock Adapter
 * Task 11: Comprehensive testing of mock adapter functionality
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MockAdapter } from '../../../src/adapters/mock/mock-adapter';
import type { CreateSalesOrderInput, UpdateOrderInput } from '../../../src/schemas/index';

describe('MockAdapter', () => {
  let adapter: MockAdapter;

  beforeEach(() => {
    adapter = new MockAdapter({
      fixedLatency: 0, // No delay in tests
      errorRate: 0, // No random errors in tests
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Lifecycle Methods', () => {
    it('should initialize without connection', async () => {
      const healthStatus = await adapter.healthCheck();
      expect(healthStatus.status).toBe('unhealthy');
      expect(healthStatus.checks).toHaveLength(3);
    });

    it('should connect successfully', async () => {
      await adapter.connect();
      const healthStatus = await adapter.healthCheck();
      expect(healthStatus.status).toBe('healthy');
    });

    it('should disconnect successfully', async () => {
      await adapter.connect();
      await adapter.disconnect();
      const healthStatus = await adapter.healthCheck();
      expect(healthStatus.status).toBe('unhealthy');
    });

    it('should provide detailed health check', async () => {
      await adapter.connect();
      const healthStatus = await adapter.healthCheck();

      expect(healthStatus).toHaveProperty('status', 'healthy');
      expect(healthStatus).toHaveProperty('timestamp');
      expect(healthStatus.checks).toHaveLength(3);

      const connectionCheck = healthStatus.checks?.find((c) => c.name === 'connection');
      expect(connectionCheck?.status).toBe('pass');

      const dataCheck = healthStatus.checks?.find((c) => c.name === 'data_store');
      expect(dataCheck?.status).toBe('pass');

      const configCheck = healthStatus.checks?.find((c) => c.name === 'configuration');
      expect(configCheck?.status).toBe('pass');
    });
  });

  describe('Order Actions', () => {
    beforeEach(async () => {
      await adapter.connect();
    });

    describe('createSalesOrder', () => {
      it('should create order successfully', async () => {
        const orderRequest: CreateSalesOrderInput = {
          order: {
            externalId: 'EXT-123',
            lineItems: [
              {
                id: 'line_001',
                sku: 'TEST-001',
                quantity: 2,
                unitPrice: 50.0,
                totalPrice: 100.0,
              },
            ],
            billingAddress: {
              address1: '123 Test St',
              city: 'Test City',
              country: 'US',
              company: 'Test Co',
              email: 'test@example.com',
              firstName: 'John',
            },
            shippingAddress: {
              address1: '123 Test St',
              city: 'Test City',
              country: 'US',
              company: 'Test Co',
              email: 'test@example.com',
              firstName: 'John',
            },
          },
        };

        const result = await adapter.createSalesOrder(orderRequest);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.order.id).toBeDefined();
          expect(result.order.status).toBe('confirmed');
          expect(result.order.createdAt).toBeDefined();
        }
      });

      it('should calculate totals correctly', async () => {
        const orderRequest: CreateSalesOrderInput = {
          order: {
            externalId: 'EXT-124',
            lineItems: [
              {
                id: 'line_001',
                sku: 'TEST-002',
                quantity: 1,
                unitPrice: 50.0,
                totalPrice: 50.0,
              },
            ],
            billingAddress: {
              address1: '456 Test Ave',
              city: 'Test City',
              country: 'US',
              company: 'Test Co',
              email: 'test@example.com',
              firstName: 'Jane',
            },
            shippingAddress: {
              address1: '456 Test Ave',
              city: 'Test City',
              country: 'US',
              company: 'Test Co',
              email: 'test@example.com',
              firstName: 'Jane',
            },
          },
        };

        const result = await adapter.createSalesOrder(orderRequest);

        // Verify order totals from result
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.order.subTotalPrice).toBe(50.0);
          expect(result.order.orderTax).toBe(4.0); // 8% of subtotal
          expect(result.order.shippingPrice).toBe(10.0); // Shipping fee for orders under $100
          expect(result.order.totalPrice).toBe(64.0);
        }
      });

      it('should throw error when not connected', async () => {
        await adapter.disconnect();

        const orderRequest: CreateSalesOrderInput = {
          order: {
            externalId: 'EXT-125',
            lineItems: [],
            billingAddress: {
              address1: '789 Test Blvd',
              city: 'Test City',
              country: 'US',
              company: 'Test Co',
              email: 'test@example.com',
              firstName: 'Bob',
            },
            shippingAddress: {
              address1: '789 Test Blvd',
              city: 'Test City',
              country: 'US',
              company: 'Test Co',
              email: 'test@example.com',
              firstName: 'Bob',
            },
          },
        };

        await expect(adapter.createSalesOrder(orderRequest)).rejects.toThrow('Adapter not connected');
      });
    });

    describe('cancelOrder', () => {
      let orderId: string;

      beforeEach(async () => {
        const orderRequest: CreateSalesOrderInput = {
          order: {
            externalId: 'EXT-CANCEL',
            lineItems: [
              {
                id: 'line_cancel',
                sku: 'CANCEL-001',
                quantity: 1,
                unitPrice: 100.0,
                totalPrice: 100.0,
              },
            ],
            billingAddress: {
              address1: '123 Cancel St',
              city: 'Cancel City',
              country: 'US',
              company: 'Test Co',
              email: 'test@example.com',
              firstName: 'Cancel',
            },
            shippingAddress: {
              address1: '123 Cancel St',
              city: 'Cancel City',
              country: 'US',
              company: 'Test Co',
              email: 'test@example.com',
              firstName: 'Cancel',
            },
          },
        };

        const result = await adapter.createSalesOrder(orderRequest);
        if (result.success) {
          orderId = result.order.id;
        }
      });

      it('should cancel order successfully', async () => {
        const result = await adapter.cancelOrder({ orderId, reason: 'Customer request' });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.order.id).toBe(orderId);
          expect(result.order.status).toBe('cancelled');
        }
      });

      it('should throw error for non-existent order', async () => {
        await expect(adapter.cancelOrder({ orderId: 'invalid-order-id' })).rejects.toThrow();
      });
    });

    describe('updateOrder', () => {
      let orderId: string;

      beforeEach(async () => {
        const orderRequest: CreateSalesOrderInput = {
          order: {
            externalId: 'EXT-UPDATE',
            lineItems: [
              {
                id: 'line_update',
                sku: 'UPDATE-001',
                quantity: 1,
                unitPrice: 75.0,
                totalPrice: 75.0,
              },
            ],
            billingAddress: {
              address1: '123 Update St',
              city: 'Update City',
              country: 'US',
              company: 'Test Co',
              email: 'test@example.com',
              firstName: 'Update',
            },
            shippingAddress: {
              address1: '123 Update St',
              city: 'Update City',
              country: 'US',
              company: 'Test Co',
              email: 'test@example.com',
              firstName: 'Update',
            },
          },
        };

        const result = await adapter.createSalesOrder(orderRequest);
        if (result.success) {
          orderId = result.order.id;
        }
      });

      it('should update order successfully', async () => {
        const updates: UpdateOrderInput = {
          id: orderId,
          updates: {
            orderNote: 'Updated note',
          },
        };

        const result = await adapter.updateOrder(updates);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.order.id).toBe(orderId);
        }
      });

      it('should throw error for non-existent order', async () => {
        await expect(adapter.updateOrder({ id: 'invalid-order-id', updates: { orderNote: 'Test' } })).rejects.toThrow();
      });
    });
  });

  describe('Query Operations', () => {
    beforeEach(async () => {
      await adapter.connect();
    });

    describe('getInventory', () => {
      it('should retrieve inventory for SKUs', async () => {
        const result = await adapter.getInventory({ skus: ['WID-001'] });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.inventory).toBeDefined();
          expect(result.inventory.length).toBeGreaterThan(0);
          expect(result.inventory[0].sku).toBe('WID-001');
        }
      });
    });
  });

  describe('Error Simulation', () => {
    it('should simulate connection errors when configured', async () => {
      const errorAdapter = new MockAdapter({
        fixedLatency: 0,
        operationErrors: { connect: 1.0 }, // 100% error rate for connect
      });

      await expect(errorAdapter.connect()).rejects.toThrow('Mock error: Connection failed');
    });
  });

  describe('Configuration', () => {
    it('should respect latency configuration', async () => {
      const slowAdapter = new MockAdapter({
        fixedLatency: 100,
        errorRate: 0,
      });

      await slowAdapter.connect();

      const start = Date.now();
      await slowAdapter.getProducts({ skus: ['TEST'] });
      const duration = Date.now() - start;

      expect(duration).toBeGreaterThanOrEqual(100);
    });

    it('should provide configuration summary in health check', async () => {
      const configAdapter = new MockAdapter({
        fixedLatency: 50,
        errorRate: 0.05,
        dataSize: 500,
        operationErrors: { connect: 0 }, // Ensure connect doesn't fail for this test
      });

      await configAdapter.connect();
      const health = await configAdapter.healthCheck();

      expect(health.checks).toBeDefined();
      const configCheck = health.checks?.find((c) => c.name === 'configuration');
      expect(configCheck?.details).toHaveProperty('latency', 'fixed 50ms');
      expect(configCheck?.details).toHaveProperty('errorRate', '5%');
    });
  });
});

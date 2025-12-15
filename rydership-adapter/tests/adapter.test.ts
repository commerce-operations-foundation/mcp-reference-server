/**
 * Unit tests for YourFulfillment Adapter
 *
 * These tests demonstrate how to test your adapter implementation.
 * Replace with actual tests for your Fulfillment integration.
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { RydershipAdapter } from '../src/adapter.js';
import { ApiClient } from '../src/utils/api-client.js';
import type {
  CreateSalesOrderInput,
  CancelOrderInput,
  UpdateOrderInput,
  GetOrdersInput,
  GetInventoryInput,
} from '@cof-org/mcp';
import fs from 'fs';
import path from 'path';
import { RydershipOrder } from '../src/types';


describe('RydershipAdapter', () => {
  let adapter: RydershipAdapter;
  let mockApiClient: ApiClient;
  let getSpy: jest.MockedFunction<any>;
  let postSpy: jest.MockedFunction<any>;
  let patchSpy: jest.MockedFunction<any>;

  beforeEach(() => {
    // Create adapter instance
    adapter = new RydershipAdapter({
      apiUrl: 'https://api.test.yourfulfillment.com',
      apiKey: 'test-api-key',
      workspace: 'test-workspace',
      timeout: 5000,
      debugMode: false,
    });

    // Get mocked API client
    mockApiClient = (adapter as any).client;
    getSpy = jest.spyOn(mockApiClient, 'get') as unknown as jest.MockedFunction<any>;
    postSpy = jest.spyOn(mockApiClient, 'post') as unknown as jest.MockedFunction<any>;
    patchSpy = jest.spyOn(mockApiClient, 'patch') as unknown as jest.MockedFunction<any>;
  });
  

    // Helper to load fixture JSON
    function loadFixture(name: string) {
      const filePath = path.resolve(__dirname, 'fixtures/v2', name);
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }

  describe('Lifecycle Methods', () => {
    describe('connect', () => {
      it('should connect successfully when API is healthy', async () => {
        getSpy.mockResolvedValue({
          success: true,
          data: { status: 'healthy' },
        });
  
    describe('Transformation Logic', () => {
      it('should transform a shipped order fixture to MCP Order shape', () => {
        const orderFixture = loadFixture('order.shipped.json') as RydershipOrder;
        // @ts-ignore: access private for test
        const mcpOrder = adapter.transformToOrder(orderFixture);
        expect(mcpOrder).toBeDefined();
        expect(mcpOrder.status).toBe('Shipped');
        expect(mcpOrder.lineItems).toBeInstanceOf(Array);
        expect(mcpOrder.shippingAddress).toBeDefined();
        expect(mcpOrder.customer).toBeDefined();
        expect(mcpOrder.id).toBeDefined();
        // Add more assertions as needed for mapped fields
      });
  
      it('should transform a product fixture to MCP Product shape', () => {
        // You can add a product fixture and test here if available
        // Example:
        // const productFixture = loadFixture('product.json') as RydershipProduct;
        // @ts-ignore: access private for test
        // const mcpProduct = adapter.transformToProduct(productFixture);
        // expect(mcpProduct).toBeDefined();
      });
    });

        await expect(adapter.connect()).resolves.not.toThrow();
        expect(getSpy).toHaveBeenCalledWith('/health');
      });

      it('should throw error when API is unreachable', async () => {
    // ...existing code for lifecycle, order actions, query operations, and error handling...
        getSpy.mockResolvedValue({
          success: false,
          error: { code: 'CONNECTION_FAILED', message: 'Connection failed' },
        });

        await expect(adapter.connect()).rejects.toThrow('Connection failed');
      });
    });

    describe('disconnect', () => {
      it('should disconnect successfully', async () => {
        await expect(adapter.disconnect()).resolves.not.toThrow();
      });
    });

    describe('healthCheck', () => {
      it('should return healthy status when API is working', async () => {
        getSpy.mockResolvedValue({
          success: true,
          data: { status: 'operational' },
        });

        const result = await adapter.healthCheck();

        expect(result.status).toBe('healthy');
        expect(result.checks).toHaveLength(2);
        expect(result.checks?.[0]?.status).toBe('pass');
      });

      it('should return unhealthy status when API fails', async () => {
        getSpy.mockRejectedValue(new Error('Network error'));

        const result = await adapter.healthCheck();

        expect(result.status).toBe('unhealthy');
        expect(result.checks?.[0]?.status).toBe('fail');
      });
    });
  });

  describe('Order Actions', () => {
    describe('createSalesOrder', () => {
      const validOrderInput: CreateSalesOrderInput = {
        order: {
          lineItems: [
            {
              sku: 'PROD-001',
              quantity: 2,
              unitPrice: 29.99,
              name: 'Test Product',
            },
          ],
          customer: {
            id: 'CUST-001',
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            phone: '+1234567890',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            tenantId: 'test-tenant',
          },
          shippingAddress: {
            firstName: 'John',
            lastName: 'Doe',
            address1: '123 Main St',
            address2: 'Apt 4',
            city: 'New York',
            stateOrProvince: 'NY',
            zipCodeOrPostalCode: '10001',
            country: 'US',
            phone: '+1234567890',
          },
          billingAddress: {
            firstName: 'John',
            lastName: 'Doe',
            address1: '123 Main St',
            address2: 'Apt 4',
            city: 'New York',
            stateOrProvince: 'NY',
            zipCodeOrPostalCode: '10001',
            country: 'US',
            phone: '+1234567890',
          },
          totalPrice: 57.48,
          currency: 'USD',
          orderNote: 'Please handle with care',
          orderSource: 'website',
          name: 'ORD-2024-001',
          status: 'pending',
        },
      };

      it('should create sales order successfully', async () => {
        postSpy.mockResolvedValue({
          success: true,
          data: {
            id: 'ORDER-001',
            number: 'ORD-2024-001',
            external_id: 'EXT-001',
            status: 'new',
            customer: {
              id: 'CUST-001',
              email: 'test@example.com',
              first_name: 'John',
              last_name: 'Doe',
            },
            items: [
              {
                sku: 'PROD-001',
                name: 'Test Product',
                quantity: 2,
                price: 29.99,
                subtotal: 59.98,
              },
            ],
            total: 57.48,
            currency: 'USD',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            shipping_address: {},
            billing_address: {},
          },
        });

        const result = await adapter.createSalesOrder(validOrderInput);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.order.id).toBe('ORDER-001');
          expect(result.order.name).toBe('ORD-2024-001');
          expect(result.order.status).toBeDefined();
        }
        expect(postSpy).toHaveBeenCalledWith('/orders', expect.any(Object));
      });

      it('should handle order creation failure', async () => {
        postSpy.mockResolvedValue({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid order data',
          },
        });

        const result = await adapter.createSalesOrder(validOrderInput);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBeDefined();
        }
      });
    });

    describe('cancelOrder', () => {
      it('should cancel order successfully', async () => {
        postSpy.mockResolvedValue({
          success: true,
          data: {
            id: 'ORDER-001',
            number: 'ORD-2024-001',
            external_id: 'EXT-001',
            status: 'cancelled',
            customer: {
              id: 'CUST-001',
              email: 'test@example.com',
              first_name: 'John',
              last_name: 'Doe',
            },
            items: [],
            total: 100.0,
            currency: 'USD',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            shipping_address: {},
            billing_address: {},
          },
        });

        const input: CancelOrderInput = {
          orderId: 'ORDER-001',
          reason: 'Customer request',
          notifyCustomer: true,
        };

        const result = await adapter.cancelOrder(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.order.id).toBe('ORDER-001');
          expect(result.order.status).toBe('cancelled');
        }
      });

      it('should handle cancellation failure', async () => {
        postSpy.mockResolvedValue({
          success: false,
          error: {
            code: 'ORDER_NOT_FOUND',
            message: 'Order not found',
          },
        });

        const input: CancelOrderInput = {
          orderId: 'INVALID-ID',
        };

        const result = await adapter.cancelOrder(input);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBeDefined();
        }
      });
    });

    describe('updateOrder', () => {
      it('should update order successfully', async () => {
        patchSpy.mockResolvedValue({
          success: true,
          data: {
            id: 'ORDER-001',
            number: 'ORD-2024-001',
            external_id: 'EXT-001',
            status: 'processing',
            customer: {
              id: 'CUST-001',
              email: 'test@example.com',
              first_name: 'Jane',
              last_name: 'Smith',
            },
            items: [],
            total: 100.0,
            currency: 'USD',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
            shipping_address: {
              street1: '456 Oak Ave',
              city: 'Los Angeles',
              state: 'CA',
              postal_code: '90001',
              country: 'US',
            },
            billing_address: {},
          },
        });

        const input: UpdateOrderInput = {
          id: 'ORDER-001',
          updates: {
            status: 'processing',
            shippingAddress: {
              firstName: 'Jane',
              lastName: 'Smith',
              address1: '456 Oak Ave',
              city: 'Los Angeles',
              stateOrProvince: 'CA',
              zipCodeOrPostalCode: '90001',
              country: 'US',
            },
          },
        };

        const result = await adapter.updateOrder(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.order.id).toBe('ORDER-001');
          expect(result.order.status).toBe('processing');
        }
      });
    });
  });

  describe('Query Operations', () => {
    describe('getOrders', () => {
      it('should get orders by IDs', async () => {
        getSpy.mockResolvedValue({
          success: true,
          data: [
            {
              id: 'ORDER-001',
              number: 'ORD-2024-001',
              external_id: 'EXT-001',
              status: 'processing',
              customer: {
                id: 'CUST-001',
                email: 'test@example.com',
                first_name: 'John',
                last_name: 'Doe',
              },
              items: [],
              total: 100.0,
              currency: 'USD',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
              shipping_address: {},
              billing_address: {},
            },
          ],
        });

        const input: GetOrdersInput = {
          ids: ['ORDER-001'],
        };

        const result = await adapter.getOrders(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.orders).toHaveLength(1);
          expect(result.orders[0]?.id).toBe('ORDER-001');
          expect(result.orders[0]?.status).toBe('processing');
        }
        expect(getSpy).toHaveBeenCalledWith('/orders', expect.any(Object));
      });

      it('should get orders by external IDs', async () => {
        getSpy.mockResolvedValue({
          success: true,
          data: [
            {
              id: 'ORDER-001',
              number: 'ORD-2024-001',
              external_id: 'EXT-001',
              status: 'processing',
              customer: {
                id: 'CUST-001',
                email: 'test@example.com',
                first_name: 'John',
                last_name: 'Doe',
              },
              items: [],
              total: 100.0,
              currency: 'USD',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
              shipping_address: {},
              billing_address: {},
            },
          ],
        });

        const input: GetOrdersInput = {
          externalIds: ['EXT-001'],
        };

        const result = await adapter.getOrders(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.orders).toHaveLength(1);
          expect(result.orders[0]?.externalId).toBe('EXT-001');
        }
      });

      it('should handle empty results', async () => {
        getSpy.mockResolvedValue({
          success: true,
          data: [],
        });

        const input: GetOrdersInput = {
          ids: ['NON-EXISTENT'],
        };

        const result = await adapter.getOrders(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.orders).toHaveLength(0);
        }
      });
    });
    
    // TODO
    // describe('getInventory', () => {
    //   it('should get inventory for SKUs', async () => {
    //     getSpy.mockResolvedValue({
    //       success: true,
    //       data: [
    //         {
    //           sku: 'PROD-001',
    //           available: 100,
    //           reserved: 10,
    //           total: 110,
    //           warehouse_locations: [
    //             { location_id: 'LOC-001', available: 60, reserved: 5 },
    //             { location_id: 'LOC-002', available: 40, reserved: 5 },
    //           ],
    //           updated_at: '2024-01-01T00:00:00Z',
    //         },
    //       ],
    //     });

    //     const input: GetInventoryInput = {
    //       skus: ['PROD-001'],
    //     };

    //     const result = await adapter.getInventory(input);

    //     expect(result.success).toBe(true);
    //     if (result.success) {
    //       expect(result.inventory.length).toBeGreaterThan(0);
    //       expect(result.inventory[0]?.sku).toBe('PROD-001');
    //       expect(result.inventory[0]?.available).toBe(60);
    //       expect(result.inventory[0]?.locationId).toBe('LOC-001');
    //     }
    //   });

    //   it('should handle inventory lookup failure', async () => {
    //     getSpy.mockResolvedValue({
    //       success: false,
    //       error: {
    //         code: 'NOT_FOUND',
    //         message: 'SKU not found',
    //       },
    //     });

    //     const input: GetInventoryInput = {
    //       skus: ['INVALID-SKU'],
    //     };

    //     const result = await adapter.getInventory(input);

    //     expect(result.success).toBe(false);
    //     if (!result.success) {
    //       expect(result.error).toBeDefined();
    //     }
    //   });
    // });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      getSpy.mockRejectedValue(new Error('Network timeout'));

      const input: GetOrdersInput = { ids: ['ORDER-001'] };
      const result = await adapter.getOrders(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it('should handle API errors with proper error codes', async () => {
      postSpy.mockResolvedValue({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests',
        },
      });

      const input: CreateSalesOrderInput = {
        order: {
          lineItems: [{ sku: 'PROD-001', quantity: 1 }],
        },
      };

      const result = await adapter.createSalesOrder(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });
});

/**
import { vi, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'; * Unit tests for Mock Adapter
 * Task 11: Comprehensive testing of mock adapter functionality
 */

import { MockAdapter } from '../../../src/adapters/mock/mock-adapter';
import * as types from '../../../src/types';

describe('MockAdapter', () => {
  let adapter: MockAdapter;

  beforeEach(() => {
    adapter = new MockAdapter({
      fixedLatency: 0, // No delay in tests
      errorRate: 0 // No random errors in tests
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
      
      const connectionCheck = healthStatus.checks.find(c => c.name === 'connection');
      expect(connectionCheck?.status).toBe('pass');
      
      const dataCheck = healthStatus.checks.find(c => c.name === 'data_store');
      expect(dataCheck?.status).toBe('pass');
      
      const configCheck = healthStatus.checks.find(c => c.name === 'configuration');
      expect(configCheck?.status).toBe('pass');
    });
  });

  describe('Order Actions', () => {
    beforeEach(async () => {
      await adapter.connect();
    });

    describe('captureOrder', () => {
      it('should capture order successfully', async () => {
        const orderRequest: types.OrderRequest = {
          extOrderId: 'EXT-123',
          customer: {
            customerId: 'cust_001',
            firstName: 'John',
            lastName: 'Doe',
            type: 'individual'
          },
          lineItems: [
            {
              lineItemId: 'line_001',
              sku: 'TEST-001',
              quantity: 2,
              unitPrice: 50.00,
              totalPrice: 100.00,
              customFields: []
            }
          ],
          billingAddress: {
            address1: '123 Test St',
            city: 'Test City',
            stateOrProvince: 'CA',
            zipCodeOrPostalCode: '90210',
            country: 'US'
          },
          shippingAddress: {
            address1: '123 Test St',
            city: 'Test City',
            stateOrProvince: 'CA',
            zipCodeOrPostalCode: '90210',
            country: 'US'
          },
          customFields: []
        };

        const result = await adapter.captureOrder(orderRequest);

        expect(result.success).toBe(true);
        expect(result.orderId).toBeDefined();
        expect(result.status).toBe('confirmed');
        expect(result.createdAt).toBeDefined();
      });

      it('should calculate totals correctly', async () => {
        const orderRequest: types.OrderRequest = {
          extOrderId: 'EXT-124',
          customer: {
            customerId: 'cust_002',
            firstName: 'Jane',
            lastName: 'Smith',
            type: 'individual'
          },
          lineItems: [
            {
              lineItemId: 'line_001',
              sku: 'TEST-002',
              quantity: 1,
              unitPrice: 50.00,
              totalPrice: 50.00,
              customFields: []
            }
          ],
          billingAddress: {
            address1: '456 Test Ave',
            city: 'Test City',
            stateOrProvince: 'CA',
            zipCodeOrPostalCode: '90210',
            country: 'US'
          },
          shippingAddress: {
            address1: '456 Test Ave',
            city: 'Test City',
            stateOrProvince: 'CA',
            zipCodeOrPostalCode: '90210',
            country: 'US'
          },
          customFields: []
        };

        const result = await adapter.captureOrder(orderRequest);
        
        // Verify order was stored and can be retrieved
        const order = await adapter.getOrder({ orderId: result.orderId });
        expect(order.subTotalPrice).toBe(50.00);
        expect(order.orderTax).toBe(4.00); // 8% of subtotal
        expect(order.shippingPrice).toBe(10.00); // Shipping fee for orders under $100
        expect(order.totalPrice).toBe(64.00);
      });

      it('should throw error when not connected', async () => {
        await adapter.disconnect();
        
        const orderRequest: types.OrderRequest = {
          extOrderId: 'EXT-125',
          customer: {
            customerId: 'cust_003',
            firstName: 'Bob',
            lastName: 'Johnson',
            type: 'individual'
          },
          lineItems: [],
          billingAddress: {
            address1: '789 Test Blvd',
            city: 'Test City',
            stateOrProvince: 'CA',
            zipCodeOrPostalCode: '90210',
            country: 'US'
          },
          shippingAddress: {
            address1: '789 Test Blvd',
            city: 'Test City',
            stateOrProvince: 'CA',
            zipCodeOrPostalCode: '90210',
            country: 'US'
          },
          customFields: []
        };

        await expect(adapter.captureOrder(orderRequest)).rejects.toThrow('Adapter not connected');
      });
    });

    describe('cancelOrder', () => {
      let orderId: string;

      beforeEach(async () => {
        const orderRequest: types.OrderRequest = {
          extOrderId: 'EXT-CANCEL',
          customer: {
            customerId: 'cust_cancel',
            firstName: 'Cancel',
            lastName: 'Test',
            type: 'individual'
          },
          lineItems: [
            {
              lineItemId: 'line_cancel',
              sku: 'CANCEL-001',
              quantity: 1,
              unitPrice: 100.00,
              totalPrice: 100.00,
              customFields: []
            }
          ],
          billingAddress: {
            address1: '123 Cancel St',
            city: 'Cancel City',
            stateOrProvince: 'CA',
            zipCodeOrPostalCode: '90210',
            country: 'US'
          },
          shippingAddress: {
            address1: '123 Cancel St',
            city: 'Cancel City',
            stateOrProvince: 'CA',
            zipCodeOrPostalCode: '90210',
            country: 'US'
          },
          customFields: []
        };

        const result = await adapter.captureOrder(orderRequest);
        orderId = result.orderId;
      });

      it('should cancel order successfully', async () => {
        const result = await adapter.cancelOrder(orderId, 'Customer request');

        expect(result.success).toBe(true);
        expect(result.orderId).toBe(orderId);
        expect(result.status).toBe('cancelled');
        expect(result.cancelledAt).toBeDefined();
        expect(result.refundInitiated).toBe(true);
      });

      it('should throw error for non-existent order', async () => {
        await expect(adapter.cancelOrder('invalid-order-id')).rejects.toThrow('Order not found');
      });

      it('should throw error for already cancelled order', async () => {
        await adapter.cancelOrder(orderId, 'First cancellation');
        await expect(adapter.cancelOrder(orderId, 'Second cancellation')).rejects.toThrow('Cannot cancel order');
      });
    });

    describe('updateOrder', () => {
      let orderId: string;

      beforeEach(async () => {
        const orderRequest: types.OrderRequest = {
          extOrderId: 'EXT-UPDATE',
          customer: {
            customerId: 'cust_update',
            firstName: 'Update',
            lastName: 'Test',
            type: 'individual'
          },
          lineItems: [
            {
              lineItemId: 'line_update',
              sku: 'UPDATE-001',
              quantity: 1,
              unitPrice: 75.00,
              totalPrice: 75.00,
              customFields: []
            }
          ],
          billingAddress: {
            address1: '123 Update St',
            city: 'Update City',
            stateOrProvince: 'CA',
            zipCodeOrPostalCode: '90210',
            country: 'US'
          },
          shippingAddress: {
            address1: '123 Update St',
            city: 'Update City',
            stateOrProvince: 'CA',
            zipCodeOrPostalCode: '90210',
            country: 'US'
          },
          customFields: []
        };

        const result = await adapter.captureOrder(orderRequest);
        orderId = result.orderId;
      });

      it('should update order successfully', async () => {
        const updates = {
          status: 'processing',
          notes: 'Order being processed'
        };

        const result = await adapter.updateOrder(orderId, updates);

        expect(result.success).toBe(true);
        expect(result.orderId).toBe(orderId);
        expect(result.updatedFields).toEqual(['status', 'notes']);
      });

      it('should throw error for non-existent order', async () => {
        await expect(adapter.updateOrder('invalid-order-id', {})).rejects.toThrow('Order not found');
      });
    });
  });

  describe('Query Operations', () => {
    beforeEach(async () => {
      await adapter.connect();
    });

    describe('getOrder', () => {
      it('should retrieve order by orderId', async () => {
        const orderRequest: types.OrderRequest = {
          extOrderId: 'EXT-RETRIEVE',
          customer: {
            customerId: 'cust_retrieve',
            firstName: 'Retrieve',
            lastName: 'Test',
            type: 'individual'
          },
          lineItems: [
            {
              lineItemId: 'line_retrieve',
              sku: 'RETRIEVE-001',
              quantity: 1,
              unitPrice: 25.00,
              totalPrice: 25.00,
              customFields: []
            }
          ],
          billingAddress: {
            address1: '123 Retrieve St',
            city: 'Retrieve City',
            stateOrProvince: 'CA',
            zipCodeOrPostalCode: '90210',
            country: 'US'
          },
          shippingAddress: {
            address1: '123 Retrieve St',
            city: 'Retrieve City',
            stateOrProvince: 'CA',
            zipCodeOrPostalCode: '90210',
            country: 'US'
          },
          customFields: []
        };

        const captureResult = await adapter.captureOrder(orderRequest);
        const order = await adapter.getOrder({ orderId: captureResult.orderId });

        expect(order.orderId).toBe(captureResult.orderId);
        expect(order.extOrderId).toBe('EXT-RETRIEVE');
        expect(order.status).toBe('confirmed');
      });

      it('should throw error for non-existent order', async () => {
        await expect(adapter.getOrder({ orderId: 'invalid-order-id' })).rejects.toThrow('Order not found');
      });
    });

    describe('getProduct', () => {
      it('should retrieve product by SKU', async () => {
        const product = await adapter.getProduct({ sku: 'WID-001' });

        expect(product.sku).toBe('WID-001');
        expect(product.name).toBeDefined();
        // price is not a direct field, it's in prices array
      });

      it('should generate dynamic product for unknown SKU', async () => {
        const product = await adapter.getProduct({ sku: 'UNKNOWN-SKU' });

        expect(product.sku).toBe('UNKNOWN-SKU');
        expect(product.name).toContain('Dynamic Product');
        expect(product.customFields).toContainEqual({ name: 'generated', value: 'true' });
      });
    });

    describe('getCustomer', () => {
      it('should retrieve existing customer', async () => {
        const customer = await adapter.getCustomer({ customerId: 'cust_001' });

        expect(customer.customerId).toBe('cust_001');
        expect(customer.firstName).toBeDefined();
        expect(customer.lastName).toBeDefined();
      });

      it('should generate dynamic customer for unknown ID', async () => {
        const customer = await adapter.getCustomer({ customerId: 'unknown_customer' });

        expect(customer.customerId).toBe('cust_unknown_customer');
        expect(customer.firstName).toBe('Generated');
        expect(customer.customFields).toContainEqual({ name: 'generated', value: 'true' });
      });
    });

    describe('getInventory', () => {
      it('should retrieve inventory for SKU', async () => {
        const inventory = await adapter.getInventory('WID-001', 'WH001');

        expect(inventory.sku).toBe('WID-001');
        expect(inventory.locationId).toBe('WH001');
        expect(inventory.onHand).toBeGreaterThanOrEqual(0);
        expect(inventory.available).toBeGreaterThanOrEqual(0);
      });

      it('should generate dynamic inventory for unknown SKU', async () => {
        const inventory = await adapter.getInventory('UNKNOWN-SKU');

        expect(inventory.sku).toBe('UNKNOWN-SKU');
        expect(inventory.locationId).toBe('WH001');
        expect(inventory.customFields).toContainEqual({ name: 'generated', value: 'true' });
      });
    });

    describe('getShipment', () => {
      it('should retrieve shipment information', async () => {
        const shipment = await adapter.getShipment({ shipmentId: 'test-shipment' });

        expect(shipment.shipmentId).toBe('test-shipment');
        expect(shipment.status).toBe('shipped');
        // trackingNumber is not part of Shipment schema
        expect(shipment.shippingAddress).toBeDefined();
      });
    });

    describe('getBuyer', () => {
      it('should retrieve buyer information', async () => {
        const buyer = await adapter.getBuyer('test-buyer');

        expect(buyer.userId).toBe('test-buyer');
        expect(buyer.name).toContain('test-buyer');
        expect(buyer.email).toContain('test-buyer');
        // type is not part of Buyer schema
      });
    });
  });

  describe('Management Operations', () => {
    let orderId: string;

    beforeEach(async () => {
      await adapter.connect();
      
      const orderRequest: types.OrderRequest = {
        extOrderId: 'EXT-MGMT',
        customer: {
          customerId: 'cust_mgmt',
          firstName: 'Management',
          lastName: 'Test',
          type: 'individual'
        },
        lineItems: [
          {
            lineItemId: 'line_mgmt',
            sku: 'MGMT-001',
            quantity: 1,
            unitPrice: 150.00,
            totalPrice: 150.00,
            customFields: []
          }
        ],
        billingAddress: {
          address1: '123 Management St',
          city: 'Management City',
          stateOrProvince: 'CA',
          zipCodeOrPostalCode: '90210',
          country: 'US'
        },
        shippingAddress: {
          address1: '123 Management St',
          city: 'Management City',
          stateOrProvince: 'CA',
          zipCodeOrPostalCode: '90210',
          country: 'US'
        },
        customFields: []
      };

      const result = await adapter.captureOrder(orderRequest);
      orderId = result.orderId;
    });

    describe('holdOrder', () => {
      it('should place order on hold', async () => {
        const holdInfo: types.HoldParams = {
          reason: 'Payment verification',
          releaseDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };

        const result = await adapter.holdOrder(orderId, holdInfo);

        expect(result.success).toBe(true);
        expect(result.orderId).toBe(orderId);
        expect(result.status).toBe('on_hold');
        expect(result.reason).toBe('Payment verification');
        expect(result.holdId).toBeDefined();
      });
    });

    describe('splitOrder', () => {
      it('should split order successfully', async () => {
        const splits: types.SplitParams[] = [
          { reason: 'Partial availability' },
          { reason: 'Different warehouse' }
        ];

        const result = await adapter.splitOrder(orderId, splits);

        expect(result.success).toBe(true);
        expect(result.originalOrderId).toBe(orderId);
        expect(result.newOrderIds).toHaveLength(2);
        expect(result.splitCount).toBe(2);
      });
    });

    describe('reserveInventory', () => {
      it('should reserve inventory successfully', async () => {
        const items: types.InventoryItem[] = [
          {
            sku: 'WID-001',
            quantity: 5,
            locationId: 'WH001'
          }
        ];

        const reservation: types.ReservationRequest = {
          items,
          expiresInMinutes: 30
        };
        const result = await adapter.reserveInventory(reservation);

        expect(result.success).toBe(true);
        expect(result.reservationId).toBeDefined();
        expect(result.items).toHaveLength(1);
        expect(result.expiresAt).toBeDefined();
      });
    });
  });

  describe('Error Simulation', () => {
    it('should simulate connection errors when configured', async () => {
      const errorAdapter = new MockAdapter({
        fixedLatency: 0,
        operationErrors: { connect: 1.0 } // 100% error rate for connect
      });

      await expect(errorAdapter.connect()).rejects.toThrow('Mock error: Connection failed');
    });

    it('should simulate operation-specific errors', async () => {
      const errorAdapter = new MockAdapter({
        fixedLatency: 0,
        operationErrors: { captureOrder: 1.0 } // 100% error rate for captureOrder
      });

      await errorAdapter.connect();

      const orderRequest: types.OrderRequest = {
        extOrderId: 'EXT-ERROR',
        customer: {
          customerId: 'cust_error',
          firstName: 'Error',
          lastName: 'Test',
          type: 'individual'
        },
        lineItems: [],
        billingAddress: {
          address1: '123 Error St',
          city: 'Error City',
          stateOrProvince: 'CA',
          zipCodeOrPostalCode: '90210',
          country: 'US'
        },
        shippingAddress: {
          address1: '123 Error St',
          city: 'Error City',
          stateOrProvince: 'CA',
          zipCodeOrPostalCode: '90210',
          country: 'US'
        },
        customFields: []
      };

      await expect(errorAdapter.captureOrder(orderRequest)).rejects.toThrow('Mock error: Order capture failed');
    });
  });

  describe('Configuration', () => {
    it('should respect latency configuration', async () => {
      const slowAdapter = new MockAdapter({
        fixedLatency: 100,
        errorRate: 0
      });

      await slowAdapter.connect();

      const start = Date.now();
      await slowAdapter.getProduct({ sku: 'TEST' });
      const duration = Date.now() - start;

      expect(duration).toBeGreaterThanOrEqual(100);
    });

    it('should provide configuration summary in health check', async () => {
      const configAdapter = new MockAdapter({
        fixedLatency: 50,
        errorRate: 0.05,
        dataSize: 500,
        operationErrors: { connect: 0 } // Ensure connect doesn't fail for this test
      });

      await configAdapter.connect();
      const health = await configAdapter.healthCheck();

      const configCheck = health.checks.find(c => c.name === 'configuration');
      expect(configCheck?.details).toHaveProperty('latency', 'fixed 50ms');
      expect(configCheck?.details).toHaveProperty('errorRate', '5%');
    });
  });
});
/**
 * Unit tests for YourFulfillment Adapter
 * 
 * These tests demonstrate how to test your adapter implementation.
 * Replace with actual tests for your Fulfillment integration.
 */

import { YourFulfillmentAdapter } from '../src/adapter';
import { ApiClient } from '../src/utils/api-client';
import { 
  OrderRequest, 
  OrderUpdates,
  ReturnItem,
  ExchangeParams,
  ShippingInfo,
  HoldParams,
  SplitParams,
  InventoryItem
} from '../src/mocks/types/fulfillment';

// Mock the API client
jest.mock('../src/utils/api-client');

describe('YourFulfillmentAdapter', () => {
  let adapter: YourFulfillmentAdapter;
  let mockApiClient: jest.Mocked<ApiClient>;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create adapter instance
    adapter = new YourFulfillmentAdapter({
      apiUrl: 'https://api.test.yourfulfillment.com',
      apiKey: 'test-api-key',
      workspace: 'test-workspace',
      timeout: 5000,
      debugMode: false
    });
    
    // Get mocked API client
    mockApiClient = (adapter as any).client;
  });
  
  describe('Lifecycle Methods', () => {
    describe('connect', () => {
      it('should connect successfully when API is healthy', async () => {
        mockApiClient.get.mockResolvedValue({
          success: true,
          data: { status: 'healthy' }
        });
        
        await expect(adapter.connect()).resolves.not.toThrow();
        expect(mockApiClient.get).toHaveBeenCalledWith('/health');
      });
      
      it('should throw error when API is unreachable', async () => {
        mockApiClient.get.mockResolvedValue({
          success: false,
          error: { code: 'CONNECTION_FAILED', message: 'Connection failed' }
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
        mockApiClient.get.mockResolvedValue({
          success: true,
          data: { status: 'operational' }
        });
        
        const result = await adapter.healthCheck();
        
        expect(result.status).toBe('healthy');
        expect(result.checks).toHaveLength(2);
        expect(result.checks[0].status).toBe('pass');
      });
      
      it('should return unhealthy status when API fails', async () => {
        mockApiClient.get.mockRejectedValue(new Error('Network error'));
        
        const result = await adapter.healthCheck();
        
        expect(result.status).toBe('unhealthy');
        expect(result.checks[0].status).toBe('fail');
      });
    });
  });
  
  describe('Order Actions', () => {
    describe('captureOrder', () => {
      const validOrderRequest: OrderRequest = {
        extOrderId: 'EXT-001',
        customer: {
          customerId: 'CUST-001',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1234567890'
        },
        lineItems: [
          {
            sku: 'PROD-001',
            name: 'Test Product',
            quantity: 2,
            price: 29.99,
            discount: 5.00,
            tax: 2.50
          }
        ],
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          address1: '123 Main St',
          address2: 'Apt 4',
          city: 'New York',
          state: 'NY',
          zip: '10001',
          country: 'US',
          phone: '+1234567890'
        },
        billingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          address1: '123 Main St',
          address2: 'Apt 4',
          city: 'New York',
          state: 'NY',
          zip: '10001',
          country: 'US',
          phone: '+1234567890'
        },
        totalPrice: 57.48,
        currency: 'USD',
        orderNote: 'Please handle with care',
        orderSource: 'website'
      };
      
      it('should capture order successfully', async () => {
        mockApiClient.post.mockResolvedValue({
          success: true,
          data: {
            id: 'ORDER-001',
            number: 'ORD-2024-001',
            status: 'new',
            created_at: '2024-01-01T00:00:00Z'
          }
        });
        
        const result = await adapter.captureOrder(validOrderRequest);
        
        expect(result.success).toBe(true);
        expect(result.orderId).toBe('ORDER-001');
        expect(result.orderNumber).toBe('ORD-2024-001');
        expect(result.status).toBe('pending');
        expect(mockApiClient.post).toHaveBeenCalledWith('/orders', expect.any(Object));
      });
      
      it('should handle order creation failure', async () => {
        mockApiClient.post.mockResolvedValue({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid order data'
          }
        });
        
        await expect(adapter.captureOrder(validOrderRequest))
          .rejects.toThrow('Failed to capture order');
      });
    });
    
    describe('cancelOrder', () => {
      it('should cancel order successfully', async () => {
        mockApiClient.get.mockResolvedValue({
          success: true,
          data: {
            id: 'ORDER-001',
            status: 'processing'
          }
        });
        
        mockApiClient.post.mockResolvedValue({
          success: true,
          data: {
            refund_initiated: true
          }
        });
        
        const result = await adapter.cancelOrder('ORDER-001', 'Customer request');
        
        expect(result.success).toBe(true);
        expect(result.orderId).toBe('ORDER-001');
        expect(result.status).toBe('cancelled');
        expect(result.refundInitiated).toBe(true);
      });
      
      it('should throw error when order not found', async () => {
        mockApiClient.get.mockResolvedValue({
          success: false,
          error: { code: 'ORDER_NOT_FOUND' }
        });
        
        await expect(adapter.cancelOrder('INVALID-ID'))
          .rejects.toThrow('Order not found');
      });
      
      it('should throw error when order cannot be cancelled', async () => {
        mockApiClient.get.mockResolvedValue({
          success: true,
          data: {
            id: 'ORDER-001',
            status: 'delivered'
          }
        });
        
        await expect(adapter.cancelOrder('ORDER-001'))
          .rejects.toThrow('Cannot cancel order ORDER-001 in status delivered');
      });
    });
    
    describe('updateOrder', () => {
      const updates: OrderUpdates = {
        status: 'processing',
        shippingAddress: {
          firstName: 'Jane',
          lastName: 'Smith',
          address1: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          zip: '90001',
          country: 'US'
        },
        notes: 'Updated shipping address'
      };
      
      it('should update order successfully', async () => {
        mockApiClient.patch.mockResolvedValue({
          success: true,
          data: {
            version: 2
          }
        });
        
        const result = await adapter.updateOrder('ORDER-001', updates);
        
        expect(result.success).toBe(true);
        expect(result.orderId).toBe('ORDER-001');
        expect(result.updatedFields).toContain('status');
        expect(result.updatedFields).toContain('shippingAddress');
        expect(result.version).toBe(2);
      });
    });
  });
  
  describe('Management Operations', () => {
    describe('holdOrder', () => {
      it('should place order on hold', async () => {
        const holdParams: HoldParams = {
          reason: 'Payment verification',
          until: '2024-01-02T00:00:00Z',
          autoRelease: true,
          notes: 'Waiting for payment confirmation'
        };
        
        mockApiClient.post.mockResolvedValue({
          success: true,
          data: {
            hold_id: 'HOLD-001'
          }
        });
        
        const result = await adapter.holdOrder('ORDER-001', holdParams);
        
        expect(result.success).toBe(true);
        expect(result.holdId).toBe('HOLD-001');
        expect(result.status).toBe('on_hold');
      });
    });
    
    describe('reserveInventory', () => {
      it('should reserve inventory successfully', async () => {
        const items: InventoryItem[] = [
          { sku: 'PROD-001', quantity: 5, locationId: 'LOC-001' },
          { sku: 'PROD-002', quantity: 3 }
        ];
        
        mockApiClient.post.mockResolvedValue({
          success: true,
          data: {
            reservation_id: 'RES-001',
            items: [
              { sku: 'PROD-001', reserved: 5, available: 95 },
              { sku: 'PROD-002', reserved: 3, available: 47 }
            ],
            expires_at: '2024-01-01T00:15:00Z'
          }
        });
        
        const result = await adapter.reserveInventory(items, 15);
        
        expect(result.success).toBe(true);
        expect(result.reservationId).toBe('RES-001');
        expect(result.items).toHaveLength(2);
        expect(result.items[0].reserved).toBe(5);
      });
      
      it('should handle insufficient inventory', async () => {
        mockApiClient.post.mockResolvedValue({
          success: false,
          error: {
            code: 'INSUFFICIENT_INVENTORY',
            details: {
              sku: 'PROD-001',
              requested: 10,
              available: 5
            }
          }
        });
        
        await expect(adapter.reserveInventory([{ sku: 'PROD-001', quantity: 10 }]))
          .rejects.toThrow('Insufficient inventory for SKU PROD-001');
      });
    });
  });
  
  describe('Query Operations', () => {
    describe('getOrder', () => {
      it('should get order by ID', async () => {
        mockApiClient.get.mockResolvedValue({
          success: true,
          data: {
            id: 'ORDER-001',
            number: 'ORD-2024-001',
            external_id: 'EXT-001',
            status: 'processing',
            customer: {
              id: 'CUST-001',
              email: 'test@example.com',
              first_name: 'John',
              last_name: 'Doe'
            },
            items: [],
            total: 100.00,
            currency: 'USD',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        });
        
        const order = await adapter.getOrder({ orderId: 'ORDER-001' });
        
        expect(order.orderId).toBe('ORDER-001');
        expect(order.extOrderId).toBe('EXT-001');
        expect(order.status).toBe('processing');
        expect(mockApiClient.get).toHaveBeenCalledWith('/orders/ORDER-001');
      });
      
      it('should get order by order number', async () => {
        mockApiClient.get.mockResolvedValue({
          success: true,
          data: {
            id: 'ORDER-001',
            number: 'ORD-2024-001',
            external_id: 'EXT-001',
            status: 'processing',
            customer: {
              id: 'CUST-001',
              email: 'test@example.com',
              first_name: 'John',
              last_name: 'Doe'
            },
            items: [],
            total: 100.00,
            currency: 'USD',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        });
        
        const order = await adapter.getOrder({ orderNumber: 'ORD-2024-001' });
        
        expect(order.orderId).toBe('ORDER-001');
        expect(mockApiClient.get).toHaveBeenCalledWith('/orders/by-number/ORD-2024-001');
      });
      
      it('should throw error when no identifier provided', async () => {
        await expect(adapter.getOrder({}))
          .rejects.toThrow('Either orderId or orderNumber must be provided');
      });
    });
    
    describe('getInventory', () => {
      it('should get inventory for SKU', async () => {
        mockApiClient.get.mockResolvedValue({
          success: true,
          data: {
            sku: 'PROD-001',
            available: 100,
            reserved: 10,
            total: 110,
            warehouse_locations: [
              { location_id: 'LOC-001', available: 60, reserved: 5 },
              { location_id: 'LOC-002', available: 40, reserved: 5 }
            ],
            updated_at: '2024-01-01T00:00:00Z'
          }
        });
        
        const inventory = await adapter.getInventory('PROD-001');
        
        expect(inventory.sku).toBe('PROD-001');
        expect(inventory.available).toBe(100);
        expect(inventory.reserved).toBe(10);
        expect(inventory.locations).toHaveLength(2);
      });
    });
  });
  
  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network timeout'));
      
      await expect(adapter.getOrder({ orderId: 'ORDER-001' }))
        .rejects.toThrow('Failed to get order: Network timeout');
    });
    
    it('should handle API errors with proper error codes', async () => {
      mockApiClient.post.mockResolvedValue({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests'
        }
      });
      
      await expect(adapter.captureOrder({} as OrderRequest))
        .rejects.toThrow('Failed to capture order');
    });
  });
});

// Test fixtures
export const mockOrderData = {
  validOrder: {
    id: 'ORDER-001',
    number: 'ORD-2024-001',
    external_id: 'EXT-001',
    status: 'new',
    customer: {
      id: 'CUST-001',
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe'
    },
    items: [
      {
        sku: 'PROD-001',
        name: 'Test Product',
        quantity: 2,
        price: 29.99,
        subtotal: 59.98
      }
    ],
    total: 59.98,
    currency: 'USD',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
};
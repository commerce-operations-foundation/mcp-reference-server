/**
import { vi, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'; * Unit tests for Transformer service
 */

import { Transformer } from '../../../src/services/transformer';

describe('Transformer', () => {
  let transformer: Transformer;

  beforeEach(() => {
    transformer = new Transformer();
  });

  describe('Order Transformations', () => {
    describe('toAdapterFormat', () => {
      it('should transform order to adapter format', () => {
        const mcpOrder = {
          extOrderId: 'ORDER-123',
          customer: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '+1-234-567-8900'
          },
          lineItems: [
            {
              sku: 'ABC-123',
              quantity: 2,
              unitPrice: 25.00,
              name: 'Test Product'
            }
          ],
          billingAddress: {
            address1: '123 Main St',
            city: 'Anytown',
            stateOrProvince: 'CA',
            zipCodeOrPostalCode: '12345',
            country: 'US'
          },
          currency: 'USD',
          customFields: [{ name: 'source', value: 'web' }]
        };

        const result = transformer.toAdapterFormat('order', mcpOrder);

        expect(result).toEqual({
          extOrderId: 'ORDER-123',
          customer: {
            email: 'john@example.com',
            firstName: 'John',
            lastName: 'Doe',
            phone: '+12345678900',
            company: null,
            customerId: null
          },
          lineItems: [
            {
              sku: 'ABC-123',
              quantity: 2,
              unitPrice: 25.00,
              totalPrice: 50.00,
              name: 'Test Product',
              metadata: {}
            }
          ],
          billingAddress: {
            line1: '123 Main St',
            line2: null,
            city: 'Anytown',
            state: 'CA',
            postalCode: '12345',
            country: 'US',
            phone: null
          },
          shippingAddress: null,
          currency: 'USD',
          metadata: {},
          customFields: [{ name: 'source', value: 'web' }]
        });
      });

      it('should handle null/undefined order gracefully', () => {
        expect(transformer.toAdapterFormat('order', null)).toBeNull();
        expect(transformer.toAdapterFormat('order', undefined)).toBeNull();
      });

      it('should handle missing optional fields', () => {
        const minimalOrder = {
          extOrderId: 'ORDER-456'
        };

        const result = transformer.toAdapterFormat('order', minimalOrder);

        expect(result).toEqual({
          extOrderId: 'ORDER-456',
          customer: null,
          lineItems: undefined,
          billingAddress: null,
          shippingAddress: null,
          currency: 'USD',
          metadata: {},
          customFields: []
        });
      });
    });

    describe('toMCPFormat', () => {
      it('should transform order from adapter to MCP format', () => {
        const adapterOrder = {
          orderId: 'ord_123',
          externalOrderId: 'ORDER-123',
          status: 'processing',
          customer: {
            customerId: 'cust_456',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com'
          },
          lineItems: [
            {
              sku: 'DEF-456',
              quantity: 1,
              unitPrice: 100.00,
              totalPrice: 100.00,
              name: 'Premium Product'
            }
          ],
          currency: 'EUR',
          subtotal: 100.00,
          tax: 20.00,
          shipping: 5.00,
          total: 125.00,
          createdAt: '2023-12-01T10:00:00Z'
        };

        const result = transformer.toMCPFormat('order', adapterOrder);

        expect(result).toMatchObject({
          orderId: 'ord_123',
          extOrderId: 'ORDER-123',
          status: 'processing',
          customer: {
            customerId: 'cust_456',
            extCustomerId: undefined,
            firstName: 'Jane',
            lastName: 'Smith',
            company: null,
            type: 'individual'
          },
          lineItems: [
            {
              canceled: 0,
              fulfillable: 1,
              fulfilled: 0,
              ordered: 1
            }
          ],
          currency: 'EUR',
          subTotalPrice: 100.00,
          orderTax: 20.00,
          shippingPrice: 5.00,
          totalPrice: 125.00,
          createdAt: '2023-12-01T10:00:00Z',
          customFields: []
        });
      });

      it('should handle null/undefined order gracefully', () => {
        const result = transformer.toMCPFormat('order', null);
        expect(result).toEqual({});
      });
    });

    describe('Order Result Transformations', () => {
      it('should transform order result to MCP format', () => {
        const adapterResult = {
          success: true,
          orderId: 'ord_789',
          orderNumber: 'ORDER-789',
          status: 'confirmed',
          createdAt: '2023-12-01T15:30:00Z',
          message: 'Order created successfully'
        };

        const result = transformer.toMCPFormat('orderResult', adapterResult);

        expect(result).toEqual({
          success: true,
          orderId: 'ord_789',
          orderNumber: 'ORDER-789',
          status: 'confirmed',
          createdAt: '2023-12-01T15:30:00Z',
          message: 'Order created successfully'
        });
      });

      it('should handle missing createdAt by setting current timestamp', () => {
        const adapterResult = {
          success: true,
          orderId: 'ord_999',
          status: 'pending'
        };

        const result = transformer.toMCPFormat('orderResult', adapterResult);

        expect(result.success).toBe(true);
        expect(result.orderId).toBe('ord_999');
        expect(result.status).toBe('pending');
        expect(result.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO format
      });

      it('should default success to true when not explicitly false', () => {
        const result1 = transformer.toMCPFormat('orderResult', { success: undefined });
        const result2 = transformer.toMCPFormat('orderResult', { success: null });
        const result3 = transformer.toMCPFormat('orderResult', {});

        expect(result1.success).toBe(true);
        expect(result2.success).toBe(true);
        expect(result3.success).toBe(true);
      });
    });
  });

  describe('Customer Transformations', () => {
    describe('toAdapterFormat', () => {
      it('should transform customer to adapter format', () => {
        const mcpCustomer = {
          customerId: 'cust_123',
          firstName: 'Alice',
          lastName: 'Johnson',
          email: 'ALICE@EXAMPLE.COM',
          phone: '(555) 123-4567',
          company: 'Acme Corp'
        };

        const result = transformer.toAdapterFormat('customer', mcpCustomer);

        expect(result).toEqual({
          email: 'alice@example.com',
          firstName: 'Alice',
          lastName: 'Johnson',
          phone: '5551234567',
          company: 'Acme Corp',
          customerId: 'cust_123'
        });
      });

      it('should handle null customer', () => {
        expect(transformer.toAdapterFormat('customer', null)).toBeNull();
      });

      it('should handle invalid email gracefully', () => {
        const customerWithBadEmail = {
          firstName: 'Bob',
          email: 'not-an-email'
        };

        const result = transformer.toAdapterFormat('customer', customerWithBadEmail);
        expect(result.email).toBe('not-an-email'); // Falls back to original
      });

      it('should handle invalid phone gracefully', () => {
        const customerWithBadPhone = {
          firstName: 'Charlie',
          phone: '123' // Too short
        };

        const result = transformer.toAdapterFormat('customer', customerWithBadPhone);
        expect(result.phone).toBeNull();
      });
    });

    describe('toMCPFormat', () => {
      it('should transform customer from adapter to MCP format', () => {
        const adapterCustomer = {
          id: 'cust_456',
          firstName: 'Diana',
          lastName: 'Prince',
          company: 'Wonder Corp',
          type: 'company'
        };

        const result = transformer.toMCPFormat('customer', adapterCustomer);

        expect(result).toEqual({
          customerId: 'cust_456',
          extCustomerId: undefined,
          firstName: 'Diana',
          lastName: 'Prince',
          company: 'Wonder Corp',
          type: 'company'
        });
      });

      it('should default type to individual', () => {
        const adapterCustomer = {
          firstName: 'Edward',
          lastName: 'Norton'
        };

        const result = transformer.toMCPFormat('customer', adapterCustomer);
        expect(result.type).toBe('individual');
      });
    });
  });

  describe('Address Transformations', () => {
    describe('toAdapterFormat', () => {
      it('should transform address to adapter format', () => {
        const mcpAddress = {
          address1: '456 Oak Ave',
          address2: 'Suite 100',
          city: 'Springfield',
          stateOrProvince: 'IL',
          zipCodeOrPostalCode: '62701',
          country: 'US',
          phone: '555-987-6543'
        };

        const result = transformer.toAdapterFormat('address', mcpAddress);

        expect(result).toEqual({
          line1: '456 Oak Ave',
          line2: 'Suite 100',
          city: 'Springfield',
          state: 'IL',
          postalCode: '62701',
          country: 'US',
          phone: '555-987-6543'
        });
      });

      it('should handle null address', () => {
        expect(transformer.toAdapterFormat('address', null)).toBeNull();
      });

      it('should handle alternative field names', () => {
        const addressWithAltFields = {
          street: '789 Pine St',
          province: 'ON',
          zip: 'K1A 0A9'
        };

        const result = transformer.toAdapterFormat('address', addressWithAltFields);

        expect(result.line1).toBe('789 Pine St');
        expect(result.state).toBe('ON');
        expect(result.postalCode).toBe('K1A 0A9');
      });
    });

    describe('toMCPFormat', () => {
      it('should transform address from adapter to MCP format', () => {
        const adapterAddress = {
          line1: '321 Elm St',
          line2: 'Apt 5B',
          city: 'Portland',
          state: 'OR',
          postalCode: '97201',
          country: 'US',
          phone: '503-555-0123',
          email: 'resident@example.com',
          firstName: 'Grace',
          lastName: 'Hopper',
          company: 'Navy'
        };

        // Use internal method for testing address transformation directly
        const result = (transformer as any).transformAddressToMCP(adapterAddress);

        expect(result).toEqual({
          address1: '321 Elm St',
          address2: 'Apt 5B',
          city: 'Portland',
          stateOrProvince: 'OR',
          zipCodeOrPostalCode: '97201',
          country: 'US',
          phone: '503-555-0123',
          email: 'resident@example.com',
          firstName: 'Grace',
          lastName: 'Hopper',
          company: 'Navy'
        });
      });

      it('should handle null address', () => {
        const result = (transformer as any).transformAddressToMCP(null);
        expect(result).toBeUndefined();
      });
    });
  });

  describe('Status Normalization', () => {
    it('should normalize various status formats', () => {
      const testCases = [
        { input: 'pending', expected: 'pending' },
        { input: 'CONFIRMED', expected: 'confirmed' },
        { input: 'Processing', expected: 'processing' },
        { input: 'shipped', expected: 'shipped' },
        { input: 'delivered', expected: 'delivered' },
        { input: 'cancelled', expected: 'cancelled' },
        { input: 'canceled', expected: 'cancelled' }, // US spelling
        { input: 'on_hold', expected: 'on_hold' },
        { input: 'on-hold', expected: 'on_hold' },
        { input: 'hold', expected: 'on_hold' },
        { input: 'complete', expected: 'delivered' },
        { input: 'fulfilled', expected: 'delivered' },
        { input: 'unknown_status', expected: 'pending' },
        { input: '', expected: 'pending' },
        { input: null, expected: 'pending' }
      ];

      testCases.forEach(({ input, expected }) => {
        const order = { status: input };
        const result = transformer.toMCPFormat('order', order);
        expect(result.status).toBe(expected);
      });
    });
  });

  describe('Calculation Functions', () => {
    it('should calculate subtotal from line items', () => {
      const orderWithItems = {
        lineItems: [
          { quantity: 2, unitPrice: 10.00 },
          { quantity: 1, unitPrice: 15.00, totalPrice: 15.00 },
          { quantity: 3, unitPrice: 5.00 }
        ]
      };

      const result = transformer.toMCPFormat('order', orderWithItems);
      expect(result.subTotalPrice).toBe(50.00); // 20 + 15 + 15
    });

    it('should calculate total with tax and shipping', () => {
      const orderWithTotals = {
        subtotal: 100.00,
        tax: 8.25,
        shipping: 10.00,
        discount: 5.00
      };

      const result = transformer.toMCPFormat('order', orderWithTotals);
      expect(result.totalPrice).toBe(113.25); // 100 + 8.25 + 10 - 5
    });

    it('should handle missing calculation values', () => {
      const orderWithMissingValues = {
        lineItems: []
      };

      const result = transformer.toMCPFormat('order', orderWithMissingValues);
      expect(result.subTotalPrice).toBe(0);
      expect(result.totalPrice).toBe(0);
    });
  });

  describe('Field Mapping Variations', () => {
    it('should handle various field name formats', () => {
      const orderWithVariedFields = {
        id: 'order_123',
        externalOrderId: 'EXT-456',
        items: [{ // Using 'items' instead of 'lineItems'
          sku: 'VARIED-123',
          ordered: 2, // Using 'ordered' instead of 'quantity'
          price: 25.00 // Using 'price' instead of 'unitPrice'
        }],
        created_at: '2023-12-01T12:00:00Z',
        updated_at: '2023-12-01T12:30:00Z'
      };

      const result = transformer.toMCPFormat('order', orderWithVariedFields);

      expect(result.orderId).toBe('order_123');
      expect(result.extOrderId).toBe('EXT-456');
      expect(result.lineItems).toHaveLength(1);
      expect(result.lineItems[0].ordered).toBe(2);
      expect(result.createdAt).toBe('2023-12-01T12:00:00Z');
      expect(result.updatedAt).toBe('2023-12-01T12:30:00Z');
    });
  });

  describe('Product Transformations', () => {
    it('should transform product to adapter format', () => {
      const mcpProduct = {
        sku: 'PROD-123',
        name: 'Test Product',
        description: 'A test product',
        cost: 25.00,
        costCurrency: 'USD',
        weight: 1.5,
        weightUnit: 'lb',
        length: 10,
        width: 5,
        height: 3,
        dimensionsUnit: 'in',
        upc: '123456789012',
        vendor: 'Test Vendor',
        types: ['electronics'],
        customFields: [{ name: 'category', value: 'gadgets' }]
      };

      const result = transformer.transformProductToAdapter(mcpProduct);

      expect(result).toEqual({
        sku: 'PROD-123',
        name: 'Test Product',
        description: 'A test product',
        price: 25.00,
        currency: 'USD',
        weight: 1.5,
        weightUnit: 'lb',
        dimensions: {
          length: 10,
          width: 5,
          height: 3,
          unit: 'in'
        },
        upc: '123456789012',
        vendor: 'Test Vendor',
        category: 'electronics',
        tags: {},
        customFields: [{ name: 'category', value: 'gadgets' }]
      });
    });

    it('should transform product from adapter to MCP format', () => {
      const adapterProduct = {
        id: 'prod_456',
        sku: 'ADAPTER-456',
        name: 'Adapter Product',
        price: 50.00,
        currency: 'EUR',
        dimensions: {
          length: 15,
          width: 10,
          height: 8,
          unit: 'cm'
        },
        category: 'tools',
        created_at: '2023-12-01T09:00:00Z'
      };

      const result = transformer.transformProductToMCP(adapterProduct);

      expect(result).toMatchObject({
        productId: 'prod_456',
        sku: 'ADAPTER-456',
        name: 'Adapter Product',
        cost: 50.00,
        costCurrency: 'EUR',
        length: 15,
        width: 10,
        height: 8,
        dimensionsUnit: 'cm',
        types: ['tools'],
        createdAt: '2023-12-01T09:00:00Z'
      });
    });
  });

  describe('Unknown Type Handling', () => {
    it('should return original data for unknown transformation types', () => {
      const originalData = { test: 'data' };
      
      const result1 = transformer.toAdapterFormat('unknown', originalData);
      const result2 = transformer.toMCPFormat('unknown', originalData);
      
      expect(result1).toEqual(originalData);
      expect(result2).toEqual(originalData);
    });
  });
});
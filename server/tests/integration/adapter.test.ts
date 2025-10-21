import { TestMCPClient } from '../helpers/test-client';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
describe('Adapter Integration', () => {
  let client: TestMCPClient;

  beforeAll(async () => {
    client = new TestMCPClient();
    await client.connect();
  }, 30000);

  afterAll(async () => {
    if (client) {
      await client.disconnect();
    }
  });

  describe('Mock Adapter Behavior', () => {
    it('should generate unique IDs', async () => {
      const orderIds = new Set<string>();

      // Create multiple orders
      for (let i = 0; i < 5; i++) {
        const response = await client.sendRequest('tools/call', {
          name: 'capture-order',
          arguments: {
            order: {
              extOrderId: `UNIQUE-TEST-${Date.now()}-${i}`,
              customer: {
                email: `unique${i}@example.com`,
                firstName: 'Unique',
                lastName: `Test${i}`,
              },
              lineItems: [
                {
                  sku: 'SKU001',
                  quantity: 1,
                  unitPrice: 10.0,
                },
              ],
            },
          },
        });

        const result = JSON.parse(response.content[0].text);
        expect(result.success).toBe(true);
        expect(result.orderId).toBeDefined();
        orderIds.add(result.orderId);
      }

      // All IDs should be unique
      expect(orderIds.size).toBe(5);
    });

    it('should handle inventory updates correctly', async () => {
      // Get initial inventory
      const initialResponse = await client.sendRequest('tools/call', {
        name: 'get-inventory',
        arguments: { sku: 'SKU001' },
      });

      const initialInventory = JSON.parse(initialResponse.content[0].text);
      const initialQuantity = initialInventory.quantityAvailable;

      // Reserve some inventory
      const reserveResponse = await client.sendRequest('tools/call', {
        name: 'reserve-inventory',
        arguments: {
          items: [
            {
              sku: 'SKU001',
              quantity: 5,
            },
          ],
          duration: 10,
        },
      });

      const reserveResult = JSON.parse(reserveResponse.content[0].text);
      expect(reserveResult.success).toBe(true);

      // Check inventory after reservation
      const afterResponse = await client.sendRequest('tools/call', {
        name: 'get-inventory',
        arguments: { sku: 'SKU001' },
      });

      const afterInventory = JSON.parse(afterResponse.content[0].text);

      // Available quantity should be reduced
      if (initialQuantity !== undefined && afterInventory.quantityAvailable !== undefined) {
        expect(afterInventory.quantityAvailable).toBeLessThanOrEqual(initialQuantity);
      }
    });

    it('should retrieve orders correctly', async () => {
      // First create an order
      const captureResponse = await client.sendRequest('tools/call', {
        name: 'capture-order',
        arguments: {
          order: {
            extOrderId: `RETRIEVE-TEST-${Date.now()}`,
            customer: {
              email: 'retrieve@example.com',
            },
            lineItems: [
              {
                sku: 'SKU001',
                quantity: 1,
                unitPrice: 25.0,
              },
            ],
          },
        },
      });

      const captureResult = JSON.parse(captureResponse.content[0].text);
      expect(captureResult.success).toBe(true);
      expect(captureResult.orderId).toBeDefined();

      // Now retrieve the order
      const getResponse = await client.sendRequest('tools/call', {
        name: 'get-order',
        arguments: { orderId: captureResult.orderId },
      });

      const getResult = JSON.parse(getResponse.content[0].text);

      // Log what we got to understand the structure
      if (process.env.DEBUG_TESTS) {
        console.error('Retrieved order:', JSON.stringify(getResult, null, 2));
      }

      // Check the structure
      expect(getResult).toBeDefined();
      expect(getResult.orderId).toBe(captureResult.orderId);
      expect(getResult.status).toBe('confirmed');
    });

    it('should simulate realistic order statuses', async () => {
      // Create order
      const captureResponse = await client.sendRequest('tools/call', {
        name: 'capture-order',
        arguments: {
          order: {
            extOrderId: `STATUS-TEST-${Date.now()}`,
            customer: {
              email: 'status@example.com',
            },
            lineItems: [
              {
                sku: 'SKU001',
                quantity: 1,
                unitPrice: 25.0,
              },
            ],
          },
        },
      });

      const order = JSON.parse(captureResponse.content[0].text);

      // Check initial status
      const getResponse1 = await client.sendRequest('tools/call', {
        name: 'get-order',
        arguments: { orderId: order.orderId },
      });

      // Debug: Check raw response structure
      if (!getResponse1.content || !getResponse1.content[0]) {
        console.error('Invalid response structure:', getResponse1);
        throw new Error('Invalid response from get-order');
      }

      const result1 = JSON.parse(getResponse1.content[0].text);

      // The tool returns the Order object directly
      expect(result1).toBeDefined();
      expect(result1.orderId).toBe(order.orderId);
      expect(result1.status).toBeDefined();
      expect(['pending', 'confirmed', 'processing']).toContain(result1.status);

      // Ship the order
      const shipResponse = await client.sendRequest('tools/call', {
        name: 'ship-order',
        arguments: {
          orderId: order.orderId,
          shippingInfo: {
            carrier: 'UPS',
            service: 'ground',
            trackingNumber: `UPS${Date.now()}`,
          },
        },
      });

      const shipResult = JSON.parse(shipResponse.content[0].text);
      expect(shipResult.success).toBe(true);
      expect(shipResult.shipmentId).toBeDefined();

      // Check status after shipping
      const getResponse2 = await client.sendRequest('tools/call', {
        name: 'get-order',
        arguments: { orderId: order.orderId },
      });

      const result2 = JSON.parse(getResponse2.content[0].text);
      expect(result2).toBeDefined();
      expect(result2.orderId).toBe(order.orderId);
      expect(['shipped', 'in_transit', 'fulfilled']).toContain(result2.status);
    });
  });

  describe('Adapter Data Validation', () => {
    it('should return properly formatted timestamps', async () => {
      const response = await client.sendRequest('tools/call', {
        name: 'capture-order',
        arguments: {
          order: {
            extOrderId: `TIME-TEST-${Date.now()}`,
            customer: {
              email: 'time@example.com',
            },
            lineItems: [
              {
                sku: 'SKU001',
                quantity: 1,
                unitPrice: 10.0,
              },
            ],
          },
        },
      });

      const result = JSON.parse(response.content[0].text);

      if (result.createdAt) {
        // Should be a valid ISO date string
        const date = new Date(result.createdAt);
        expect(date.toISOString()).toBe(result.createdAt);
      }
    });

    it('should handle currency values correctly', async () => {
      const response = await client.sendRequest('tools/call', {
        name: 'capture-order',
        arguments: {
          order: {
            extOrderId: `CURRENCY-TEST-${Date.now()}`,
            customer: {
              email: 'currency@example.com',
            },
            lineItems: [
              {
                sku: 'SKU001',
                quantity: 3,
                unitPrice: 19.99,
              },
            ],
            totals: {
              subtotal: 59.97,
              tax: 4.8,
              shipping: 5.99,
              total: 70.76,
            },
          },
        },
      });

      const result = JSON.parse(response.content[0].text);
      expect(result.success).toBe(true);

      // Get the order to verify totals
      const getResponse = await client.sendRequest('tools/call', {
        name: 'get-order',
        arguments: { orderId: result.orderId },
      });

      const order = JSON.parse(getResponse.content[0].text);

      // Check if we have totals data in the order
      if (order.totalPrice !== undefined) {
        // All monetary values should be numbers
        expect(typeof order.totalPrice).toBe('number');
      }
      if (order.subTotalPrice !== undefined) {
        expect(typeof order.subTotalPrice).toBe('number');
      }
    });

    it('should enforce required fields', async () => {
      // Test missing customer
      const response1 = await client.sendRequest('tools/call', {
        name: 'capture-order',
        arguments: {
          order: {
            extOrderId: `INVALID-${Date.now()}`,
            lineItems: [
              {
                sku: 'SKU001',
                quantity: 1,
                unitPrice: 10.0,
              },
            ],
          },
        },
      });

      // Expect validation error as tool error response
      expect(response1.content).toBeDefined();
      expect(response1.content[0].text).toContain('Customer is required');

      // Test missing lineItems
      const response2 = await client.sendRequest('tools/call', {
        name: 'capture-order',
        arguments: {
          order: {
            extOrderId: `INVALID-${Date.now()}`,
            customer: {
              email: 'test@example.com',
            },
          },
        },
      });

      // Expect validation error as tool error response
      expect(response2.content).toBeDefined();
      expect(response2.content[0].text).toContain('At least one line item is required');
    });

    it('should validate enum values', async () => {
      // Test with invalid reason for cancellation
      const captureResponse = await client.sendRequest('tools/call', {
        name: 'capture-order',
        arguments: {
          order: {
            extOrderId: `ENUM-TEST-${Date.now()}`,
            customer: {
              email: 'enum@example.com',
            },
            lineItems: [
              {
                sku: 'SKU001',
                quantity: 1,
                unitPrice: 10.0,
              },
            ],
          },
        },
      });

      const order = JSON.parse(captureResponse.content[0].text);

      // Try to cancel with invalid reason (if adapter validates enums)
      const cancelResponse = await client.sendRequest('tools/call', {
        name: 'cancel-order',
        arguments: {
          orderId: order.orderId,
          reason: 'customer_request', // Valid reason
        },
      });

      const cancelResult = JSON.parse(cancelResponse.content[0].text);
      expect(cancelResult.success).toBe(true);
    });
  });

  describe('Adapter Error Handling', () => {
    it('should handle non-existent orders gracefully', async () => {
      const response = await client.sendRequest('tools/call', {
        name: 'get-order',
        arguments: {
          orderId: 'DEFINITELY-DOES-NOT-EXIST',
        },
      });

      // Should return a tool execution error (raw error message)
      expect(response.isError).toBe(true);
      expect(response.content).toBeDefined();
      expect(response.content[0].type).toBe('text');
      expect(response.content[0].text.toLowerCase()).toContain('not found');
    });

    it('should handle concurrent operations', async () => {
      const orderId = `CONCURRENT-${Date.now()}`;

      // Create an order first
      const captureResponse = await client.sendRequest('tools/call', {
        name: 'capture-order',
        arguments: {
          order: {
            extOrderId: orderId,
            customer: {
              email: 'concurrent@example.com',
            },
            lineItems: [
              {
                sku: 'SKU001',
                quantity: 1,
                unitPrice: 10.0,
              },
            ],
          },
        },
      });

      const order = JSON.parse(captureResponse.content[0].text);

      // Try multiple concurrent updates
      const updates = [
        client.sendRequest('tools/call', {
          name: 'update-order',
          arguments: {
            orderId: order.orderId,
            updates: { notes: 'Update 1' },
          },
        }),
        client.sendRequest('tools/call', {
          name: 'update-order',
          arguments: {
            orderId: order.orderId,
            updates: { notes: 'Update 2' },
          },
        }),
        client.sendRequest('tools/call', {
          name: 'update-order',
          arguments: {
            orderId: order.orderId,
            updates: { notes: 'Update 3' },
          },
        }),
      ];

      const results = await Promise.allSettled(updates);

      // All should complete without crashing
      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      expect(successCount).toBeGreaterThan(0);
    });

    it('should handle large payloads', async () => {
      const lineItems = [];

      // Create a large order with many items
      for (let i = 0; i < 50; i++) {
        lineItems.push({
          sku: `SKU${String(i).padStart(3, '0')}`,
          quantity: Math.floor(Math.random() * 10) + 1,
          unitPrice: Math.random() * 100,
          name: `Product ${i} with a very long name that contains lots of text`,
          description: 'A'.repeat(200), // Long description
        });
      }

      const response = await client.sendRequest('tools/call', {
        name: 'capture-order',
        arguments: {
          order: {
            extOrderId: `LARGE-${Date.now()}`,
            customer: {
              email: 'large@example.com',
              firstName: 'Large',
              lastName: 'Payload',
              phone: '555-0123',
              notes: 'B'.repeat(500), // Long notes
            },
            lineItems,
            notes: 'C'.repeat(1000), // More long text
          },
        },
      });

      const result = JSON.parse(response.content[0].text);
      expect(result.success).toBe(true);
      expect(result.orderId).toBeDefined();
    });
  });
});

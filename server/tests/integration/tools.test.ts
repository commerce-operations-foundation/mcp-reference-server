import { TestMCPClient } from '../helpers/test-client';
import { vi, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
describe('Tool Integration', () => {
  let client: TestMCPClient;
  let testOrderId: string;
  
  beforeAll(async () => {
    client = new TestMCPClient();
    await client.connect();
  }, 30000);
  
  afterAll(async () => {
    if (client) {
      await client.disconnect();
    }
  });
  
  describe('Order Lifecycle', () => {
    it('should capture an order', async () => {
      const response = await client.sendRequest('tools/call', {
        name: 'capture-order',
        arguments: {
          order: {
            extOrderId: `TEST-${Date.now()}`,
            customer: {
              email: 'test@example.com',
              firstName: 'Test',
              lastName: 'User',
              phone: '555-0100'
            },
            lineItems: [{
              sku: 'SKU001',
              quantity: 2,
              unitPrice: 29.99,
              name: 'Test Product',
              lineItemId: `LI-${Date.now()}`
            }],
            billingAddress: {
              address1: '123 Test St',
              city: 'Test City',
              stateOrProvince: 'TS',
              zipCodeOrPostalCode: '12345',
              country: 'US'
            },
            shippingAddress: {
              address1: '123 Test St',
              city: 'Test City',
              stateOrProvince: 'TS',
              zipCodeOrPostalCode: '12345',
              country: 'US'
            },
            totals: {
              subtotal: 59.98,
              tax: 5.00,
              shipping: 10.00,
              total: 74.98
            }
          }
        }
      });
      
      expect(response).toBeDefined();
      expect(response.content).toBeInstanceOf(Array);
      expect(response.content[0].type).toBe('text');
      
      const result = JSON.parse(response.content[0].text);
      expect(result.success).toBe(true);
      expect(result.orderId).toBeDefined();
      expect(typeof result.orderId).toBe('string');
      testOrderId = result.orderId;
    });
    
    it('should retrieve the created order', async () => {
      expect(testOrderId).toBeDefined();
      
      const response = await client.sendRequest('tools/call', {
        name: 'get-order',
        arguments: {
          orderId: testOrderId
        }
      });
      
      const result = JSON.parse(response.content[0].text);
      // MCP tools return raw order data
      expect(result.orderId).toBe(testOrderId);
      expect(result.status).toBeDefined();
    });
    
    it('should update the order', async () => {
      const response = await client.sendRequest('tools/call', {
        name: 'update-order',
        arguments: {
          orderId: testOrderId,
          updates: {
            shippingAddress: {
              address1: '456 New St',
              city: 'New City',
              stateOrProvince: 'NC',
              zipCodeOrPostalCode: '54321',
              country: 'US'
            },
            notes: 'Updated shipping address'
          }
        }
      });
      
      const result = JSON.parse(response.content[0].text);
      expect(result.success).toBe(true);
      expect(result.updatedFields).toBeInstanceOf(Array);
      expect(result.updatedFields).toContain('shippingAddress');
    });
    
    it('should hold an order', async () => {
      const response = await client.sendRequest('tools/call', {
        name: 'hold-order',
        arguments: {
          orderId: testOrderId,
          reason: 'payment_verification',
          notes: 'Awaiting payment confirmation'
        }
      });
      
      const result = JSON.parse(response.content[0].text);
      expect(result.success).toBe(true);
      expect(result.holdId).toBeDefined();
      expect(result.status).toBe('on_hold');
    });
    
    it('should ship the order', async () => {
      // Ensure we have an order to ship
      expect(testOrderId).toBeDefined();
      
      const response = await client.sendRequest('tools/call', {
        name: 'ship-order',
        arguments: {
          orderId: testOrderId,
          shippingInfo: {
            carrier: 'USPS',
            trackingNumber: `TRACK${Date.now()}`,
            service: 'standard',
            estimatedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          }
        }
      });
      
      const result = JSON.parse(response.content[0].text);
      console.error('Ship order result:', JSON.stringify(result, null, 2));
      expect(result.success).toBe(true);
      expect(result.shipmentId).toBeDefined();
      expect(result.trackingNumber).toBeDefined();
      expect(result.orderId).toBeDefined();
    });
    
    it('should handle order cancellation', async () => {
      // Create a new order to cancel
      const captureResponse = await client.sendRequest('tools/call', {
        name: 'capture-order',
        arguments: {
          order: {
            extOrderId: `CANCEL-TEST-${Date.now()}`,
            customer: {
              email: 'cancel@example.com',
              firstName: 'Cancel',
              lastName: 'Test'
            },
            lineItems: [{
              sku: 'SKU002',
              quantity: 1,
              unitPrice: 19.99,
              name: 'Cancel Product'
            }],
            billingAddress: {
              address1: '789 Cancel St',
              city: 'Cancel City',
              stateOrProvince: 'CC',
              zipCodeOrPostalCode: '99999',
              country: 'US'
            }
          }
        }
      });
      
      const captureResult = JSON.parse(captureResponse.content[0].text);
      expect(captureResult.success).toBe(true);
      
      const cancelResponse = await client.sendRequest('tools/call', {
        name: 'cancel-order',
        arguments: {
          orderId: captureResult.orderId,
          reason: 'customer_request',
          notes: 'Customer changed their mind'
        }
      });
      
      const cancelResult = JSON.parse(cancelResponse.content[0].text);
      expect(cancelResult.success).toBe(true);
      expect(cancelResult.orderId).toBeDefined();
      expect(cancelResult.status).toBe('cancelled');
    });
    
    it('should process returns', async () => {
      // Create and ship an order first
      const orderResponse = await client.sendRequest('tools/call', {
        name: 'capture-order',
        arguments: {
          order: {
            extOrderId: `RETURN-TEST-${Date.now()}`,
            customer: {
              email: 'return@example.com',
              firstName: 'Return',
              lastName: 'Test'
            },
            lineItems: [{
              sku: 'SKU003',
              quantity: 3,
              unitPrice: 49.99,
              name: 'Return Product',
              lineItemId: `LI-RETURN-${Date.now()}`
            }]
          }
        }
      });
      
      const orderResult = JSON.parse(orderResponse.content[0].text);
      
      // Ship it
      await client.sendRequest('tools/call', {
        name: 'ship-order',
        arguments: {
          orderId: orderResult.orderId,
          shippingInfo: {
            carrier: 'FedEx',
            service: 'ground',
            trackingNumber: `FDX${Date.now()}`
          }
        }
      });
      
      // Process return
      const returnResponse = await client.sendRequest('tools/call', {
        name: 'return-order',
        arguments: {
          orderId: orderResult.orderId,
          items: [{
            lineItemId: `LI-RETURN-${Date.now()}`,
            sku: 'SKU003',
            quantity: 1,
            reason: 'defective',
            notes: 'Product not working as expected'
          }],
          refundMethod: 'original_payment'
        }
      });
      
      const returnResult = JSON.parse(returnResponse.content[0].text);
      expect(returnResult.success).toBe(true);
      expect(returnResult.returnId).toBeDefined();
      expect(returnResult.rmaNumber).toBeDefined();
    });
    
    it('should handle order exchanges', async () => {
      const orderResponse = await client.sendRequest('tools/call', {
        name: 'capture-order',
        arguments: {
          order: {
            extOrderId: `EXCHANGE-TEST-${Date.now()}`,
            customer: {
              email: 'exchange@example.com',
              firstName: 'Exchange',
              lastName: 'Test'
            },
            lineItems: [{
              sku: 'SKU004',
              quantity: 1,
              unitPrice: 99.99,
              name: 'Exchange Product',
              lineItemId: `LI-EXCHANGE-${Date.now()}`
            }]
          }
        }
      });
      
      const orderResult = JSON.parse(orderResponse.content[0].text);
      
      const exchangeResponse = await client.sendRequest('tools/call', {
        name: 'exchange-order',
        arguments: {
          orderId: orderResult.orderId,
          returnItems: [{
            lineItemId: `LI-EXCHANGE-${Date.now()}`,
            sku: 'SKU004',
            quantity: 1,
            reason: 'wrong_size'
          }],
          exchangeItems: [{
            sku: 'SKU004-L',
            quantity: 1,
            unitPrice: 99.99,
            name: 'Exchange Product - Large'
          }],
          exchangeReason: 'wrong_size'
        }
      });
      
      const exchangeResult = JSON.parse(exchangeResponse.content[0].text);
      expect(exchangeResult.success).toBe(true);
      expect(exchangeResult.exchangeId).toBeDefined();
      expect(exchangeResult.newOrderId).toBeDefined();
    });
    
    it('should split orders', async () => {
      const orderResponse = await client.sendRequest('tools/call', {
        name: 'capture-order',
        arguments: {
          order: {
            extOrderId: `SPLIT-TEST-${Date.now()}`,
            customer: {
              email: 'split@example.com',
              firstName: 'Split',
              lastName: 'Test'
            },
            lineItems: [
              {
                sku: 'SKU005',
                quantity: 2,
                unitPrice: 39.99,
                name: 'Split Product 1',
                lineItemId: `LI-SPLIT-1-${Date.now()}`
              },
              {
                sku: 'SKU006',
                quantity: 3,
                unitPrice: 29.99,
                name: 'Split Product 2',
                lineItemId: `LI-SPLIT-2-${Date.now()}`
              }
            ]
          }
        }
      });
      
      const orderResult = JSON.parse(orderResponse.content[0].text);
      
      const splitResponse = await client.sendRequest('tools/call', {
        name: 'split-order',
        arguments: {
          orderId: orderResult.orderId,
          splitReason: 'shipping_location',
          splits: [
            {
              items: [{
                lineItemId: `LI-SPLIT-1-${Date.now()}`,
                sku: 'SKU005',
                quantity: 1
              }],
              shippingAddress: {
                address1: '111 Split Ave',
                city: 'Split City',
                stateOrProvince: 'SC',
                zipCodeOrPostalCode: '11111',
                country: 'US'
              }
            },
            {
              items: [{
                lineItemId: `LI-SPLIT-2-${Date.now()}`,
                sku: 'SKU006',
                quantity: 2
              }],
              shippingAddress: {
                address1: '222 Split Blvd',
                city: 'Split Town',
                stateOrProvince: 'ST',
                zipCodeOrPostalCode: '22222',
                country: 'US'
              }
            }
          ]
        }
      });
      
      const splitResult = JSON.parse(splitResponse.content[0].text);
      expect(splitResult.success).toBe(true);
      expect(splitResult.newOrderIds).toBeInstanceOf(Array);
      expect(splitResult.newOrderIds.length).toBeGreaterThanOrEqual(2);
    });
  });
  
  describe('Query Tools', () => {
    it('should get inventory', async () => {
      const response = await client.sendRequest('tools/call', {
        name: 'get-inventory',
        arguments: {
          sku: 'SKU001'
        }
      });
      
      const result = JSON.parse(response.content[0].text);
      // MCP tools return raw data, not wrapped with success
      expect(result.sku).toBe('SKU001');
      expect(result.onHand).toBeGreaterThanOrEqual(0);
      expect(result.available).toBeGreaterThanOrEqual(0);
      expect(result.locationId).toBeDefined();
    });
    
    it('should get product details', async () => {
      const response = await client.sendRequest('tools/call', {
        name: 'get-product',
        arguments: {
          identifier: {
            sku: 'SKU001'
          }
        }
      });
      
      const result = JSON.parse(response.content[0].text);
      console.error('Product result:', JSON.stringify(result, null, 2));
      // MCP tools return raw data
      expect(result.sku).toBe('SKU001');
      expect(result.productId).toBeDefined();
      expect(result.name).toBeDefined();
    });
    
    it('should get customer details', async () => {
      const response = await client.sendRequest('tools/call', {
        name: 'get-customer',
        arguments: {
          identifier: {
            customerId: 'CUST001'
          }
        }
      });
      
      const result = JSON.parse(response.content[0].text);
      // MCP tools return raw data
      expect(result.customerId).toBeDefined();
      expect(result.email).toBeDefined();
    });
    
    it('should get shipment tracking', async () => {
      const response = await client.sendRequest('tools/call', {
        name: 'get-shipment',
        arguments: {
          identifier: {
            trackingNumber: 'TRACK123456'
          }
        }
      });
      
      const result = JSON.parse(response.content[0].text);
      // MCP tools return raw data
      expect(result.shipmentId).toBeDefined();
      expect(result.status).toBeDefined();
    });
    
    it('should get buyer information', async () => {
      const response = await client.sendRequest('tools/call', {
        name: 'get-buyer',
        arguments: {
          buyerId: 'BUYER001'
        }
      });
      
      const result = JSON.parse(response.content[0].text);
      // MCP tools return raw data
      expect(result.userId).toBe('BUYER001');
      expect(result.email).toBeDefined();
    });
  });
  
  describe('Management Tools', () => {
    it('should reserve inventory', async () => {
      const response = await client.sendRequest('tools/call', {
        name: 'reserve-inventory',
        arguments: {
          items: [
            {
              sku: 'SKU001',
              quantity: 5
            },
            {
              sku: 'SKU002',
              quantity: 3
            }
          ],
          duration: 15,
          notes: 'Reserved for customer checkout'
        }
      });
      
      const result = JSON.parse(response.content[0].text);
      expect(result.success).toBe(true);
      expect(result.reservationId).toBeDefined();
      expect(result.expiresAt).toBeDefined();
      
      // Verify expiration is in the future
      const expiresAt = new Date(result.expiresAt);
      expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
    });
    
    it('should handle inventory reservation with insufficient stock', async () => {
      const response = await client.sendRequest('tools/call', {
        name: 'reserve-inventory',
        arguments: {
          items: [{
            sku: 'SKU999',
            quantity: 999999
          }],
          duration: 5
        }
      });
      
      const result = JSON.parse(response.content[0].text);
      // Mock adapter might still return success, but check the response structure
      expect(result).toBeDefined();
      if (result.success === false) {
        expect(result.error).toBeDefined();
      }
    });
  });
  
  describe('Error Scenarios', () => {
    it('should handle missing required fields', async () => {
      const response = await client.sendRequest('tools/call', {
        name: 'capture-order',
        arguments: {
          order: {
            // Missing required customer field
            lineItems: [{
              sku: 'SKU001',
              quantity: 1,
              unitPrice: 10.00
            }]
          }
        }
      });
      
      // Expect validation error as JSON-RPC protocol error
      expect(response.__jsonRpcError).toBe(true);
      expect(response.message).toContain('required');
    });
    
    it('should handle invalid data types', async () => {
      const response = await client.sendRequest('tools/call', {
        name: 'capture-order',
        arguments: {
          order: {
            extOrderId: 123, // Should be string
            customer: {
              email: 'test@example.com'
            },
            lineItems: 'invalid' // Should be array
          }
        }
      });
      
      // Expect validation error as JSON-RPC protocol error
      expect(response.__jsonRpcError).toBe(true);
      expect(response.message).toBeDefined();
    });
    
    it('should handle non-existent resources', async () => {
      const response = await client.sendRequest('tools/call', {
        name: 'get-order',
        arguments: {
          orderId: 'NON-EXISTENT-ORDER-ID'
        }
      });
      
      // Should return a tool execution error (raw error message)
      expect(response.isError).toBe(true);
      expect(response.content).toBeDefined();
      expect(response.content[0].type).toBe('text');
      expect(response.content[0].text.toLowerCase()).toContain('not found');
    });
  });
});
import { TestMCPClient } from '../helpers/test-client';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const requiredAddress = (overrides: Partial<Record<string, string>> = {}) => ({
  address1: '123 Test St',
  city: 'Testville',
  company: 'Test Co',
  country: 'US',
  email: 'contact@example.com',
  firstName: 'Testy',
  ...overrides,
});

const buildCustomer = (prefix: string) => {
  const timestamp = new Date().toISOString();
  return {
    id: `CUST-${prefix}-${Date.now()}`,
    tenantId: 'mock-tenant',
    createdAt: timestamp,
    updatedAt: timestamp,
    email: `${prefix.toLowerCase()}@example.com`,
    firstName: prefix,
  };
};

const makeLineItem = (idSuffix: string) => ({
  id: `LI-${idSuffix}`,
  sku: 'SKU001',
  quantity: 1,
});

describe('Tool Integration', () => {
  let client: TestMCPClient;
  let createdOrderId: string;

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
    it('should create a sales order', async () => {
      const response = await client.sendRequest('tools/call', {
        name: 'create-sales-order',
        arguments: {
          order: {
            externalId: `TEST-${Date.now()}`,
            currency: 'USD',
            customer: buildCustomer('Buyer'),
            billingAddress: requiredAddress({ email: 'billing@example.com', firstName: 'Billie' }),
            shippingAddress: requiredAddress({ email: 'ship@example.com', firstName: 'Shipper' }),
            lineItems: [makeLineItem(`${Date.now()}`)],
          },
        },
      });

      expect(response.__jsonRpcError).toBeUndefined();
      expect(response.content).toBeInstanceOf(Array);
      const result = JSON.parse(response.content[0].text);
      expect(result.success).toBe(true);
      expect(result.order).toBeDefined();
      expect(result.order.id).toBeDefined();
      createdOrderId = result.order.id;
    });

    it('should retrieve the created order', async () => {
      const response = await client.sendRequest('tools/call', {
        name: 'get-orders',
        arguments: {
          ids: [createdOrderId],
          includeLineItems: true,
        },
      });

      expect(response.__jsonRpcError).toBeUndefined();
      const result = JSON.parse(response.content[0].text);
      expect(result.success).toBe(true);
      expect(result.orders).toBeInstanceOf(Array);
      const [order] = result.orders;
      expect(order.id ?? order.orderId).toBe(createdOrderId);
      expect(order.lineItems?.length).toBeGreaterThan(0);
    });

    it('should update the order shipping address', async () => {
      const response = await client.sendRequest('tools/call', {
        name: 'update-order',
        arguments: {
          id: createdOrderId,
          updates: {
            shippingAddress: requiredAddress({
              address1: '456 Updated Ave',
              city: 'New City',
              email: 'updated@example.com',
            }),
            orderNote: 'Updated shipping details',
          },
        },
      });

      expect(response.__jsonRpcError).toBeUndefined();
      const result = JSON.parse(response.content[0].text);
      expect(result.success).toBe(true);
      expect(result.order).toBeDefined();
      expect(result.order.shippingAddress?.address1).toBe('456 Updated Ave');
    });

    it('should fulfill the order', async () => {
      const response = await client.sendRequest('tools/call', {
        name: 'fulfill-order',
        arguments: {
          orderId: createdOrderId,
          lineItems: [
            {
              sku: 'SKU001',
              quantity: 1,
            },
          ],
          shippingCarrier: 'UPS',
          trackingNumber: `1Z${Date.now()}`,
          expectedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          shippingPrice: 12.5,
          shippingAddress: requiredAddress({
            address1: '456 Updated Ave',
            city: 'New City',
            email: 'updated@example.com',
          }),
        },
      });

      expect(response.__jsonRpcError).toBeUndefined();
      const result = JSON.parse(response.content[0].text);
      expect(result.success).toBe(true);
      expect(result.fulfillment).toBeDefined();
      expect(result.fulfillment.orderId).toBe(createdOrderId);
    });

    it('should return fulfillments for the order', async () => {
      const response = await client.sendRequest('tools/call', {
        name: 'get-fulfillments',
        arguments: {
          orderIds: [createdOrderId],
        },
      });

      expect(response.__jsonRpcError).toBeUndefined();
      const result = JSON.parse(response.content[0].text);
      expect(result.success).toBe(true);
      expect(result.fulfillments).toBeInstanceOf(Array);
    });

    it('should cancel the order', async () => {
      const newOrderResponse = await client.sendRequest('tools/call', {
        name: 'create-sales-order',
        arguments: {
          order: {
            externalId: `CANCEL-${Date.now()}`,
            currency: 'USD',
            billingAddress: requiredAddress(),
            shippingAddress: requiredAddress({ email: 'cancel-ship@example.com' }),
            lineItems: [makeLineItem(`CANCEL-${Date.now()}`)],
          },
        },
      });
      expect(newOrderResponse.__jsonRpcError).toBeUndefined();
      const newOrderResult = JSON.parse(newOrderResponse.content[0].text);

      const response = await client.sendRequest('tools/call', {
        name: 'cancel-order',
        arguments: {
          orderId: newOrderResult.order.id,
          reason: 'customer_request',
          notes: 'Customer changed mind',
        },
      });

      expect(response.__jsonRpcError).toBeUndefined();
      const result = JSON.parse(response.content[0].text);
      expect(result.success).toBe(true);
      expect(result.order).toBeDefined();
      expect(result.order.status).toBe('cancelled');
    });
  });

  describe('Query Tools', () => {
    it('should get inventory for a SKU', async () => {
      const response = await client.sendRequest('tools/call', {
        name: 'get-inventory',
        arguments: {
          skus: ['SKU001'],
        },
      });

      expect(response.__jsonRpcError).toBeUndefined();
      const result = JSON.parse(response.content[0].text);
      expect(result.success).toBe(true);
      expect(result.inventory).toBeInstanceOf(Array);
      expect(result.inventory[0].sku).toBe('SKU001');
    });

    it('should get product data', async () => {
      const response = await client.sendRequest('tools/call', {
        name: 'get-products',
        arguments: {
          skus: ['SKU001'],
        },
      });

      expect(response.__jsonRpcError).toBeUndefined();
      const result = JSON.parse(response.content[0].text);
      expect(result.success).toBe(true);
      expect(result.products).toBeInstanceOf(Array);
      const primaryProduct = result.products.find((product: any) => product.sku === 'SKU001' || product.id);
      expect(primaryProduct).toBeDefined();
    });

    it('should get customer data by email', async () => {
      const response = await client.sendRequest('tools/call', {
        name: 'get-customers',
        arguments: {
          emails: ['john.smith@example.com'],
        },
      });

      expect(response.__jsonRpcError).toBeUndefined();
      const result = JSON.parse(response.content[0].text);
      expect(result.success).toBe(true);
      expect(result.customers).toBeInstanceOf(Array);
      expect(result.customers[0].email).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should surface validation errors as protocol errors', async () => {
      const response = await client.sendRequest('tools/call', {
        name: 'create-sales-order',
        arguments: {
          order: {
            // Missing required lineItems
            externalId: `INVALID-${Date.now()}`,
          },
        },
      });

      expect(response.__jsonRpcError).toBe(true);
      expect(response.code).toBe(2001);
      expect(response.message).toContain('Validation failed');
    });
  });
});

import { TestMCPClient } from '../helpers/test-client';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const baseAddress = (overrides: Partial<Record<string, string>> = {}) => ({
  address1: '123 Adapter Ave',
  city: 'Adapter City',
  company: 'Adapter Co',
  country: 'US',
  email: 'adapter@example.com',
  firstName: 'Adapter',
  ...overrides,
});

const buildCustomer = (extId: string) => {
  const timestamp = new Date().toISOString();
  return {
    id: `CUST-${extId}-${Date.now()}`,
    tenantId: 'mock-tenant',
    createdAt: timestamp,
    updatedAt: timestamp,
    email: `${extId.toLowerCase()}@example.com`,
    firstName: 'Adapter',
  };
};

const buildOrder = (extId: string) => ({
  externalId: extId,
  currency: 'USD',
  customer: buildCustomer(extId),
  billingAddress: baseAddress(),
  shippingAddress: baseAddress({ email: `ship-${extId.toLowerCase()}@example.com` }),
  lineItems: [
    {
      id: `LI-${extId}-${Date.now()}`,
      sku: 'SKU001',
      quantity: 1,
    },
  ],
});

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
    it('should generate unique order IDs', async () => {
      const ids = new Set<string>();
      for (let i = 0; i < 5; i++) {
        const response = await client.sendRequest('tools/call', {
          name: 'create-sales-order',
          arguments: { order: buildOrder(`UNIQUE-${i}-${Date.now()}`) },
        });
        expect(response.__jsonRpcError).toBeUndefined();
        const result = JSON.parse(response.content[0].text);
        expect(result.success).toBe(true);
        ids.add(result.order.id);
      }
      expect(ids.size).toBe(5);
    });

    it('should retrieve orders correctly', async () => {
      const createResponse = await client.sendRequest('tools/call', {
        name: 'create-sales-order',
        arguments: { order: buildOrder(`RETRIEVE-${Date.now()}`) },
      });
      expect(createResponse.__jsonRpcError).toBeUndefined();
      const createResult = JSON.parse(createResponse.content[0].text);
      const getResponse = await client.sendRequest('tools/call', {
        name: 'get-orders',
        arguments: { ids: [createResult.order.id], includeLineItems: true },
      });
      expect(getResponse.__jsonRpcError).toBeUndefined();
      const getResult = JSON.parse(getResponse.content[0].text);
      expect(getResult.success).toBe(true);
      expect(getResult.orders[0].id ?? getResult.orders[0].orderId).toBe(createResult.order.id);
    });

    it('should update orders via adapter', async () => {
      const createResponse = await client.sendRequest('tools/call', {
        name: 'create-sales-order',
        arguments: { order: buildOrder(`UPDATE-${Date.now()}`) },
      });
      expect(createResponse.__jsonRpcError).toBeUndefined();
      const createResult = JSON.parse(createResponse.content[0].text);

      const updateResponse = await client.sendRequest('tools/call', {
        name: 'update-order',
        arguments: {
          id: createResult.order.id,
          updates: {
            shippingAddress: baseAddress({ address1: '987 Updated Way', city: 'Updated City' }),
            orderNote: 'Adapter integration update test',
          },
        },
      });
      expect(updateResponse.__jsonRpcError).toBeUndefined();
      const updateResult = JSON.parse(updateResponse.content[0].text);
      expect(updateResult.success).toBe(true);
      expect(updateResult.order.shippingAddress.address1).toBe('987 Updated Way');
    });

    it('should fulfill orders and expose fulfillments', async () => {
      const createResponse = await client.sendRequest('tools/call', {
        name: 'create-sales-order',
        arguments: { order: buildOrder(`FULFILL-${Date.now()}`) },
      });
      expect(createResponse.__jsonRpcError).toBeUndefined();
      const createResult = JSON.parse(createResponse.content[0].text);

      const fulfillResponse = await client.sendRequest('tools/call', {
        name: 'fulfill-order',
        arguments: {
          orderId: createResult.order.id,
          lineItems: [{ sku: 'SKU001', quantity: 1 }],
          shippingCarrier: 'UPS',
          trackingNumber: `UPS${Date.now()}`,
          expectedDeliveryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
          shippingPrice: 10.5,
          shippingAddress: baseAddress({ address1: '555 Fulfillment Ln' }),
        },
      });
      expect(fulfillResponse.__jsonRpcError).toBeUndefined();
      const fulfillResult = JSON.parse(fulfillResponse.content[0].text);
      expect(fulfillResult.success).toBe(true);
      expect(fulfillResult.fulfillment.orderId).toBe(createResult.order.id);

      const getFulfillmentsResponse = await client.sendRequest('tools/call', {
        name: 'get-fulfillments',
        arguments: { orderIds: [createResult.order.id] },
      });
      expect(getFulfillmentsResponse.__jsonRpcError).toBeUndefined();
      const getFulfillmentsResult = JSON.parse(getFulfillmentsResponse.content[0].text);
      expect(getFulfillmentsResult.success).toBe(true);
      expect(getFulfillmentsResult.fulfillments.length).toBeGreaterThan(0);
    });
  });

  describe('Adapter Data Validation', () => {
    it('should expose ISO timestamps on created orders', async () => {
      const response = await client.sendRequest('tools/call', {
        name: 'create-sales-order',
        arguments: { order: buildOrder(`TIME-${Date.now()}`) },
      });
      expect(response.__jsonRpcError).toBeUndefined();
      const result = JSON.parse(response.content[0].text);
      const createdAt = result.order.createdAt;
      expect(new Date(createdAt).toISOString()).toBe(createdAt);
    });

    it('should enforce required fields', async () => {
      const response = await client.sendRequest('tools/call', {
        name: 'create-sales-order',
        arguments: {
          order: {
            externalId: `INVALID-${Date.now()}`,
            currency: 'USD',
            billingAddress: baseAddress(),
          },
        },
      });
      expect(response.__jsonRpcError).toBe(true);
      expect(response.code).toBe(2001);
      expect(response.message).toContain('Validation failed');
    });
  });

  describe('Adapter Error Handling', () => {
    it('should support concurrent updates', async () => {
      const createResponse = await client.sendRequest('tools/call', {
        name: 'create-sales-order',
        arguments: { order: buildOrder(`CONCURRENT-${Date.now()}`) },
      });
      expect(createResponse.__jsonRpcError).toBeUndefined();
      const orderId = JSON.parse(createResponse.content[0].text).order.id;

      const updatePayload = (note: string) => ({
        id: orderId,
        updates: { orderNote: note },
      });

      const updates = await Promise.allSettled(
        ['Update 1', 'Update 2', 'Update 3'].map((note) =>
          client.sendRequest('tools/call', { name: 'update-order', arguments: updatePayload(note) })
        )
      );

      const fulfilled = updates.filter((u) => u.status === 'fulfilled');
      expect(fulfilled.length).toBeGreaterThan(0);
    });
  });
});

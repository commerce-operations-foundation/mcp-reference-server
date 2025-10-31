import { TestMCPClient } from '../helpers/test-client';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

const address = (overrides: Partial<Record<string, string>> = {}) => ({
  address1: '200 Workflow Way',
  city: 'Flowtown',
  company: 'Workflow Co',
  country: 'US',
  email: 'workflow@example.com',
  firstName: 'Flow',
  ...overrides,
});

const buildCustomer = (prefix: string) => {
  const timestamp = new Date().toISOString();
  return {
    id: `WF-CUST-${prefix}-${Date.now()}`,
    tenantId: 'mock-tenant',
    createdAt: timestamp,
    updatedAt: timestamp,
    email: `${prefix.toLowerCase()}@example.com`,
    firstName: prefix,
  };
};

const buildOrderPayload = (prefix: string) => ({
  externalId: `${prefix}-${Date.now()}`,
  currency: 'USD',
  customer: buildCustomer(prefix),
  billingAddress: address({ email: `${prefix.toLowerCase()}-bill@example.com` }),
  shippingAddress: address({ email: `${prefix.toLowerCase()}-ship@example.com` }),
  lineItems: [
    {
      id: `LI-${prefix}-${Date.now()}`,
      sku: 'SKU001',
      quantity: 1,
    },
  ],
});

describe('E2E Workflows', () => {
  let client: TestMCPClient;

  beforeEach(async () => {
    client = new TestMCPClient();
    await client.connect();
  }, 30000);

  afterEach(async () => {
    if (client) {
      await client.disconnect();
    }
  }, 10000);

  it('should complete order capture through fulfillment', async () => {
    const inventoryResponse = await client.sendRequest('tools/call', {
      name: 'get-inventory',
      arguments: { skus: ['SKU001'] },
    });
    expect(inventoryResponse.__jsonRpcError).toBeUndefined();
    const inventory = JSON.parse(inventoryResponse.content[0].text);
    expect(inventory.success).toBe(true);

    const createResponse = await client.sendRequest('tools/call', {
      name: 'create-sales-order',
      arguments: { order: buildOrderPayload('DELIVERY') },
    });
    expect(createResponse.__jsonRpcError).toBeUndefined();
    const createResult = JSON.parse(createResponse.content[0].text);
    expect(createResult.success).toBe(true);
    const orderId = createResult.order.id;

    const getOrderResponse = await client.sendRequest('tools/call', {
      name: 'get-orders',
      arguments: { ids: [orderId], includeLineItems: true },
    });
    expect(getOrderResponse.__jsonRpcError).toBeUndefined();
    const orderResult = JSON.parse(getOrderResponse.content[0].text);
    expect(orderResult.success).toBe(true);
    expect(orderResult.orders[0].id ?? orderResult.orders[0].orderId).toBe(orderId);

    const fulfillResponse = await client.sendRequest('tools/call', {
      name: 'fulfill-order',
      arguments: {
        orderId,
        lineItems: [
          {
            sku: 'SKU001',
            quantity: 1,
          },
        ],
        shippingCarrier: 'FedEx',
        trackingNumbers: [`FDX${Date.now()}`],
        expectedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        shippingPrice: 18,
        shippingAddress: address({ address1: '400 Delivered Rd' }),
      },
    });
    expect(fulfillResponse.__jsonRpcError).toBeUndefined();
    const fulfillResult = JSON.parse(fulfillResponse.content[0].text);
    expect(fulfillResult.success).toBe(true);
    expect(fulfillResult.fulfillment.orderId).toBe(orderId);

    const getFulfillmentsResponse = await client.sendRequest('tools/call', {
      name: 'get-fulfillments',
      arguments: { orderIds: [orderId] },
    });
    expect(getFulfillmentsResponse.__jsonRpcError).toBeUndefined();
    const fulfillmentResult = JSON.parse(getFulfillmentsResponse.content[0].text);
    expect(fulfillmentResult.success).toBe(true);
    expect(fulfillmentResult.fulfillments.length).toBeGreaterThan(0);
  });

  it('should support order updates and cancellation', async () => {
    const createResponse = await client.sendRequest('tools/call', {
      name: 'create-sales-order',
      arguments: { order: buildOrderPayload('MODIFY') },
    });
    expect(createResponse.__jsonRpcError).toBeUndefined();
    const createResult = JSON.parse(createResponse.content[0].text);
    const orderId = createResult.order.id;

    const updateResponse = await client.sendRequest('tools/call', {
      name: 'update-order',
      arguments: {
        id: orderId,
        updates: {
          shippingAddress: address({ address1: '789 Updated St', city: 'Modify City' }),
          orderNote: 'Updated during workflow test',
        },
      },
    });
    expect(updateResponse.__jsonRpcError).toBeUndefined();
    const updateResult = JSON.parse(updateResponse.content[0].text);
    expect(updateResult.success).toBe(true);
    expect(updateResult.order.shippingAddress.address1).toBe('789 Updated St');

    const cancelResponse = await client.sendRequest('tools/call', {
      name: 'cancel-order',
      arguments: {
        orderId,
        reason: 'customer_request',
        notes: 'Requested cancellation during workflow test',
      },
    });
    expect(cancelResponse.__jsonRpcError).toBeUndefined();
    const cancelResult = JSON.parse(cancelResponse.content[0].text);
    expect(cancelResult.success).toBe(true);
    expect(cancelResult.order.status).toBe('cancelled');
  });
});

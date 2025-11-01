import YourFulfillmentAdapter from '@yourcompany/uois-adapter-yourfulfillment';

async function main() {
  const adapter = new YourFulfillmentAdapter({
    type: 'npm',
    package: '@yourcompany/uois-adapter-yourfulfillment',
    options: {
      apiUrl: 'https://api.yourfulfillment.com',
      apiKey: process.env.API_KEY || '',
      workspace: process.env.WORKSPACE,
      timeout: 20_000,
      retryAttempts: 5,
      debugMode: true,
    }
  } as any);

  await adapter.connect();

  // Example: capture an order with custom fields
  const result = await adapter.captureOrder({
    extOrderId: `ADV-${Date.now()}`,
    customer: { email: 'adv@example.com' },
    lineItems: [ { sku: 'SKU-ADV', quantity: 1, unitPrice: 49.99 } ],
    currency: 'USD',
    customFields: [ { name: 'channel', value: 'partner' } ]
  } as any);

  console.log('Captured order:', result);
  await adapter.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });


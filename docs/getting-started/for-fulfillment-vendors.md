# Getting Started: For Fulfillment Vendors

Build a Commerce Operations Foundation adapter for your fulfillment system using the provided template and the ten tools exposed by the reference server.

## 1. Set Up the Template

```bash
git clone https://github.com/cof-org/mcp-reference-server.git
cd mcp-reference-server
cp -r adapter-template your-fulfillment-adapter
cd your-fulfillment-adapter
npm install
```

Update `package.json`, rename the adapter class, and configure the connection options in `src/adapter.ts`.

## 2. Implement Required Methods

The `IFulfillmentAdapter` interface (exported from `@cof-org/mcp`) defines:

- Lifecycle: `connect`, `disconnect`, `healthCheck`
- Action operations: `createSalesOrder`, `cancelOrder`, `updateOrder`, `fulfillOrder`
- Query operations: `getOrders`, `getCustomers`, `getProducts`, `getProductVariants`, `getInventory`, `getFulfillments`

Start by wiring each method to your API client. The template provides helper functions (`success`, `failure`, `transform...`) to keep responses consistent.

Example skeleton for `createSalesOrder`:

```typescript
async createSalesOrder(input: CreateSalesOrderInput): Promise<OrderResult> {
  const payload = mapToYourApi(input);
  const response = await this.client.post('/orders', payload);

  if (!response.success || !response.data) {
    return this.failure('Failed to create order', response.error);
  }

  return this.success({ order: mapOrder(response.data) });
}
```

## 3. Expose Adapter Options

Accept configuration via the constructor and `ADAPTER_CONFIG` JSON. Document required fields in `docs/CONFIGURATION.md` and provide a `.env.example` file.

```typescript
constructor(config: any = {}) {
  const options = config.options || config;
  this.options = {
    apiUrl: options.apiUrl,
    apiKey: options.apiKey,
    workspace: options.workspace,
    timeout: options.timeout ?? 30000
  };
  this.client = new ApiClient(this.options);
}
```

## 4. Test Locally

```bash
# In your adapter project
npm run build

# Run the reference server with your adapter
cd ../server
npm install
npm run build
ADAPTER_TYPE=local \
ADAPTER_PATH=../your-fulfillment-adapter/dist/index.js \
node dist/index.js
```

Use the mock data in the server tests as a reference for expected payloads.

## 5. Write Automated Tests

Add unit tests under `tests/` in your adapter project. Aim to cover:

- Successful lifecycle (connect/disconnect)
- Happy paths for each action/query method
- Error cases (invalid input, upstream failures)

```typescript
it('creates an order', async () => {
  const adapter = new YourFulfillmentAdapter({ apiUrl: mock.url, apiKey: 'test' });
  await adapter.connect();

  const result = await adapter.createSalesOrder(sampleOrder);
  expect(result.success).toBe(true);
});
```

## 6. Publish or Distribute

- **Private deployment**: bundle the adapter with your MCP server and use `ADAPTER_TYPE=local`.
- **NPM package**: publish under your scope so retailers can set `ADAPTER_TYPE=npm` and `ADAPTER_PACKAGE=@yourcompany/adapter`.
- **Documentation**: update `README.md`, `docs/API.md`, and `docs/CONFIGURATION.md` with configuration steps, examples, and troubleshooting tips.

## 7. Verification Checklist

- [ ] All lifecycle methods implemented
- [ ] Ten core tools return properly typed payloads
- [ ] Input validation and error codes documented
- [ ] Adapter options exposed via `ADAPTER_CONFIG`
- [ ] Automated tests pass (`npm test`)
- [ ] README explains installation and configuration

With these steps complete, your fulfillment system will be ready for AI-driven integrations powered by the MCP server.

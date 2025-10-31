# API Documentation

## YourFulfillment Adapter Reference

This document describes how the template adapter maps to the interfaces exposed by `@cof-org/mcp`.

## Initialization

```typescript
import { YourFulfillmentAdapter } from '@yourcompany/uois-adapter-yourfulfillment';

const adapter = new YourFulfillmentAdapter({
  apiUrl: 'https://api.yourfulfillment.com',
  apiKey: 'your-api-key',
  workspace: 'your-workspace',
  timeout: 30000,
  retryAttempts: 3,
  debugMode: false
});
```

Configuration options correspond to the `AdapterOptions` type in `src/types.ts` and are provided via the constructor or `ADAPTER_CONFIG` JSON when loaded by the server.

## Lifecycle Methods

| Method | Purpose |
| ------ | ------- |
| `connect()` | Authenticate and verify API connectivity. |
| `disconnect()` | Clean up resources and terminate sessions. |
| `healthCheck()` | Return a `HealthStatus` describing adapter health. |

## Action Operations

| Method | Input | Result |
| ------ | ----- | ------ |
| `createSalesOrder(input: CreateSalesOrderInput)` | Standard order payload | `OrderResult` with the created order |
| `cancelOrder(input: CancelOrderInput)` | Order ID plus optional metadata | `OrderResult` with the cancelled order |
| `updateOrder(input: UpdateOrderInput)` | Partial order update | `OrderResult` with the updated order |
| `fulfillOrder(input: FulfillOrderInput)` | Fulfillment request | `FulfillmentToolResult<{ fulfillment: Fulfillment }>` |

Each method should translate between platform types and your API’s payloads, then wrap responses with `success`/`failure` helpers as shown in `src/adapter.ts`.

## Query Operations

| Method | Description |
| ------ | ----------- |
| `getOrders(input: GetOrdersInput)` | Returns orders matching filter criteria. |
| `getCustomers(input: GetCustomersInput)` | Retrieves customer summaries. |
| `getProducts(input: GetProductsInput)` | Returns catalog records. |
| `getProductVariants(input: GetProductVariantsInput)` | Fetches variant SKUs. |
| `getInventory(input: GetInventoryInput)` | Reports stock levels. |
| `getFulfillments(input: GetFulfillmentsInput)` | Lists fulfillment records. |

All responses use the `FulfillmentToolResult<T>` union declared in `@cof-org/mcp`. On failure, include adapter specific error metadata so downstream tools can diagnose issues.

## Error Handling

Throw or return `AdapterError` instances with a `code` that callers can interpret. The template defines `ErrorCode` values in `src/types.ts`; extend that enum or supply string literals that make sense for your integration.

Example:

```typescript
if (!response.success) {
  throw new AdapterError('Order not found', ErrorCode.ORDER_NOT_FOUND, response.error);
}
```

## Type Definitions

Reference `@cof-org/mcp` for shared fulfillment models and `src/types.ts` for YourFulfillment-specific shapes. Maintaining strict typing in adapters ensures the server’s JSON Schema validation continues to succeed.

## Best Practices

1. **Always call `connect`** before invoking action/query methods.
2. **Wrap outbound calls** with retry/backoff logic using the provided API client.
3. **Return consistent metadata** (e.g., order numbers, timestamps) so downstream tooling can present clear answers.
4. **Use `ADAPTER_CONFIG`** for credentials and behavior toggles instead of hardcoding values.

For complete implementation examples, review `src/adapter.ts` within this template.

# API Documentation

## YourFulfillment Adapter API Reference

This document provides detailed information about the YourFulfillment adapter implementation and its methods.

## Table of Contents

- [Initialization](#initialization)
- [Lifecycle Methods](#lifecycle-methods)
- [Order Actions](#order-actions)
- [Management Operations](#management-operations)
- [Query Operations](#query-operations)
- [Error Handling](#error-handling)
- [Type Definitions](#type-definitions)

## Initialization

```typescript
import { YourFulfillmentAdapter } from '@yourcompany/uois-adapter-yourfulfillment';

const adapter = new YourFulfillmentAdapter({
  apiUrl: 'https://api.yourfulfillment.com',
  apiKey: 'your-api-key',
  workspace: 'your-workspace', // optional
  timeout: 30000,              // optional, default: 30000ms
  retryAttempts: 3,            // optional, default: 3
  debugMode: false             // optional, default: false
});
```

### Configuration Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `apiUrl` | `string` | Yes | - | Base URL of your Fulfillment API |
| `apiKey` | `string` | Yes | - | API key for authentication |
| `workspace` | `string` | No | - | Workspace or tenant identifier |
| `timeout` | `number` | No | 30000 | Request timeout in milliseconds |
| `retryAttempts` | `number` | No | 3 | Number of retry attempts |
| `debugMode` | `boolean` | No | false | Enable debug logging |

## Lifecycle Methods

### connect()

Establishes connection to the Fulfillment API.

```typescript
await adapter.connect();
```

**Returns:** `Promise<void>`

**Throws:** 
- `AdapterError` with code `CONNECTION_FAILED` if connection fails

### disconnect()

Closes the connection to the Fulfillment API.

```typescript
await adapter.disconnect();
```

**Returns:** `Promise<void>`

### healthCheck()

Checks the health status of the Fulfillment connection.

```typescript
const health = await adapter.healthCheck();
```

**Returns:** `Promise<HealthStatus>`

```typescript
interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: HealthCheck[];
  version?: string;
}
```

## Order Actions

### captureOrder(params)

Creates a new order in the Fulfillment.

```typescript
const result = await adapter.captureOrder({
  extOrderId: 'EXT-001',
  customer: {
    customerId: 'CUST-001',
    email: 'customer@example.com',
    firstName: 'John',
    lastName: 'Doe'
  },
  lineItems: [
    {
      sku: 'PROD-001',
      name: 'Product Name',
      quantity: 2,
      price: 29.99
    }
  ],
  totalPrice: 59.98
});
```

**Parameters:** `OrderRequest`

**Returns:** `Promise<OrderResult>`

```typescript
interface OrderResult {
  success: boolean;
  orderId: string;
  orderNumber?: string;
  status: string;
  createdAt: string;
  message?: string;
}
```

### cancelOrder(orderId, reason?)

Cancels an existing order.

```typescript
const result = await adapter.cancelOrder('ORDER-001', 'Customer request');
```

**Parameters:**
- `orderId: string` - The order ID to cancel
- `reason?: string` - Optional cancellation reason

**Returns:** `Promise<CancelResult>`

**Throws:**
- `AdapterError` with adapter-defined `code` values (for example `ORDER_NOT_FOUND`, `INVALID_ORDER_STATE`)

### updateOrder(orderId, updates)

Updates an existing order.

```typescript
const result = await adapter.updateOrder('ORDER-001', {
  status: 'processing',
  notes: 'Updated shipping address',
  shippingAddress: {
    // ... new address
  }
});
```

**Parameters:**
- `orderId: string` - The order ID to update
- `updates: OrderUpdates` - Fields to update

**Returns:** `Promise<UpdateResult>`

### returnOrder(orderId, items)

Processes a return for an order.

```typescript
const result = await adapter.returnOrder('ORDER-001', [
  {
    sku: 'PROD-001',
    quantity: 1,
    reason: 'defective',
    condition: 'damaged'
  }
]);
```

**Parameters:**
- `orderId: string` - The order ID
- `items: ReturnItem[]` - Items to return

**Returns:** `Promise<ReturnResult>`

### exchangeOrder(params)

Processes an exchange for an order.

```typescript
const result = await adapter.exchangeOrder({
  orderId: 'ORDER-001',
  returnItems: [
    { sku: 'PROD-001', quantity: 1 }
  ],
  newItems: [
    { sku: 'PROD-002', quantity: 1 }
  ],
  reason: 'size_issue'
});
```

**Parameters:** `ExchangeParams`

**Returns:** `Promise<ExchangeResult>`

### shipOrder(orderId, shipping)

Creates a shipment for an order.

```typescript
const result = await adapter.shipOrder('ORDER-001', {
  carrier: 'UPS',
  service: 'Ground',
  trackingNumber: 'TRK123456',
  items: [
    { sku: 'PROD-001', quantity: 2 }
  ]
});
```

**Parameters:**
- `orderId: string` - The order ID
- `shipping: ShippingInfo` - Shipping details

**Returns:** `Promise<ShipmentResult>`

## Management Operations

### holdOrder(orderId, holdParams)

Places an order on hold.

```typescript
const result = await adapter.holdOrder('ORDER-001', {
  reason: 'Payment verification',
  until: '2024-01-02T00:00:00Z',
  autoRelease: true,
  notes: 'Waiting for payment confirmation'
});
```

**Parameters:**
- `orderId: string` - The order ID
- `holdParams: HoldParams` - Hold parameters

**Returns:** `Promise<HoldResult>`

### splitOrder(orderId, splits)

Splits an order into multiple shipments.

```typescript
const result = await adapter.splitOrder('ORDER-001', [
  {
    items: [{ sku: 'PROD-001', quantity: 1 }],
    warehouse: 'WAREHOUSE-A',
    shipDate: '2024-01-01'
  },
  {
    items: [{ sku: 'PROD-002', quantity: 1 }],
    warehouse: 'WAREHOUSE-B',
    shipDate: '2024-01-02'
  }
]);
```

**Parameters:**
- `orderId: string` - The order ID
- `splits: SplitParams[]` - Split configuration

**Returns:** `Promise<SplitResult>`

### reserveInventory(items, duration?)

Reserves inventory for specified items.

```typescript
const result = await adapter.reserveInventory(
  [
    { sku: 'PROD-001', quantity: 5, locationId: 'LOC-001' },
    { sku: 'PROD-002', quantity: 3 }
  ],
  15 // minutes
);
```

**Parameters:**
- `items: InventoryItem[]` - Items to reserve
- `duration?: number` - Reservation duration in minutes (default: 15)

**Returns:** `Promise<ReservationResult>`

**Throws:**
- `AdapterError` with an inventory-related `code` (for example `INSUFFICIENT_INVENTORY`)

## Query Operations

### getOrder(identifier)

Retrieves order details.

```typescript
// By order ID
const order = await adapter.getOrder({ orderId: 'ORDER-001' });

// By order number
const order = await adapter.getOrder({ orderNumber: 'ORD-2024-001' });
```

**Parameters:** `OrderIdentifier`
- Either `orderId` or `orderNumber` must be provided

**Returns:** `Promise<Order>`

**Throws:**
- `AdapterError` with an order lookup `code` (for example `ORDER_NOT_FOUND`)

### getInventory(sku, locationId?)

Retrieves inventory levels for a SKU.

```typescript
const inventory = await adapter.getInventory('PROD-001', 'LOC-001');
```

**Parameters:**
- `sku: string` - Product SKU
- `locationId?: string` - Optional location ID

**Returns:** `Promise<Inventory>`

### getProduct(identifier)

Retrieves product information.

```typescript
// By product ID
const product = await adapter.getProduct({ productId: 'PROD-001' });

// By SKU
const product = await adapter.getProduct({ sku: 'SKU-001' });
```

**Parameters:** `ProductIdentifier`
- Either `productId` or `sku` must be provided

**Returns:** `Promise<Product>`

**Throws:**
- `ProductNotFoundError` if product doesn't exist

### getCustomer(identifier)

Retrieves customer information.

```typescript
// By customer ID
const customer = await adapter.getCustomer({ customerId: 'CUST-001' });

// By email
const customer = await adapter.getCustomer({ email: 'customer@example.com' });
```

**Parameters:** `CustomerIdentifier`
- Either `customerId` or `email` must be provided

**Returns:** `Promise<Customer>`

**Throws:**
- `CustomerNotFoundError` if customer doesn't exist

### getShipment(identifier)

Retrieves shipment tracking information.

```typescript
// By shipment ID
const shipment = await adapter.getShipment({ shipmentId: 'SHIP-001' });

// By tracking number
const shipment = await adapter.getShipment({ trackingNumber: 'TRK123456' });
```

**Parameters:** `ShipmentIdentifier`
- Either `shipmentId` or `trackingNumber` must be provided

**Returns:** `Promise<Shipment>`

### getBuyer(buyerId)

Retrieves buyer information.

```typescript
const buyer = await adapter.getBuyer('BUYER-001');
```

**Parameters:**
- `buyerId: string` - The buyer ID

**Returns:** `Promise<Buyer>`

## Error Handling

The adapter uses typed errors for different failure scenarios:

### AdapterError

Base error class for all adapter errors.

```typescript
class AdapterError extends Error {
  code: string;
  details?: any;
}
```

### Adapter Error Codes

Adapters should throw `AdapterError` instances with descriptive `code` values (for example `ORDER_NOT_FOUND`, `INSUFFICIENT_INVENTORY`). The framework wraps these in a `FulfillmentError` with `data.originalError` so downstream clients can branch on adapter-specific semantics.

### Error Handling Example

```typescript
try {
  await adapter.cancelOrder('ORDER-001');
} catch (error) {
  if (error instanceof AdapterError) {
    switch (error.code) {
      case 'ORDER_NOT_FOUND':
        console.error('Order not found:', error.details);
        break;
      case 'INVALID_ORDER_STATE':
        console.error('Cannot cancel order in current state:', error.details);
        break;
      default:
        console.error('Adapter error:', error.code, error.message);
    }
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Type Definitions

### Core Types

All type definitions are imported from the UOIS standard:

```typescript
import {
  Order,
  Customer,
  Product,
  Inventory,
  Shipment,
  Buyer
} from '@uois/mcp-server/types/fulfillment';

import {
  IFulfillmentAdapter,
  HealthStatus,
  OrderResult,
  CancelResult,
  // ... other result types
} from '@uois/mcp-server/types/adapter';
```

### Custom Types

YourFulfillment-specific types are defined in `src/types.ts`:

```typescript
import {
  AdapterOptions,
  YourFulfillmentOrder,
  YourFulfillmentProduct,
  // ... other custom types
} from '@yourcompany/uois-adapter-yourfulfillment';
```

## Status Mapping

The adapter maps between YourFulfillment statuses and UOIS standard statuses:

| YourFulfillment Status | UOIS Status |
|---------------|-------------|
| `new` | `pending` |
| `processing` | `processing` |
| `shipped` | `shipped` |
| `delivered` | `delivered` |
| `cancelled` | `cancelled` |
| `on_hold` | `on_hold` |
| `refunded` | `refunded` |

## Rate Limiting

The adapter implements automatic retry logic with exponential backoff for:
- Network errors
- 5xx server errors
- Rate limit errors (429)
- Timeout errors (408)

Default retry configuration:
- Maximum attempts: 3
- Initial delay: 1 second
- Maximum delay: 10 seconds
- Backoff multiplier: 2

## Best Practices

1. **Always connect before operations**
   ```typescript
   await adapter.connect();
   // ... perform operations
   await adapter.disconnect();
   ```

2. **Use try-catch for error handling**
   ```typescript
   try {
     const result = await adapter.captureOrder(params);
   } catch (error) {
     // Handle specific error types
   }
   ```

3. **Enable debug mode during development**
   ```typescript
   const adapter = new YourFulfillmentAdapter({
     // ...
     debugMode: true
   });
   ```

4. **Check inventory before capturing orders**
   ```typescript
   const inventory = await adapter.getInventory(sku);
   if (inventory.available >= quantity) {
     await adapter.captureOrder(params);
   }
   ```

5. **Use reservations for cart operations**
   ```typescript
   const reservation = await adapter.reserveInventory(items, 15);
   // ... complete checkout
   ```

## Support

For issues or questions about the adapter:
- GitHub: [github.com/yourcompany/yourfulfillment-adapter](https://github.com/yourcompany/yourfulfillment-adapter)
- Email: support@yourcompany.com
- Documentation: [docs.yourfulfillment.com](https://docs.yourfulfillment.com)

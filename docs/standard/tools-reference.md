# Tools Reference

## Overview

The Universal Order Interchange Standard defines 15 core tools that cover the complete order lifecycle. Each tool has a specific purpose, defined parameters, and expected responses. These tools provide a standardized interface for fulfillment operations across different e-commerce platforms and fulfillment systems (Fulfillment).

## Tool Categories

### Order Actions (6 tools)
Primary operations that create or modify orders in the system. These tools handle the core order lifecycle operations from creation through fulfillment and returns.

### Management Tools (3 tools)
Administrative operations for order handling, including inventory management, order splitting, and hold operations. These tools enable advanced order orchestration scenarios.

### Query Tools (6 tools)
Read-only operations for retrieving information about orders, customers, products, inventory, and shipments. These tools provide the data needed for order visibility and decision-making.

---

## Order Actions

### capture-order
Creates a new order in the system, initializing the order workflow and reserving inventory. This is typically the first step in the order lifecycle, triggered after checkout completion or order placement through any channel (web, mobile, B2B portal, etc.).

**Parameters:**
- **Input Schema**: [Order Schema](../../schemas/order.json) (only `extOrderId` is required, but typical usage includes customer, items, and addresses)

**Example Request:**
```json
{
  "order": {
    "extOrderId": "WEB-2024-1234",
    "customer": {
      "email": "john.smith@example.com",
      "firstName": "John",
      "lastName": "Smith",
      "phone": "+1-555-0123"
    },
    "items": [{
      "sku": "WIDGET-001",
      "quantity": 2,
      "unitPrice": 29.99,
      "name": "Premium Widget"
    }],
    "billingAddress": {
      "address1": "123 Main St",
      "city": "New York",
      "stateOrProvince": "NY",
      "zipCodeOrPostalCode": "10001",
      "country": "US"
    },
    "shippingAddress": {
      "address1": "123 Main St",
      "city": "New York",
      "stateOrProvince": "NY",
      "zipCodeOrPostalCode": "10001",
      "country": "US"
    },
    "currency": "USD"
  }
}
```

**Returns:**
```typescript
{
  success: boolean
  orderId: string        // Internal system order ID
  orderNumber: string    // Customer-facing order number
  status: "pending" | "confirmed"
  createdAt: string     // ISO 8601 timestamp
}
```

---

### cancel-order
Cancels an existing order, triggering refund processes and inventory release. This tool handles both full and partial cancellations, managing the complex workflow of unwinding an order including payment reversals, inventory adjustments, and customer notifications.

**Parameters:**
- **orderId** (required): The internal order ID or external order ID
- **reason** (optional): Cancellation reason for tracking and analytics
- **notifyCustomer** (optional): Whether to send cancellation notification

**Example Request:**
```json
{
  "orderId": "ORD-2024-1234",
  "reason": "Customer requested cancellation",
  "notifyCustomer": true
}
```

**Returns:**
```typescript
{
  success: boolean
  orderId: string
  status: "cancelled"
  cancelledAt: string      // ISO 8601 timestamp
  refundInitiated: boolean  // Whether refund process has started
}
```

---

### update-order
Modifies an existing order's details while maintaining order integrity and audit trail. This tool supports address corrections, item modifications (quantity, SKU changes), and metadata updates. Updates are validated against business rules and inventory availability.

**Parameters:**
- **Input Schema**: Partial [Order Schema](../../schemas/order.json) with only the fields to update

**Example Request:**
```json
{
  "orderId": "ORD-2024-1234",
  "updates": {
    "shippingAddress": {
      "address1": "456 Oak Ave",
      "address2": "Suite 200",
      "city": "San Francisco",
      "stateOrProvince": "CA",
      "zipCodeOrPostalCode": "94102"
    },
    "items": [{
      "lineItemId": "LI-001",
      "quantity": 3
    }],
    "customFields": [{
      "name": "giftMessage",
      "value": "Happy Birthday!"
    }]
  }
}
```

**Returns:**
```typescript
{
  success: boolean
  orderId: string
  updatedFields: string[]  // List of modified fields
  version: number          // Order version for optimistic locking
}
```

---

### return-order
Initiates a return merchandise authorization (RMA) process for an order. This tool manages the complete return workflow including RMA generation, return label creation, refund calculation, and inventory disposition. Supports both full and partial returns with configurable refund methods.

**Parameters:**
- **orderId** (required): The order to return
- **items** (required): Array of items to return with reasons
- **refundMethod** (optional): How to process the refund

**Example Request:**
```json
{
  "orderId": "ORD-2024-1234",
  "items": [{
    "sku": "WIDGET-001",
    "quantity": 1,
    "reason": "Defective product",
    "condition": "damaged"
  }],
  "refundMethod": "original",
  "returnShippingPaid": "customer"
}
```

**Returns:**
```typescript
{
  success: boolean
  returnId: string         // Internal return ID
  rmaNumber: string        // Customer-facing RMA number
  status: "pending" | "approved"
  refundAmount: number     // Calculated refund amount
  returnLabel?: string     // URL to return shipping label
}
```

---

### exchange-order
Processes an exchange of items, coordinating returns and replacements in a single transaction. This tool handles size/color exchanges, product upgrades, and warranty replacements while managing the financial reconciliation between returned and new items.

**Parameters:**
- **orderId** (required): Original order ID
- **returnItems** (required): Items being returned
- **newItems** (required): Replacement items
- **reason** (required): Exchange reason

**Example Request:**
```json
{
  "orderId": "ORD-2024-1234",
  "returnItems": [{
    "lineItemId": "LI-001",
    "sku": "SHIRT-M-BLUE",
    "quantity": 1,
    "reason": "Wrong size"
  }],
  "newItems": [{
    "sku": "SHIRT-L-BLUE",
    "quantity": 1,
    "price": 29.99
  }],
  "reason": "Size exchange"
}
```

**Returns:**
```typescript
{
  success: boolean
  exchangeId: string       // Exchange transaction ID
  originalOrderId: string
  newOrderId: string       // New order for replacement items
  priceDifference: number  // Amount owed/refunded
  rmaNumber?: string       // Return authorization if needed
}
```

---

### ship-order
Marks an order or specific items as shipped, triggering customer notifications and carrier integrations. This tool supports both full and partial shipments, enabling split fulfillment scenarios across multiple warehouses or shipping dates.

**Parameters:**
- **orderId** (required): Order being shipped
- **trackingNumber** (optional): Carrier tracking number
- **carrier** (optional): Shipping carrier name
- **items** (optional): Specific line item IDs for partial shipment

**Example Request:**
```json
{
  "orderId": "ORD-2024-1234",
  "trackingNumber": "1Z999AA10123456784",
  "carrier": "UPS",
  "items": ["LI-001", "LI-002"],
  "shipFromWarehouse": "WH-EAST",
  "shippingMethod": "GROUND"
}
```

**Returns:**
```typescript
{
  success: boolean
  shipmentId: string       // Internal shipment ID
  trackingNumber: string   // Carrier tracking number
  carrier: string          // Carrier name
  shippedAt: string        // ISO 8601 ship timestamp
  trackingUrl?: string     // Direct tracking link
  estimatedDelivery?: string
}
```

---

## Management Tools

### hold-order
Places an order on hold, preventing fulfillment while issues are resolved. This tool manages various hold scenarios including payment verification, fraud review, inventory shortages, or custom business rules. Holds are tracked and can be automatically released based on conditions.

**Parameters:**
- **orderId** (required): Order to place on hold
- **reason** (required): Hold reason category
- **notes** (optional): Detailed explanation
- **expectedReleaseDate** (optional): Anticipated resolution

**Example Request:**
```json
{
  "orderId": "ORD-2024-1234",
  "reason": "payment",
  "notes": "Credit card verification pending",
  "expectedReleaseDate": "2024-01-15T14:00:00Z"
}
```

**Returns:**
```typescript
{
  success: boolean
  orderId: string
  holdId: string          // Hold tracking ID
  status: "on_hold"
  reason: string
  autoRelease?: boolean   // If automatic release is configured
}
```

---

### split-order
Splits an order into multiple shipments or sub-orders for complex fulfillment scenarios. This tool enables drop-shipping, multi-warehouse fulfillment, and scheduled deliveries by dividing orders based on item availability, location, or customer preferences.

**Parameters:**
- **orderId** (required): Order to split
- **splits** (required): Array defining how to split the order

**Example Request:**
```json
{
  "orderId": "ORD-2024-1234",
  "splits": [{
    "items": ["LI-001", "LI-002"],
    "shippingAddress": {
      "address1": "123 Main St",
      "city": "New York",
      "stateOrProvince": "NY",
      "zipCodeOrPostalCode": "10001",
      "country": "US"
    },
    "warehouse": "WH-EAST"
  }, {
    "items": ["LI-003"],
    "warehouse": "WH-WEST",
    "shipDate": "2024-01-20"
  }]
}
```

**Returns:**
```typescript
{
  success: boolean
  originalOrderId: string
  newOrderIds: string[]    // Created sub-order IDs
  splitCount: number       // Number of splits created
  shipments: [{            // Shipment plan for each split
    orderId: string
    warehouse: string
    estimatedShipDate: string
  }]
}
```

---

### reserve-inventory
Reserves inventory for a specified duration to guarantee availability during checkout or order processing. This tool implements soft allocation logic, preventing overselling while maintaining inventory efficiency through time-based expiration.

**Parameters:**
- **items** (required): Array of items to reserve
- **duration** (optional): Reservation duration in minutes (default: 15)
- **Input Schema**: Uses [Inventory Schema](../../schemas/inventory.json) structure

**Example Request:**
```json
{
  "items": [{
    "sku": "WIDGET-001",
    "quantity": 5,
    "warehouseId": "WH-EAST"
  }],
  "duration": 30,
  "customerId": "CUST-123"
}
```

**Returns:**
```typescript
{
  success: boolean
  reservationId: string    // Reservation tracking ID
  items: [{
    sku: string
    reserved: number       // Quantity successfully reserved
    available: number      // Remaining available
  }]
  expiresAt: string       // ISO 8601 expiration timestamp
}
```

---

## Query Tools

### get-order
Retrieves comprehensive order details including line items, addresses, payment information, and order history. This is the primary tool for order visibility, supporting lookup by either internal order ID or customer-facing order number.

**Parameters:**
- **orderId** or **orderNumber** (one required): Order identifier
- **includeItems** (optional): Include full line item details
- **includeHistory** (optional): Include order event history
- **Output Schema**: [Order Schema](../../schemas/order.json)

**Example Request:**
```json
{
  "orderNumber": "WEB-2024-1234",
  "includeItems": true,
  "includeHistory": true
}
```

**Returns:**
```typescript
{
  order: Order            // Full order object per schema
  items?: OrderItem[]     // Detailed line items if requested
  history?: OrderEvent[]  // Audit trail of order events
}
```

---

### get-inventory
Checks real-time inventory levels across warehouses and channels. This tool provides ATP (Available to Promise) calculations, considering on-hand inventory, reservations, and incoming stock. Essential for order promising and fulfillment decisions.

**Parameters:**
- **sku** (required): Product SKU to check
- **warehouseId** (optional): Specific warehouse to query
- **includeReserved** (optional): Include reserved quantities
- **Output Schema**: [Inventory Schema](../../schemas/inventory.json)

**Example Request:**
```json
{
  "sku": "WIDGET-001",
  "warehouseId": "WH-EAST",
  "includeReserved": true
}
```

**Returns:**
```typescript
{
  sku: string
  available: number        // ATP quantity
  reserved: number         // Currently reserved
  incoming: number         // On order/in transit
  warehouses: [{           // Breakdown by location
    warehouseId: string
    available: number
    reserved: number
    location: string
  }]
}
```

---

### get-product
Retrieves product catalog information including attributes, pricing, and variants. This tool provides the product master data needed for order capture, validation, and fulfillment operations.

**Parameters:**
- **productId** or **sku** (one required): Product identifier
- **includeVariants** (optional): Include all product variants
- **Output Schema**: [Product Schema](../../schemas/product.json)

**Example Request:**
```json
{
  "sku": "WIDGET-001",
  "includeVariants": true
}
```

**Returns:**
```typescript
{
  product: Product         // Full product details per schema
  variants?: [{            // Product variations if requested
    sku: string
    attributes: object
    price: number
  }]
  inventory?: {            // Current inventory summary
    totalAvailable: number
    byWarehouse: object
  }
}
```

---

### get-customer
Retrieves customer profile information including contact details, addresses, and order history. This tool supports CRM integration and personalized order experiences by providing comprehensive customer context.

**Parameters:**
- **customerId** or **email** (one required): Customer identifier
- **includeOrders** (optional): Include order history
- **Output Schema**: [Customer Schema](../../schemas/customer.json)

**Example Request:**
```json
{
  "email": "john.smith@example.com",
  "includeOrders": true
}
```

**Returns:**
```typescript
{
  customer: Customer       // Full customer profile per schema
  orderHistory?: [{        // Recent orders if requested
    orderId: string
    orderDate: string
    total: number
    status: string
  }]
  loyaltyStatus?: {        // Loyalty program information
    tier: string
    points: number
    memberSince: string
  }
}
```

---

### get-shipment
Tracks shipment status and delivery progress. This tool integrates with carrier APIs to provide real-time tracking information, delivery estimates, and shipment events throughout the fulfillment journey.

**Parameters:**
- **shipmentId** or **trackingNumber** (one required): Shipment identifier
- **includeEvents** (optional): Include detailed tracking events
- **Output Schema**: [Shipment Schema](../../schemas/shipment.json)

**Example Request:**
```json
{
  "trackingNumber": "1Z999AA10123456784",
  "includeEvents": true
}
```

**Returns:**
```typescript
{
  shipment: Shipment       // Full shipment details per schema
  trackingEvents?: [{      // Tracking history if requested
    timestamp: string
    location: string
    status: string
    description: string
  }]
  estimatedDelivery?: string  // Carrier's delivery estimate
  currentLocation?: string    // Last known location
}
```

---

### get-buyer
Retrieves buyer account information in B2B contexts. This tool provides access to corporate buyer profiles including payment terms, credit limits, approved addresses, and purchasing authorization. Essential for B2B order workflows and account-based pricing.

**Parameters:**
- **buyerId** (required): Buyer account identifier
- **includePaymentMethods** (optional): Include payment methods on file
- **Output Schema**: [Buyer Schema](../../schemas/buyer.json)

**Example Request:**
```json
{
  "buyerId": "ACME-CORP-001",
  "includePaymentMethods": true
}
```

**Returns:**
```typescript
{
  buyer: Buyer             // Full buyer profile per schema
  paymentMethods?: [{      // Approved payment methods
    type: string
    lastFour?: string
    expiryDate?: string
  }]
  addresses?: Address[]    // Approved shipping/billing addresses
  creditLimit?: number     // Available credit
  paymentTerms?: string    // NET30, NET60, etc.
}
```

---

## Common Data Types

### Address
```typescript
{
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
}
```

### Money
```typescript
{
  amount: number
  currency: string  // ISO 4217 code
}
```

### OrderStatus
```typescript
type OrderStatus = 
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded"
  | "on_hold"
```

---

## Error Handling

All tools may return errors in this format:

```typescript
{
  error: {
    code: number
    message: string
    details?: object
    retryable: boolean
  }
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| 2001 | Invalid parameters |
| 2002 | Missing required field |
| 3001 | Order not found |
| 3002 | Insufficient inventory |
| 3003 | Payment failed |
| 4001 | System unavailable |
| 5001 | Fulfillment-specific error |

---

For the authoritative taxonomy, code ranges, and retryability guidance, see the canonical [Error Model](error-model.md).

## Best Practices

### 1. Idempotency
Design operations to be safely retryable:
```typescript
// Include idempotency key
{
  orderId: "ORD-123",
  idempotencyKey: "unique-request-id"
}
```

### 2. Validation
Always validate inputs before processing:
```typescript
// Check inventory before capture
await get-inventory({ sku: "WIDGET-001" })
await capture-order({ ... })
```

### 3. Error Recovery
Handle failures gracefully:
```typescript
try {
  await capture-order(params)
} catch (error) {
  if (error.retryable) {
    // Retry with backoff
  } else {
    // Handle permanent failure
  }
}
```

### 4. Batch Operations
Use splits for efficiency:
```typescript
// Instead of multiple calls
await reserve-inventory({ items: allItems })
```

---

*Continue to: [Architecture Overview →](overview.md)*

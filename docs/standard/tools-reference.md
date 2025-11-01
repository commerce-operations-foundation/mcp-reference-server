# Tools Reference

The reference MCP server currently exposes ten fulfillment tools grouped into action and query categories. All tools conform to the `ToolDescription` contract defined in the server source (`server/src/tools`).

## Action Tools

### create-sales-order
Creates a new order in the downstream fulfillment system. Typical usage includes checkout completion, marketplace imports, or manual order entry.

**Input**: `CreateSalesOrderInput`

**Result**: `OrderResult` with the persisted order record.

### cancel-order
Cancels an existing order with optional reasons and customer notification flags.

**Input**: `CancelOrderInput`

**Result**: `OrderResult` reflecting the cancelled order.

### update-order
Applies partial updates to an order (addresses, metadata, line items, etc.).

**Input**: `UpdateOrderInput`

**Result**: `OrderResult` with the updated order document.

### fulfill-order
Marks an order as fulfilled and returns fulfillment details such as tracking numbers and line-item statuses.

**Input**: `FulfillOrderInput`

**Result**: `FulfillmentToolResult<{ fulfillment: Fulfillment }>`.

### create-return
Creates a new return for items from an existing order. Handles customer returns, exchanges, and RMA workflows.

**Input**: `CreateReturnInput`

**Result**: `ReturnResult` with the persisted return record.

## Query Tools

### get-orders
Returns paginated orders with filtering by status, date range, external identifiers, and more.

**Input**: `GetOrdersInput`

**Result**: `FulfillmentToolResult<{ orders: Order[] }>`.

### get-customers
Fetches customer records matching search filters.

**Input**: `GetCustomersInput`

**Result**: `FulfillmentToolResult<{ customers: Customer[] }>`.

### get-products
Retrieves catalog products with optional filtering by SKU, tags, or updated timestamps.

**Input**: `GetProductsInput`

**Result**: `FulfillmentToolResult<{ products: Product[] }>`.

### get-product-variants
Returns variant-level product records for multi-SKU catalog structures.

**Input**: `GetProductVariantsInput`

**Result**: `FulfillmentToolResult<{ productVariants: ProductVariant[] }>`.

### get-inventory
Reports inventory balances for SKUs across locations.

**Input**: `GetInventoryInput`

**Result**: `FulfillmentToolResult<{ inventory: InventoryItem[] }>`.

### get-fulfillments
Lists fulfillment records created for orders, including shipment information.

**Input**: `GetFulfillmentsInput`

**Result**: `FulfillmentToolResult<{ fulfillments: Fulfillment[] }>`.

### get-returns
Retrieves return records with filtering by return attributes and date ranges.

**Input**: `GetReturnsInput`

**Result**: `FulfillmentToolResult<{ returns: Return[] }>`.

---

All request/response schemas are generated from the TypeScript definitions in `server/src/schemas` and validated at runtime through JSON Schema. Consult those source files for the authoritative schema definitions.

# Getting Started: For AI Platforms

## Enable Commerce in Your AI Agent in Minutes

This guide shows AI platform developers how to integrate fulfillment capabilities using the Universal Order Interchange Standard.

## Prerequisites

- MCP client library for your platform
- Access to an MCP-compliant Fulfillment server
- Basic understanding of tool calling

## Quick Start

### Step 1: Connect to an MCP Server

```typescript
import { MCPClient } from '@modelcontextprotocol/sdk';

const client = new MCPClient();
await client.connect({
  command: 'node',
  args: ['/absolute/path/to/mcp-reference-server/server/dist/index.js'],
  env: {
    ADAPTER_TYPE: 'built-in',
    ADAPTER_NAME: 'mock'
  }
});
```

### Step 2: Discover Available Tools

```typescript
const tools = await client.listTools();
console.log(tools);
// Output: ['create-sales-order', 'cancel-order', 'get-orders', ...]
```

### Step 3: Enable in Your AI

```python
# For OpenAI-style function calling
functions = [
  {
    "name": "create-sales-order",
    "description": "Create a new order",
    "parameters": tools['create-sales-order'].schema
  }
]

response = ai.complete(
  prompt="Order 2 blue widgets",
  functions=functions
)
```

## Complete Integration Example

### ChatGPT Custom GPT

```yaml
name: Commerce Assistant
description: AI that can process orders
actions:
  - type: mcp
    server: universal-fulfillment
    tools:
      - create-sales-order
      - get-orders
      - cancel-order
      - fulfill-order
```

### Claude Project

```json
{
  "name": "E-commerce Agent",
  "mcp_servers": [{
    "command": "npx",
    "args": ["/absolute/path/to/mcp-reference-server/server/dist/index.js"],
    "env": {
      "ADAPTER_TYPE": "built-in",
      "ADAPTER_NAME": "mock"
    }
  }]
}
```

### Custom AI Agent

```typescript
class CommerceAgent {
  private mcp: MCPClient;
  
  async processOrder(customerIntent: string) {
    // Parse intent
    const order = await this.parseIntent(customerIntent);
    
    // Check inventory
    const inventory = await this.mcp.call('get-inventory', {
      sku: order.items[0].sku
    });

    if (inventory.available >= order.quantity) {
      // Create order
      const result = await this.mcp.call('create-sales-order', {
        order: order
      });

      return `Order ${result.orderNumber} created!`;
    } else {
      return "Sorry, that item is out of stock.";
    }
  }
}
```

## Common Workflows

### 1. Order Placement Flow

```typescript
async function placeOrder(customerData, items) {
  // 1. Validate inventory
  for (const item of items) {
    const inv = await mcp.call('get-inventory', { 
      sku: item.sku 
    });
    if (inv.available < item.quantity) {
      throw new Error(`${item.sku} out of stock`);
    }
  }
  
  // 2. Create order
  const order = await mcp.call('create-sales-order', {
    order: {
      customer: customerData,
      items: items,
      shipping: customerData.address
    }
  });

  // 3. Trigger fulfillment when ready
  const fulfillment = await mcp.call('fulfill-order', {
    orderId: order.order.id,
    tracking: {
      carrier: 'UPS',
      service: 'Ground',
      trackingNumber: '1Z999AA10123456784'
    }
  });

  return { order, fulfillment };
}
```

### 2. Order Status Check

```typescript
async function checkOrderStatus(query) {
  // Natural language to order lookup
  const orderId = await extractOrderId(query);
  
  const orders = await mcp.call('get-orders', {
    orderIds: [orderId],
    includeItems: true
  });
  const order = orders.orders?.[0];
  
  return formatOrderStatus(order);
}
```

### 3. Return Processing

```typescript
async function fetchFulfillmentSummary(orderId) {
  const fulfillments = await mcp.call('get-fulfillments', {
    orderIds: [orderId]
  });
  return fulfillments.fulfillments;
}
```

## Natural Language Mapping

### Intent Recognition Examples

| User Says | Tool to Call | Parameters |
|-----------|--------------|------------|
| "Order 2 blue widgets" | create-sales-order | Extract quantity, SKU |
| "Cancel my order" | cancel-order | Find order ID from context |
| "Where's my package?" | get-fulfillments | Order ID or tracking |
| "Update the address" | update-order | Parse new address |
| "Show my recent orders" | get-orders | Customer identifier |

### Response Generation

```typescript
function generateResponse(tool, result) {
  const templates = {
    'create-sales-order': `Great! I've placed your order #${result.orderNumber}`,
    'cancel-order': `Your order has been cancelled. Refund will process in 3-5 days.`,
    'get-fulfillments': `Your order is ${result.fulfillments[0]?.status}. Tracking: ${result.fulfillments[0]?.trackingNumber}`,
    'update-order': `All set—I've applied the updates to your order.`
  };
  
  return templates[tool] || 'Operation completed successfully';
}
```

## Error Handling

### Graceful Failures

```typescript
try {
  const result = await mcp.call('create-sales-order', params);
  return success(result);
} catch (error) {
  switch(error.code) {
    case 3002: // Insufficient inventory
      return "Sorry, that item is currently out of stock.";
    case 3003: // Payment failed
      return "Payment couldn't be processed. Please try another card.";
    case 4001: // System unavailable
      return "Orders are temporarily unavailable. Please try again.";
    default:
      return "Something went wrong. Let me help you another way.";
  }
}
```

## Testing Your Integration

### 1. Use the Mock Server

```bash
# Start mock server with test data
cd /absolute/path/to/mcp-reference-server/server
npm run build
ADAPTER_TYPE=built-in ADAPTER_NAME=mock node dist/index.js
```

### 2. Test Scenarios

```typescript
const testCases = [
  {
    name: "Happy path order",
    input: { /* valid order */ },
    expected: { success: true }
  },
  {
    name: "Out of stock",
    input: { sku: "OOS-ITEM" },
    expected: { error: 3002 }
  },
  {
    name: "Invalid address",
    input: { /* bad address */ },
    expected: { error: 2001 }
  }
];
```

### 3. Load Testing

```typescript
// Concurrent operations test
const promises = [];
for (let i = 0; i < 100; i++) {
  promises.push(mcp.call('get-orders', { orderIds: [`TEST-${i}`] }));
}
const results = await Promise.all(promises);
```

## Production Checklist

### Before Going Live

- [ ] Error handling for all tools
- [ ] Retry logic with exponential backoff
- [ ] Rate limiting implementation
- [ ] Audit logging enabled
- [ ] Performance monitoring setup
- [ ] Fallback behavior defined
- [ ] User consent for orders
- [ ] Payment validation flow

### Security Considerations

```typescript
// Always validate before processing
async function secureOrderFlow(userInput) {
  // 1. Authenticate user
  const user = await authenticate();
  
  // 2. Validate permissions
  if (!user.canOrder) throw new Error('Unauthorized');
  
  // 3. Sanitize input
  const sanitized = sanitizeOrderData(userInput);
  
  // 4. Add security metadata
  sanitized.metadata = {
    userId: user.id,
    sessionId: session.id,
    timestamp: new Date().toISOString()
  };
  
  // 5. Process order
  return await mcp.call('create-sales-order', { order: sanitized });
}
```

## Optimization Tips

### 1. Cache Frequently Accessed Data
```typescript
const cache = new Map();

async function getCachedInventory(sku) {
  if (!cache.has(sku) || isExpired(cache.get(sku))) {
    const data = await mcp.call('get-inventory', { sku });
    cache.set(sku, { data, timestamp: Date.now() });
  }
  return cache.get(sku).data;
}
```

### 2. Batch Operations
```typescript
// Instead of multiple calls
const items = await Promise.all(
  skus.map(sku => mcp.call('get-inventory', { sku }))
);
```

### 3. Progressive Disclosure
```typescript
// Start with minimal data
const summaryResult = await mcp.call('get-orders', {
  orderIds: [id],
  includeItems: false
});
const summary = summaryResult.orders?.[0];

// Load details only if needed
if (userWantsDetails) {
  const fullResult = await mcp.call('get-orders', {
    orderIds: [id],
    includeItems: true
  });
  const full = fullResult.orders?.[0];
}
```

## Support Resources

- **Documentation**: [Full API Reference](../standard/tools-reference.md)
- **Examples**: [GitHub Examples Repository](https://github.com/TODO-ORG/TODO-EXAMPLES)
- **Community**: [Discord Server](https://discord.gg/TODO-INVITE)
- **Support**: developers@todo-domain.example

## Next Steps

1. [Review the complete Tools Reference](../standard/tools-reference.md)
2. [Understand the Architecture](../architecture/system-architecture.md)
3. [Explore Configuration Options](../guides/configuration.md)
4. [Learn About Testing](../testing/README.md)

---

*Ready to make your Fulfillment AI-compatible? See [For Fulfillment Vendors →](for-fulfillment-vendors.md)*

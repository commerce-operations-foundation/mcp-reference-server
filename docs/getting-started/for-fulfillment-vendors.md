# Getting Started: For Fulfillment Vendors

This guide helps Fulfillment vendors create and publish adapters for the Universal Fulfillment MCP Server, enabling your customers to integrate your Fulfillment with AI agents through a standardized interface.

## Overview

As a fulfillment vendor, you can create an adapter that allows the Universal Fulfillment MCP Server to communicate with your system. By publishing your adapter as an NPM package, you make it easy for your customers to:

- Install and configure the integration with a simple `npm install`
- Receive updates and bug fixes through standard NPM versioning
- Use your Fulfillment with any AI agent that supports the MCP protocol

## Prerequisites

Before starting, ensure you have:

- Node.js 18+ and npm installed
- TypeScript knowledge (recommended)
- Access to your Fulfillment API documentation
- An NPM account for publishing (create one at [npmjs.com](https://www.npmjs.com))

## Quick Start

### Step 1: Install the Adapter Template

We provide an official adapter template to get you started quickly:

```bash
# Clone the adapter template
git clone https://github.com/TODO-ORG/TODO-REPO.git
cd TODO-REPO/adapter-template

# Install dependencies
npm install

# Copy to your project directory
cp -r . ../my-fulfillment-adapter
cd ../my-fulfillment-adapter
```

### Step 2: Configure Your Project

Update `package.json` with your vendor information:

```json
{
  "name": "@yourcompany/cof-fulfillment-adapter-yourfulfillment",
  "version": "1.0.0",
  "description": "Commerce Operations Foundation adapter for YourFulfillment",
  "author": "Your Company Name",
  "homepage": "https://yourcompany.com",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourcompany/your-fulfillment-adapter"
  },
  "keywords": [
    "cof",
    "fulfillment",
    "adapter",
    "mcp"
  ]
}
```

### Step 3: Implement the Adapter Interface

The adapter must implement the `IFulfillmentAdapter` interface. Here's a complete example:

```typescript
// src/adapter.ts
import { IFulfillmentAdapter, HealthStatus } from '@cof-org/mcp/types';
import {
  Order, OrderParams, OrderResult,
  CancelResult, UpdateResult, ReturnResult,
  ExchangeResult, ShipmentResult, HoldResult,
  SplitResult, ReservationResult,
  Product, Customer, Inventory, Shipment, Buyer
} from '@cof-org/mcp/types/fulfillment';

export class YourFulfillmentAdapter implements IFulfillmentAdapter {
  private apiClient: YourAPIClient;
  private connected: boolean = false;

  constructor(private options: AdapterOptions) {
    // Initialize your API client
    this.apiClient = new YourAPIClient({
      baseUrl: options.apiUrl || 'https://api.yourfulfillment.com',
      apiKey: options.apiKey,
      workspace: options.workspace,
      timeout: options.timeout || 30000
    });
  }

  // ===== Lifecycle Methods =====

  async connect(): Promise<void> {
    try {
      // Verify connection to your Fulfillment
      await this.apiClient.authenticate();
      this.connected = true;
      console.log(`Connected to ${this.options.apiUrl}`);
    } catch (error) {
      throw new Error(`Failed to connect to YourFulfillment: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    // Clean up any resources if needed
  }

  async healthCheck(): Promise<HealthStatus> {
    try {
      const health = await this.apiClient.get('/health');
      return {
        healthy: true,
        message: 'YourFulfillment is operational',
        details: {
          version: health.version,
          uptime: health.uptime
        }
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Health check failed: ${error.message}`
      };
    }
  }

  // ===== Order Actions (6 methods) =====

  async captureOrder(params: OrderParams): Promise<OrderResult> {
    // Transform UOIS format to your Fulfillment format
    const fulfillmentOrder = {
      external_reference: params.extOrderId,
      customer: {
        id: params.customer.customerId,
        email: params.customer.email,
        name: `${params.customer.firstName} ${params.customer.lastName}`,
        phone: params.customer.phone
      },
      line_items: params.items.map(item => ({
        sku: item.sku,
        quantity: item.quantity,
        unit_price: item.price,
        name: item.name
      })),
      shipping_address: params.shippingAddress,
      billing_address: params.billingAddress || params.shippingAddress
    };

    // Call your Fulfillment API
    const response = await this.apiClient.post('/orders', fulfillmentOrder);

    // Transform response back to UOIS format
    return {
      success: true,
      orderId: response.id,
      orderNumber: response.order_number,
      status: this.mapOrderStatus(response.status),
      createdAt: response.created_at
    };
  }

  async cancelOrder(orderId: string, reason?: string, notifyCustomer?: boolean): Promise<CancelResult> {
    const response = await this.apiClient.post(`/orders/${orderId}/cancel`, {
      reason: reason || 'Cancelled by request',
      notify_customer: notifyCustomer ?? true
    });

    return {
      success: response.success,
      orderId: orderId,
      status: 'cancelled',
      cancelledAt: response.cancelled_at,
      refundAmount: response.refund_amount
    };
  }

  async updateOrder(orderId: string, updates: any): Promise<UpdateResult> {
    // Map updates to your Fulfillment format
    const response = await this.apiClient.patch(`/orders/${orderId}`, updates);

    return {
      success: true,
      orderId: orderId,
      updatedFields: Object.keys(updates),
      newStatus: response.status
    };
  }

  async returnOrder(orderId: string, items: any[], refundMethod?: string): Promise<ReturnResult> {
    const response = await this.apiClient.post(`/orders/${orderId}/returns`, {
      items: items,
      refund_method: refundMethod || 'original_payment'
    });

    return {
      success: true,
      returnId: response.return_id,
      orderId: orderId,
      status: 'return_initiated',
      refundAmount: response.refund_amount
    };
  }

  async exchangeOrder(params: any): Promise<ExchangeResult> {
    // Implement exchange logic
    const response = await this.apiClient.post('/exchanges', params);

    return {
      success: true,
      exchangeId: response.exchange_id,
      originalOrderId: params.orderId,
      newOrderId: response.new_order_id
    };
  }

  async shipOrder(orderId: string, shipping: any): Promise<ShipmentResult> {
    const response = await this.apiClient.post(`/orders/${orderId}/ship`, shipping);

    return {
      success: true,
      shipmentId: response.shipment_id,
      trackingNumber: response.tracking_number,
      carrier: response.carrier,
      estimatedDelivery: response.estimated_delivery
    };
  }

  // ===== Management Operations (3 methods) =====

  async holdOrder(orderId: string, params: any): Promise<HoldResult> {
    const response = await this.apiClient.post(`/orders/${orderId}/hold`, params);

    return {
      success: true,
      orderId: orderId,
      holdReason: params.reason,
      holdUntil: params.until
    };
  }

  async splitOrder(orderId: string, splits: any[]): Promise<SplitResult> {
    const response = await this.apiClient.post(`/orders/${orderId}/split`, { splits });

    return {
      success: true,
      originalOrderId: orderId,
      splitOrderIds: response.split_order_ids
    };
  }

  async reserveInventory(items: any[], duration?: number): Promise<ReservationResult> {
    const response = await this.apiClient.post('/inventory/reserve', {
      items: items,
      duration_minutes: duration || 60
    });

    return {
      success: true,
      reservationId: response.reservation_id,
      expiresAt: response.expires_at,
      reservedItems: response.items
    };
  }

  // ===== Query Operations (6 methods) =====

  async getOrder(identifier: { orderId?: string; orderNumber?: string }): Promise<Order> {
    let response;

    if (identifier.orderId) {
      response = await this.apiClient.get(`/orders/${identifier.orderId}`);
    } else if (identifier.orderNumber) {
      response = await this.apiClient.get(`/orders/by-number/${identifier.orderNumber}`);
    } else {
      throw new Error('Either orderId or orderNumber must be provided');
    }

    return this.transformToOrder(response);
  }

  async getInventory(sku: string, warehouseId?: string): Promise<Inventory> {
    const params = warehouseId ? { warehouse: warehouseId } : {};
    const response = await this.apiClient.get(`/inventory/${sku}`, params);

    return {
      sku: sku,
      available: response.available_quantity,
      onHand: response.on_hand_quantity,
      reserved: response.reserved_quantity,
      warehouseId: response.warehouse_id
    };
  }

  async getProduct(identifier: { productId?: string; sku?: string }): Promise<Product> {
    let response;

    if (identifier.productId) {
      response = await this.apiClient.get(`/products/${identifier.productId}`);
    } else if (identifier.sku) {
      response = await this.apiClient.get(`/products/by-sku/${identifier.sku}`);
    } else {
      throw new Error('Either productId or sku must be provided');
    }

    return {
      productId: response.id,
      sku: response.sku,
      name: response.name,
      description: response.description,
      price: response.price,
      weight: response.weight,
      dimensions: response.dimensions
    };
  }

  async getCustomer(identifier: { customerId?: string; email?: string }): Promise<Customer> {
    let response;

    if (identifier.customerId) {
      response = await this.apiClient.get(`/customers/${identifier.customerId}`);
    } else if (identifier.email) {
      response = await this.apiClient.get(`/customers/by-email/${identifier.email}`);
    } else {
      throw new Error('Either customerId or email must be provided');
    }

    return {
      customerId: response.id,
      email: response.email,
      firstName: response.first_name,
      lastName: response.last_name,
      phone: response.phone
    };
  }

  async getShipment(identifier: { shipmentId?: string; trackingNumber?: string }): Promise<Shipment> {
    let response;

    if (identifier.shipmentId) {
      response = await this.apiClient.get(`/shipments/${identifier.shipmentId}`);
    } else if (identifier.trackingNumber) {
      response = await this.apiClient.get(`/shipments/track/${identifier.trackingNumber}`);
    } else {
      throw new Error('Either shipmentId or trackingNumber must be provided');
    }

    return {
      shipmentId: response.id,
      orderId: response.order_id,
      trackingNumber: response.tracking_number,
      carrier: response.carrier,
      status: response.status,
      shippedAt: response.shipped_at,
      deliveredAt: response.delivered_at
    };
  }

  async getBuyer(buyerId: string): Promise<Buyer> {
    const response = await this.apiClient.get(`/buyers/${buyerId}`);

    return {
      buyerId: response.id,
      companyName: response.company_name,
      taxId: response.tax_id,
      contactName: response.contact_name,
      contactEmail: response.contact_email,
      creditLimit: response.credit_limit
    };
  }

  // ===== Private Helper Methods =====

  private transformToOrder(fulfillmentOrder: any): Order {
    return {
      orderId: fulfillmentOrder.id,
      orderNumber: fulfillmentOrder.order_number,
      extOrderId: fulfillmentOrder.external_reference,
      status: this.mapOrderStatus(fulfillmentOrder.status),
      customer: {
        customerId: fulfillmentOrder.customer.id,
        email: fulfillmentOrder.customer.email,
        firstName: fulfillmentOrder.customer.first_name,
        lastName: fulfillmentOrder.customer.last_name
      },
      items: fulfillmentOrder.line_items.map(item => ({
        sku: item.sku,
        quantity: item.quantity,
        price: item.unit_price,
        name: item.name
      })),
      totals: {
        subtotal: fulfillmentOrder.subtotal,
        tax: fulfillmentOrder.tax,
        shipping: fulfillmentOrder.shipping,
        total: fulfillmentOrder.total
      },
      createdAt: fulfillmentOrder.created_at,
      updatedAt: fulfillmentOrder.updated_at
    };
  }

  private mapOrderStatus(fulfillmentStatus: string): string {
    const statusMap: Record<string, string> = {
      'new': 'pending',
      'confirmed': 'processing',
      'in_fulfillment': 'processing',
      'shipped': 'shipped',
      'delivered': 'delivered',
      'cancelled': 'cancelled',
      'refunded': 'refunded'
    };

    return statusMap[fulfillmentStatus] || fulfillmentStatus;
  }
}

// Define your adapter options interface
interface AdapterOptions {
  apiUrl?: string;
  apiKey: string;
  workspace?: string;
  timeout?: number;
  retryAttempts?: number;
}
```

### Step 4: Export Your Adapter

Create the main export file:

```typescript
// src/index.ts
// Default export for the adapter factory to load
export { YourFulfillmentAdapter as default } from './adapter';

// Named export for direct usage
export { YourFulfillmentAdapter } from './adapter';

// Export any custom types if needed
export * from './types';
```

### Step 5: Add Configuration Documentation

Create clear documentation for your adapter's configuration:

```typescript
// src/types.ts
export interface YourFulfillmentAdapterConfig {
  /**
   * Your Fulfillment API endpoint
   * @example "https://api.yourfulfillment.com"
   */
  apiUrl?: string;

  /**
   * API key for authentication
   * @required
   */
  apiKey: string;

  /**
   * Workspace or tenant ID
   * @optional
   */
  workspace?: string;

  /**
   * Request timeout in milliseconds
   * @default 30000
   */
  timeout?: number;

  /**
   * Number of retry attempts for failed requests
   * @default 3
   */
  retryAttempts?: number;
}
```

## Testing Your Adapter

### Unit Tests

Create comprehensive tests for your adapter:

```typescript
// tests/adapter.test.ts
import { YourFulfillmentAdapter } from '../src/adapter';

describe('YourFulfillmentAdapter', () => {
  let adapter: YourFulfillmentAdapter;

  beforeEach(() => {
    adapter = new YourFulfillmentAdapter({
      apiUrl: 'https://sandbox.yourfulfillment.com',
      apiKey: 'test-api-key'
    });
  });

  describe('Lifecycle', () => {
    test('should connect successfully', async () => {
      await expect(adapter.connect()).resolves.not.toThrow();
    });

    test('should perform health check', async () => {
      const health = await adapter.healthCheck();
      expect(health.healthy).toBe(true);
    });
  });

  describe('Order Operations', () => {
    test('should capture order', async () => {
      const orderParams = {
        extOrderId: 'TEST-001',
        customer: {
          customerId: 'CUST-001',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe'
        },
        items: [{
          sku: 'PROD-001',
          quantity: 2,
          price: 29.99,
          name: 'Test Product'
        }]
      };

      const result = await adapter.captureOrder(orderParams);

      expect(result.success).toBe(true);
      expect(result.orderId).toBeDefined();
      expect(result.orderNumber).toBeDefined();
    });

    test('should retrieve order', async () => {
      const order = await adapter.getOrder({ orderId: 'ORDER-001' });

      expect(order.orderId).toBe('ORDER-001');
      expect(order.customer).toBeDefined();
      expect(order.items).toBeInstanceOf(Array);
    });
  });

  // Add tests for all 15 required methods
});
```

### Integration Testing

Test your adapter with the actual MCP server:

```bash
# Install the MCP server and your adapter locally
npm install @cof-org/mcp
npm link  # In your adapter directory

# Link your adapter to the MCP server
cd node_modules/@cof-org/mcp
npm link @yourcompany/cof-fulfillment-adapter-yourfulfillment

# Configure and run
ADAPTER_TYPE=npm ADAPTER_PACKAGE=@yourcompany/cof-fulfillment-adapter-yourfulfillment npm start
```

## Publishing Your Adapter

### Step 1: Prepare for Publishing

1. **Update version:**
```bash
npm version patch  # For bug fixes
npm version minor  # For new features
npm version major  # For breaking changes
```

2. **Ensure quality:**
```bash
npm run lint
npm test
npm run build
```

3. **Update documentation:**
- Ensure README.md is complete
- Document all configuration options
- Provide example usage
- Include troubleshooting section

### Step 2: Publish to NPM

1. **Login to NPM:**
```bash
npm login
```

2. **Publish your package:**
```bash
npm publish --access public
```

For scoped packages:
```bash
npm publish --access public --scope=@yourcompany
```

### Step 3: Test Installation

Verify your published package works:

```bash
# Create a test directory
mkdir test-installation
cd test-installation

# Install the MCP server and your adapter
npm init -y
npm install @cof-org/mcp
npm install @yourcompany/cof-fulfillment-adapter-yourfulfillment

# Create test configuration
echo "ADAPTER_TYPE=npm" > .env
echo "ADAPTER_PACKAGE=@yourcompany/cof-fulfillment-adapter-yourfulfillment" >> .env
echo "ADAPTER_OPTIONS_API_KEY=test-key" >> .env

# Run the server
npx @cof-org/mcp
```

## Best Practices

### 1. Error Handling

Always provide clear, actionable error messages:

```typescript
async captureOrder(params: OrderParams): Promise<OrderResult> {
  try {
    // ... implementation
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('Authentication failed: Invalid API key');
    } else if (error.response?.status === 400) {
      throw new Error(`Invalid order data: ${error.response.data.message}`);
    } else {
      throw new Error(`Failed to capture order: ${error.message}`);
    }
  }
}
```

### 2. Logging

Use appropriate log levels (replace with your logger):

```typescript
async connect(): Promise<void> {
  console.info(`Connecting to ${this.options.apiUrl}`);
  try {
    await this.apiClient.authenticate();
    console.info('Successfully connected to YourFulfillment');
  } catch (error) {
    console.error('Connection failed:', error);
    throw error;
  }
}
```

### 3. Configuration Validation

Validate configuration on initialization:

```typescript
constructor(options: AdapterOptions) {
  // Validate required fields
  if (!options.apiKey) {
    throw new Error('API key is required');
  }

  // Set defaults
  this.options = {
    apiUrl: 'https://api.yourfulfillment.com',
    timeout: 30000,
    retryAttempts: 3,
    ...options
  };
}
```

### 4. Rate Limiting

Implement rate limiting if your API has restrictions:

```typescript
import { RateLimiter } from 'limiter';

class YourFulfillmentAdapter {
  private rateLimiter: RateLimiter;

  constructor(options: AdapterOptions) {
    // 100 requests per minute
    this.rateLimiter = new RateLimiter({
      tokensPerInterval: 100,
      interval: 'minute'
    });
  }

  async makeRequest(method: string, path: string, data?: any) {
    await this.rateLimiter.removeTokens(1);
    return this.apiClient.request({ method, path, data });
  }
}
```

### 5. Versioning

Follow semantic versioning:

- **PATCH** (1.0.1): Bug fixes, documentation updates
- **MINOR** (1.1.0): New features, backward compatible
- **MAJOR** (2.0.0): Breaking changes

### 6. Documentation

Include comprehensive documentation:

```markdown
## Configuration

| Option    | Type   | Required | Default                         | Description                     |
| --------- | ------ | -------- | ------------------------------- | ------------------------------- |
| apiUrl    | string | No       | https://api.yourfulfillment.com | Your Fulfillment API endpoint   |
| apiKey    | string | Yes      | -                               | API key for authentication      |
| workspace | string | No       | -                               | Workspace or tenant ID          |
| timeout   | number | No       | 30000                           | Request timeout in milliseconds |

## Error Codes

| Code     | Description            | Resolution                          |
| -------- | ---------------------- | ----------------------------------- |
| AUTH_001 | Invalid API key        | Check your API key in configuration |
| ORD_001  | Order not found        | Verify the order ID exists          |
| INV_001  | Insufficient inventory | Check available stock               |
```

## Support Resources

### For Adapter Development

- [Universal Fulfillment MCP Server Documentation](https://github.com/TODO-ORG/TODO-REPO)
- [MCP Protocol Specification](https://modelcontextprotocol.io)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [NPM Publishing Guide](https://docs.npmjs.com/packages-and-modules)

### Getting Help

- **GitHub Issues**: Report bugs or request features at [github.com/TODO-ORG/TODO-REPO/issues](https://github.com/TODO-ORG/TODO-REPO/issues)
- **Discussions**: Join community discussions at [github.com/TODO-ORG/TODO-REPO/discussions](https://github.com/TODO-ORG/TODO-REPO/discussions)
- **Email Support**: contact@todo-domain.example

## Example Adapters

Study these reference implementations:

- [@cof-org/adapter-mock](https://github.com/TODO-ORG/adapter-mock) - Mock adapter for testing (placeholder)
- [@pipe17/cof-fulfillment-adapter-pipe17](https://github.com/TODO-ORG/cof-fulfillment-adapter-pipe17) - Pipe17 integration (placeholder)
- [@shopify/cof-fulfillment-adapter-shopify](https://github.com/TODO-ORG/cof-fulfillment-adapter-shopify) - Shopify integration (placeholder)

## Certification Program

Consider getting your adapter certified:

1. **Submit for Review**: Send your adapter for review
2. **Compliance Testing**: We test against the full interface
3. **Performance Validation**: Ensure it meets performance standards
4. **Security Review**: Basic security assessment
5. **Certification Badge**: Display "UOIS Certified" badge

Contact certification@todo-domain.example for details.

## Best Practices and Implementation Tips

### Error Handling Strategy

Implement robust error handling with appropriate error types:

```typescript
// Use specific error types for different scenarios
class AdapterConnectionError extends Error {
  constructor(message: string, public retryable = true) {
    super(message);
    this.name = 'AdapterConnectionError';
  }
}

class AdapterValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'AdapterValidationError';
  }
}

// In your adapter methods
async captureOrder(params: OrderParams): Promise<OrderResult> {
  try {
    // Validate input
    if (!params.customer?.email) {
      throw new AdapterValidationError('Customer email is required', 'customer.email');
    }
    
    // Make API call
    const response = await this.apiClient.post('/orders', params);
    return this.transformOrderResponse(response);
    
  } catch (error) {
    // Handle different error types appropriately
    if (error.response?.status === 429) {
      throw new AdapterConnectionError('Rate limit exceeded', true);
    }
    if (error.response?.status === 400) {
      throw new AdapterValidationError(error.response.data.message);
    }
    throw error;
  }
}
```

### Connection Pooling

For better performance, implement connection pooling:

```typescript
class YourFulfillmentAdapter {
  private connectionPool: ConnectionPool;
  
  constructor(options: AdapterOptions) {
    this.connectionPool = new ConnectionPool({
      maxConnections: options.maxConnections || 10,
      idleTimeout: options.idleTimeout || 30000,
      connectionTimeout: options.connectionTimeout || 5000
    });
  }
  
  async connect(): Promise<void> {
    await this.connectionPool.initialize();
  }
  
  async disconnect(): Promise<void> {
    await this.connectionPool.drain();
  }
}
```

### Retry Logic

Implement intelligent retry logic for transient failures:

```typescript
async withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry non-retryable errors
      if (!this.isRetryable(error)) {
        throw error;
      }
      
      // Calculate exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

private isRetryable(error: any): boolean {
  // Network errors and rate limits are retryable
  return error.code === 'ECONNRESET' || 
         error.code === 'ETIMEDOUT' ||
         error.response?.status === 429 ||
         error.response?.status >= 500;
}
```

### Logging and Monitoring

Add comprehensive logging for debugging:

```typescript
class YourFulfillmentAdapter {
  private logger: Logger;
  
  async captureOrder(params: OrderParams): Promise<OrderResult> {
    const requestId = generateRequestId();
    
    this.logger.info('Capturing order', {
      requestId,
      extOrderId: params.extOrderId,
      itemCount: params.items.length
    });
    
    try {
      const result = await this.performCapture(params);
      
      this.logger.info('Order captured successfully', {
        requestId,
        orderId: result.orderId
      });
      
      return result;
    } catch (error) {
      this.logger.error('Order capture failed', {
        requestId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}
```

### Performance Optimization Tips

1. **Batch Operations**: When possible, batch multiple operations
2. **Caching**: Cache frequently accessed data like products
3. **Pagination**: Implement proper pagination for large result sets
4. **Timeout Configuration**: Set appropriate timeouts for different operations
5. **Connection Reuse**: Reuse HTTP connections with keep-alive

## Conclusion

By following this guide, you'll create a professional adapter that:
- Integrates seamlessly with the Universal Fulfillment MCP Server
- Provides a great experience for your customers
- Maintains compatibility through versioning
- Supports the broader commerce operations ecosystem

Thank you for contributing to the Universal Fulfillment ecosystem!

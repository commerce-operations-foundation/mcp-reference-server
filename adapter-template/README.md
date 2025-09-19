# Commerce Operations Foundation Adapter Template

This template helps fulfillment vendors and retailers create custom adapters for the Commerce Operations Foundation MCP Server. Use this template to build an adapter that connects your fulfillment system to the COF ecosystem.

## Table of Contents

- [Quick Start](#quick-start)
- [Template Structure](#template-structure)
- [Implementation Guide](#implementation-guide)
- [Configuration](#configuration)
- [Testing Your Adapter](#testing-your-adapter)
- [Using Your Adapter](#using-your-adapter)
- [Publishing](#publishing)
- [Troubleshooting](#troubleshooting)
- [API Reference](#api-reference)
- [Support](#support)

## Quick Start

### Step 1: Set Up Your Adapter Project

```bash
# Copy this template to create your adapter
cp -r adapter-template/ my-fulfillment-adapter/
cd my-fulfillment-adapter/

# Install dependencies
npm install

# Rename the adapter in package.json
# Update name to: @yourcompany/cof-adapter-yourfulfillment
```

### Step 2: Customize Package Information

Edit `package.json` to reflect your adapter:

```json
{
  "name": "@yourcompany/cof-adapter-yourfulfillment",
  "version": "1.0.0",
  "description": "YourFulfillment adapter for Commerce Operations Foundation",
  "author": "Your Company",
  "license": "MIT"
}
```

### Step 3: Implement the Adapter Interface

Open `src/adapter.ts` and implement your fulfillment system's logic. The template provides all required methods with TODO comments showing what needs implementation.

## Template Structure

```
adapter-template/
├── src/
│   ├── adapter.ts          # Main adapter implementation (modify this)
│   ├── index.ts            # Module exports (update exports)
│   ├── types.ts            # Custom type definitions (add your types)
│   └── utils/
│       └── api-client.ts   # HTTP client wrapper (customize for your API)
├── tests/
│   └── adapter.test.ts     # Unit tests (write your tests)
├── examples/
│   ├── basic-usage.ts      # Basic usage examples
│   └── test-server.ts      # Test with local MCP server
├── docs/
│   ├── API.md              # Document your API mappings
│   └── CONFIGURATION.md    # Document configuration options
├── package.json            # Update name, author, description
├── tsconfig.json           # TypeScript configuration
├── .env.example            # Example configuration
└── README.md               # Replace with your documentation
```

## Implementation Guide

### Required Methods Checklist

Your adapter must implement these 18 methods from the `IFulfillmentAdapter` interface:

#### Lifecycle (3 methods)
- [ ] `connect()` - Establish connection to your fulfillment system
- [ ] `disconnect()` - Clean up resources
- [ ] `healthCheck()` - Return system health status

#### Order Actions (6 methods)
- [ ] `captureOrder()` - Create new order
- [ ] `cancelOrder()` - Cancel existing order
- [ ] `updateOrder()` - Update order details
- [ ] `returnOrder()` - Process return
- [ ] `exchangeOrder()` - Process exchange
- [ ] `shipOrder()` - Mark order as shipped

#### Management (3 methods)
- [ ] `holdOrder()` - Place order on hold
- [ ] `splitOrder()` - Split order into multiple shipments
- [ ] `reserveInventory()` - Reserve inventory

#### Queries (6 methods)
- [ ] `getOrder()` - Retrieve order details
- [ ] `getInventory()` - Check inventory levels
- [ ] `getProduct()` - Get product information
- [ ] `getCustomer()` - Get customer details
- [ ] `getShipment()` - Get shipment tracking
- [ ] `getBuyer()` - Get buyer information

### Implementation Steps

1. **Update adapter.ts with your API logic:**
```typescript
// src/adapter.ts
export class YourFulfillmentAdapter implements IFulfillmentAdapter {
  async captureOrder(params: OrderParams): Promise<OrderResult> {
    // TODO: Replace with your API call
    const response = await this.apiClient.post('/your-endpoint', {
      // Map params to your API format
    });
    
    // Return standardized response
    return {
      success: true,
      orderId: response.id,
      // ... other fields
    };
  }
}
```

2. **Configure your API client:**
```typescript
// src/utils/api-client.ts
export class ApiClient {
  constructor(config: YourConfig) {
    // Set up authentication, base URL, etc.
  }
}
```

3. **Define your configuration types:**
```typescript
// src/types.ts
export interface YourAdapterConfig {
  apiUrl: string;
  apiKey: string;
  // Add your specific config options
}

```

## Testing Your Adapter

### Step 1: Test Locally

```bash
# Build your adapter
npm run build

# Run unit tests
npm test

# Test with the MCP server locally
cd ../server
npm install
ADAPTER_TYPE=local ADAPTER_PATH=../my-fulfillment-adapter/dist/index.js npm start
```

### Step 2: Write Unit Tests

```typescript
// tests/adapter.test.ts
import { YourFulfillmentAdapter } from '../src/adapter';

describe('YourFulfillmentAdapter', () => {
  let adapter: YourFulfillmentAdapter;
  
  beforeEach(() => {
    adapter = new YourFulfillmentAdapter({
      apiUrl: 'https://sandbox.yourapi.com',
      apiKey: 'test-key'
    });
  });
  
  test('should connect successfully', async () => {
    await expect(adapter.connect()).resolves.not.toThrow();
  });
  
  test('should capture order', async () => {
    const result = await adapter.captureOrder({
      // ... test data
    });
    expect(result.success).toBe(true);
  });
});
```

```typescript
// examples/test-server.ts
// Use this to test your adapter with a local MCP server
import { YourFulfillmentAdapter } from '../src/adapter';

const adapter = new YourFulfillmentAdapter({
  apiUrl: process.env.API_URL || 'https://sandbox.yourapi.com',
  apiKey: process.env.API_KEY || 'test-key'
});

async function test() {
  await adapter.connect();
  console.log('Connected!');
  
  const health = await adapter.healthCheck();
  console.log('Health:', health);
}

test().catch(console.error);
```

## Using Your Adapter

### Option 1: Local Development (During Development)

```bash
# In the server directory, configure to use your local adapter
cd ../server
cat > .env << EOF
ADAPTER_TYPE=local
ADAPTER_PATH=../my-fulfillment-adapter/dist/index.js
ADAPTER_CONFIG={"apiUrl":"https://sandbox.yourapi.com","apiKey":"test-key"}
EOF

npm start
```

### Option 2: NPM Package (After Publishing)

```bash
# Install your published adapter
npm install @yourcompany/cof-adapter-yourfulfillment

# Configure the server to use it
cat > .env << EOF
ADAPTER_TYPE=npm
ADAPTER_PACKAGE=@yourcompany/cof-adapter-yourfulfillment
ADAPTER_CONFIG={"apiUrl":"https://api.yourfulfillment.com","apiKey":"production-key"}
EOF

npm start
```

## Configuration

Your adapter should accept configuration through the `ADAPTER_CONFIG` environment variable. Define your configuration interface in `src/types.ts`:

```typescript
export interface YourAdapterConfig {
  apiUrl: string;      // Required: Your API endpoint
  apiKey: string;      // Required: Authentication key
  workspace?: string;  // Optional: Tenant/workspace ID
  timeout?: number;    // Optional: Request timeout (ms)
  retryAttempts?: number; // Optional: Retry count
}
```

## Publishing

### For Public NPM Packages

```bash
# 1. Update version
npm version patch  # or minor/major

# 2. Build and test
npm run build
npm test

# 3. Publish to NPM
npm publish --access public
```

### For Private Use

```bash
# Option 1: Private NPM registry
npm publish --registry https://your-registry.com

# Option 2: Git repository
git tag v1.0.0
git push origin v1.0.0

# Option 3: Local file reference in package.json
"dependencies": {
  "my-adapter": "file:../my-fulfillment-adapter"
}

## Troubleshooting

### Adapter Not Loading

```bash
# Check the adapter can be imported
node -e "import('../my-fulfillment-adapter/dist/index.js')"

# Verify environment variables
echo $ADAPTER_TYPE
echo $ADAPTER_PATH
```

### Connection Issues

- Verify API credentials are correct
- Check network connectivity to your API
- Test with curl: `curl -X GET https://your-api.com/health`
- Enable debug logging in your adapter

### Type Errors

```bash
# Ensure types are installed
npm install --save-dev @types/node

# Check TypeScript version
npx tsc --version
```

## API Reference

### Required Interfaces

Your adapter must implement the `IFulfillmentAdapter` interface from the main server. Key types:

```typescript
interface OrderParams {
  extOrderId: string;
  customer: Customer;
  items: LineItem[];
  shippingAddress?: Address;
  billingAddress?: Address;
}

interface OrderResult {
  success: boolean;
  orderId: string;
  orderNumber?: string;
  status?: string;
}
```

See the full type definitions in the server's `src/types/` directory.

## Support

### Documentation
- [Commerce Operations Foundation Docs](../docs/README.md)
- [For Fulfillment Vendors Guide](../docs/getting-started/for-fulfillment-vendors.md)
- [MCP Protocol Specification](https://modelcontextprotocol.io)

### Getting Help
- Create an issue in this repository
- Check existing adapters in the `adapters/` directory for examples
- Review the mock adapter implementation for reference

## Next Steps

1. **Copy this template** to start your adapter
2. **Implement the interface** methods for your fulfillment system
3. **Test locally** with the MCP server
4. **Publish** to NPM or deploy privately
5. **Document** your configuration options

---

*This template is part of the Commerce Operations Foundation (COF) project.*

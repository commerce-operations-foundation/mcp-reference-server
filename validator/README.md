# onX MCP Validator

Compliance validator for Commerce Operations Foundation (COF) onX MCP servers.

## Installation

```bash
npm install -g @cof-org/onx-validator
```

Or run directly with npx:

```bash
npx @cof-org/onx-validator stdio node ./path/to/your/server.js
```

## Usage

### Validate a stdio MCP Server

```bash
# Basic validation
onx-validate stdio node ./dist/index.js

# With environment variables
onx-validate stdio node -a "./dist/index.js" -e ADAPTER_TYPE=built-in -e ADAPTER_NAME=mock

# JSON output (for CI/CD)
onx-validate stdio node -a "./dist/index.js" -f json

# Skip functional tests (schema validation only)
onx-validate stdio node -a "./dist/index.js" --no-functional

# Verbose output
onx-validate stdio node -a "./dist/index.js" -v
```

### Quick Health Check

```bash
onx-validate check node ./dist/index.js
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Fully compliant |
| 1 | Partially compliant |
| 2 | Non-compliant |
| 3 | Validation error (server crash, connection failed, etc.) |

## Required Tools

The 1.0.0 onX specification requires these tools:

### Action Tools
- `create-sales-order` - Create new orders
- `update-order` - Modify existing orders
- `cancel-order` - Cancel orders
- `fulfill-order` - Mark orders as fulfilled
- `create-return` - Process returns

### Query Tools
- `get-orders` - Retrieve orders
- `get-customers` - Retrieve customers
- `get-products` - Retrieve products
- `get-product-variants` - Retrieve product variants
- `get-inventory` - Check inventory levels
- `get-fulfillments` - Retrieve fulfillment records
- `get-returns` - Retrieve return records

## Validation Levels

### 1. Tool Presence
Verifies all required tools are implemented.

### 2. Schema Validation
Checks that tool input schemas match the spec:
- Required properties are present and marked required
- Property types are correct
- Nested structures (e.g., `order.lineItems`) have correct required fields

### 3. Functional Tests
Calls tools with test data to verify:
- Required field validation works (rejects invalid inputs)
- Valid inputs are accepted
- Response format is correct

## Compliance Report

```
═══════════════════════════════════════════════════════════════
                    onX MCP Compliance Report
═══════════════════════════════════════════════════════════════

  Server:    my-server v1.0.0
  Protocol:  2024-11-05
  Transport: stdio
  Timestamp: 2026-01-26T12:00:00.000Z

─── Summary ─────────────────────────────────────────────────────

  Status: ● FULLY COMPLIANT
  Score:  ████████████████████ 100%

  Tools Implemented: 12/12
  Checks Passed:     12
  Checks Failed:     0
  Warnings:          0

─── Tool Details ────────────────────────────────────────────────

  ✓ create-sales-order
  ✓ update-order
  ✓ cancel-order
  ...
═══════════════════════════════════════════════════════════════

  ✓ This server is fully compliant with the onX MCP specification.
```

## JSON Output

Use `-f json` for machine-readable output:

```json
{
  "serverInfo": {
    "name": "my-server",
    "version": "1.0.0",
    "protocolVersion": "2024-11-05"
  },
  "timestamp": "2026-01-26T12:00:00.000Z",
  "transport": "stdio",
  "summary": {
    "totalTools": 12,
    "implementedTools": 12,
    "missingTools": [],
    "passedChecks": 12,
    "failedChecks": 0,
    "warnings": 0
  },
  "tools": [...],
  "compliance": "full",
  "score": 100
}
```

## Programmatic Usage

```typescript
import { OnxValidator } from '@cof-org/onx-validator';

const validator = OnxValidator.forStdio({
  type: 'stdio',
  command: 'node',
  args: ['./dist/index.js'],
  env: { ADAPTER_TYPE: 'built-in', ADAPTER_NAME: 'mock' },
});

const report = await validator.validate();

if (report.compliance === 'full') {
  console.log('Server is compliant!');
} else {
  console.log('Issues found:', report.summary.failedChecks);
}
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Validate MCP Server

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - run: npx @cof-org/onx-validator stdio node -a "./dist/index.js" -e ADAPTER_TYPE=built-in
```

## License

MIT

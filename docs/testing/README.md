# Testing Guide

This directory contains testing documentation for the Commerce Operations Foundation MCP Server.

## Test Categories

- **Unit Testing** - Component-level testing
- **Integration Testing** - Service integration testing  
- **End-to-End Testing** - Complete workflow testing
- **Performance Testing** - Load and stress testing
- **Testing Best Practices** - Guidelines and standards

## Test Structure

```
tests/
├── unit/                    # Unit tests
│   ├── tools/              # Tool logic tests
│   ├── services/           # Service layer tests
│   └── adapters/           # Adapter tests
├── integration/            # Integration tests
│   ├── mcp-protocol.test.ts
│   ├── tool-execution.test.ts
│   └── adapter-flow.test.ts
├── e2e/                    # End-to-end tests
│   └── claude-desktop.test.ts
└── fixtures/               # Test data and utilities
    ├── test-data.ts
    └── mcp-test-client.ts
```

## Running Tests

### All Tests
```bash
npm test
```

### By Type
```bash
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:e2e        # End-to-end tests only
```

### With Coverage
```bash
npm test -- --coverage
```

### Watch Mode
```bash
npm test -- --watch
```

## Test Configuration

Tests are configured with Vitest and include:
- TypeScript support built-in
- Custom matchers for MCP protocol
- Mock adapters for isolated testing
- Test fixtures and utilities
- Coverage reporting via @vitest/coverage-v8

## Writing Tests

### Unit Test Example
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { CreateSalesOrderTool } from '../../../src/tools/actions/create-sales-order';
import { TEST_ORDER_PARAMS } from '../../fixtures/test-data';

describe('CreateSalesOrderTool', () => {
  it('should validate input parameters', async () => {
    const tool = new CreateSalesOrderTool(mockServiceLayer);
    const result = await tool.validateInput(TEST_ORDER_PARAMS);
    expect(result).toBeDefined();
  });
});
```

### Integration Test Example
```typescript
import { describe, it, expect } from 'vitest';
import { MockMCPClient } from '../../fixtures/mcp-test-client';
import { TEST_ORDER_PARAMS } from '../../fixtures/test-data';

describe('Create Sales Order Integration', () => {
  it('should create order via MCP protocol', async () => {
    const client = new MockMCPClient();
    const response = await client.callTool('create-sales-order', TEST_ORDER_PARAMS);
    expect(response).toBeValidMCPResponse();
  });
});
```

## Continuous Integration

Tests run automatically on:
- Pull requests
- Pushes to main/develop branches
- Release tags

GitHub Actions are configured to run the full test suite on each commit.

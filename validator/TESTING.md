# Testing Guide

This document provides comprehensive documentation for the onX MCP Validator test suite.

## Overview

The validator uses [Vitest](https://vitest.dev/) as its test framework, providing fast, modern testing with TypeScript support out of the box. The test suite is organized into four main categories:

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test components working together
- **Fixtures**: Reusable test data and mock factories
- **Setup**: Global test configuration

## Quick Start

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm test -- --coverage

# Run specific test file
npm test -- tests/transports/http.test.ts

# Run tests matching a pattern
npm test -- -t "HttpTransport"
```

## Project Structure

```
validator/
├── tests/
│   ├── setup.ts                    # Global test setup
│   ├── fixtures/
│   │   └── index.ts                # Mock factories and test data
│   ├── transports/
│   │   └── http.test.ts            # HTTP transport tests
│   ├── validators/
│   │   ├── tool-validator.test.ts  # Tool schema validation tests
│   │   └── functional-validator.test.ts  # Functional test validation
│   ├── reporters/
│   │   └── report-generator.test.ts  # Report generation tests
│   └── integration/
│       └── validator.test.ts       # End-to-end integration tests
├── vitest.config.ts                # Vitest configuration
└── TESTING.md                      # This file
```

## Test Categories

### 1. Transport Tests (`tests/transports/`)

Tests for MCP transport implementations that handle communication with servers.

#### HTTP Transport (`http.test.ts`)

Tests the HTTP transport for connecting to HTTP-based MCP servers:

- **Connection lifecycle**: connect, disconnect, reconnection
- **Server info retrieval**: parsing initialize response
- **Tool listing**: fetching available tools via JSON-RPC
- **Tool execution**: calling tools and handling responses
- **Error handling**: HTTP errors, JSON-RPC errors, network failures
- **Header handling**: custom headers, authentication

Example:
```typescript
it('should send initialize request and store server info', async () => {
  // Tests that connect() properly initializes the connection
});
```

### 2. Validator Tests (`tests/validators/`)

Tests for validation logic that checks MCP server compliance.

#### Tool Validator (`tool-validator.test.ts`)

Tests schema and presence validation:

- **Tool presence**: verifying all required onX tools exist
- **Schema validation**: checking inputSchema structure
- **Required properties**: ensuring required fields are marked required
- **Nested validation**: validating nested object schemas (e.g., order.lineItems)
- **Optional properties**: handling optional schema fields
- **Extra tools**: detecting non-spec tools (informational)

#### Functional Validator (`functional-validator.test.ts`)

Tests that verify tools actually work:

- **Query tools**: get-orders, get-customers, get-products, etc.
- **Mutation tools**: create-sales-order, cancel-order, etc.
- **Error cases**: missing required fields, invalid data
- **Response validation**: checking response format and content
- **Exception handling**: graceful handling of tool errors

### 3. Reporter Tests (`tests/reporters/`)

Tests for compliance report generation.

#### Report Generator (`report-generator.test.ts`)

- **Summary calculation**: counting passed/failed checks
- **Compliance levels**: full, partial, non-compliant determination
- **Score calculation**: percentage-based scoring
- **Functional result merging**: combining schema and functional results
- **JSON output**: proper formatting and serialization

### 4. Integration Tests (`tests/integration/`)

End-to-end tests that verify all components work together.

#### Validator Integration (`validator.test.ts`)

- **Full validation flow**: connect → list tools → validate → report
- **Factory methods**: forStdio, forHttp creation patterns
- **Error recovery**: handling failures at each stage
- **Transport type tracking**: stdio vs http reporting
- **Options handling**: verbose, format, functionalTests

## Fixtures and Mocks

The `tests/fixtures/index.ts` file provides reusable test utilities.

### Server Info

```typescript
import { createServerInfo } from '../fixtures';

const serverInfo = createServerInfo({
  name: 'custom-server',
  version: '2.0.0',
});
```

### Tool Definitions

```typescript
import { createToolDefinition, createCompliantToolSet } from '../fixtures';

// Single tool
const tool = createToolDefinition('my-tool', {
  inputSchema: { type: 'object', properties: { id: { type: 'string' } } }
});

// Full compliant set (all 12 onX tools)
const tools = createCompliantToolSet();

// Partial set (for testing missing tools)
const partialTools = createPartialToolSet();
```

### Mock Transport

```typescript
import { createMockTransport } from '../fixtures';

// Basic mock
const transport = createMockTransport();

// Customized mock
const transport = createMockTransport({
  serverInfo: createServerInfo({ name: 'test-server' }),
  tools: createCompliantToolSet(),
  callToolResponse: (name, args) => {
    if (name === 'get-orders') {
      return { success: true, data: { orders: [] } };
    }
    return { success: false, error: { code: -1, message: 'Not found' } };
  },
});
```

### Validation Results

```typescript
import { createPassingResult, createFailingResult, createToolValidationResult } from '../fixtures';

const passing = createPassingResult('get-orders', 'schema-check');
const failing = createFailingResult('get-orders', 'missing-field', 'Field X is missing');

const toolResult = createToolValidationResult('get-orders', {
  exists: true,
  schemaValid: true,
  errors: [],
});
```

### Mock Fetch (for HTTP tests)

```typescript
import { createMockFetch } from '../fixtures';

const mockFetch = createMockFetch([
  { result: { serverInfo: { name: 'server' }, protocolVersion: '2024-11-05' } },
  { result: {} },
  { result: { tools: [...] } },
]);

global.fetch = mockFetch;
```

## Writing New Tests

### Adding a New Test File

1. Create the file in the appropriate directory:
   ```typescript
   // tests/validators/new-validator.test.ts
   import { describe, it, expect, beforeEach } from 'vitest';
   import { NewValidator } from '../../src/validators/new-validator.js';

   describe('NewValidator', () => {
     let validator: NewValidator;

     beforeEach(() => {
       validator = new NewValidator();
     });

     it('should do something', () => {
       expect(validator.method()).toBe(expected);
     });
   });
   ```

2. Import fixtures as needed:
   ```typescript
   import { createMockTransport, createCompliantToolSet } from '../fixtures';
   ```

### Test Naming Conventions

- Use descriptive names that explain what's being tested
- Group related tests with `describe` blocks
- Start `it` blocks with "should" to describe expected behavior

```typescript
describe('ToolValidator', () => {
  describe('validateToolPresence', () => {
    it('should pass when all required tools are present', () => {});
    it('should fail when required tools are missing', () => {});
  });
});
```

### Mocking Best Practices

1. **Reset mocks between tests**: This is done automatically in `setup.ts`
2. **Use factory functions**: Create fresh mocks for each test
3. **Mock at the right level**: Prefer mocking transports over HTTP

```typescript
// Good: Mock the transport interface
const transport = createMockTransport({ callToolResponse: ... });

// Avoid: Mocking low-level fetch unless testing HTTP transport specifically
```

### Testing Async Code

```typescript
it('should handle async operations', async () => {
  const transport = createMockTransport();
  await transport.connect();

  const result = await transport.listTools();
  expect(result).toHaveLength(12);
});
```

### Testing Errors

```typescript
it('should throw on connection failure', async () => {
  const transport = createMockTransport();
  vi.mocked(transport.connect).mockRejectedValue(new Error('Connection failed'));

  await expect(transport.connect()).rejects.toThrow('Connection failed');
});
```

## Configuration

### vitest.config.ts

Key configuration options:

```typescript
export default defineConfig({
  test: {
    environment: 'node',     // Use Node.js environment
    globals: true,           // Enable global test functions
    include: ['tests/**/*.test.ts'],
    testTimeout: 10000,      // 10 second timeout
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/cli/**', 'src/**/index.ts'],
    },
  },
});
```

### Global Setup (`tests/setup.ts`)

The setup file runs before each test file:

```typescript
import { vi, beforeEach, afterAll } from 'vitest';

beforeEach(() => {
  vi.clearAllMocks();  // Reset all mock state
});

afterAll(() => {
  vi.restoreAllMocks();  // Restore original implementations
});
```

## Coverage Reports

Generate coverage reports:

```bash
npm test -- --coverage
```

This creates:
- Terminal output with coverage summary
- `coverage/` directory with detailed HTML report

View the HTML report:
```bash
open coverage/index.html
```

## Continuous Integration

The test suite is designed to run in CI environments:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: npm test

- name: Run tests with coverage
  run: npm test -- --coverage
```

## Troubleshooting

### Tests are slow

- Check for unhandled promises or missing `await`
- Look for unnecessary timeouts in test code
- Use `--run` flag to skip watch mode in CI

### Mock not working

- Ensure you're using `vi.mocked()` for type-safe mocking
- Check that mocks are reset between tests (automatic with setup.ts)
- Verify the mock is created before the code runs

### TypeScript errors in tests

- Import types from source files with `import type`
- Use `.js` extension in imports (ESM requirement)
- Check that vitest globals are properly configured

### Test isolation issues

- Each test should set up its own mocks
- Avoid shared mutable state between tests
- Use `beforeEach` for per-test setup

## API Reference

### Vitest Globals

When `globals: true` is set, these are available without imports:

- `describe(name, fn)` - Group tests
- `it(name, fn)` / `test(name, fn)` - Define a test
- `expect(value)` - Make assertions
- `beforeEach(fn)` - Run before each test
- `afterEach(fn)` - Run after each test
- `beforeAll(fn)` - Run once before all tests
- `afterAll(fn)` - Run once after all tests

### Vitest Mocking

```typescript
import { vi } from 'vitest';

// Create mock function
const mock = vi.fn();

// Mock implementation
mock.mockReturnValue(value);
mock.mockResolvedValue(value);
mock.mockRejectedValue(error);
mock.mockImplementation(fn);

// Assertions
expect(mock).toHaveBeenCalled();
expect(mock).toHaveBeenCalledWith(args);
expect(mock).toHaveBeenCalledTimes(n);
```

### Common Assertions

```typescript
expect(value).toBe(expected);           // Strict equality
expect(value).toEqual(expected);        // Deep equality
expect(value).toBeDefined();            // Not undefined
expect(value).toBeNull();               // Is null
expect(value).toBeTruthy();             // Truthy value
expect(value).toContain(item);          // Array/string contains
expect(value).toHaveLength(n);          // Array/string length
expect(fn).toThrow(error);              // Function throws
expect(promise).rejects.toThrow();      // Async throws
```

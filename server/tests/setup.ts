import { vi, expect, afterEach } from 'vitest';

/**
 * Vitest test setup configuration
 * Runs before each test file and provides shared test utilities
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce noise in tests
process.env.ADAPTER_TYPE = 'built-in'; // Default to built-in adapter type for tests
process.env.ADAPTER_NAME = 'mock'; // Use mock adapter for tests

// Mock console methods to reduce test output noise
const originalConsole = console;
global.console = {
  ...originalConsole,
  log: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  // Keep error for debugging
  error: originalConsole.error,
  debug: vi.fn(),
};

// Clean up after each test
afterEach(() => {
  // Clear all mocks
  vi.clearAllMocks();

  // Reset environment variables that might be changed in tests
  delete process.env.ADAPTER_OPTIONS_API_KEY;
  delete process.env.ADAPTER_OPTIONS_WORKSPACE;
  delete process.env.MOCK_DATA_PATH;
});

// Custom Vitest matchers for MCP protocol
expect.extend({
  toBeValidMCPResponse(received: any) {
    const isValid = received &&
      typeof received === 'object' &&
      received.jsonrpc === '2.0' &&
      (received.result !== undefined || received.error !== undefined) &&
      received.id !== undefined;

    return {
      message: () => `Expected ${JSON.stringify(received)} to be a valid MCP response`,
      pass: isValid
    };
  },

  toBeValidOrderResult(received: any) {
    const isValid = received &&
      typeof received === 'object' &&
      typeof received.success === 'boolean' &&
      (received.success ? received.orderId : received.error);

    return {
      message: () => `Expected ${JSON.stringify(received)} to be a valid order result`,
      pass: isValid
    };
  }
});

// Export empty object to make this a module
export { };

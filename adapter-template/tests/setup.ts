/**
 * Jest Test Setup
 * 
 * This file runs before all tests to set up the test environment.
 */

import { jest } from '@jest/globals';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.API_URL = 'https://api.test.yourfulfillment.com';
process.env.API_KEY = 'test-api-key';
process.env.WORKSPACE = 'test-workspace';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to silence console logs during tests
  // log: jest.fn(),
  // info: jest.fn(),
  // debug: jest.fn(),
  // Keep error and warn for debugging
  error: console.error,
  warn: console.warn,
};

// Add custom matchers if needed
expect.extend({
  toBeValidOrder(received: any) {
    const pass = 
      received &&
      typeof received.orderId === 'string' &&
      typeof received.status === 'string';
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid order`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid order with orderId and status`,
        pass: false,
      };
    }
  },
});

// Extend Jest matchers TypeScript definitions
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidOrder(): R;
    }
  }
}

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

export {};

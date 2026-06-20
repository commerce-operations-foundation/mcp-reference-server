/**
 * Test Setup
 *
 * This file runs before each test file and provides:
 * - Global test utilities
 * - Mock factories
 * - Common test fixtures
 */

import { vi, beforeEach, afterAll } from 'vitest';

// Reset all mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});

// Clean up after all tests
afterAll(() => {
  vi.restoreAllMocks();
});

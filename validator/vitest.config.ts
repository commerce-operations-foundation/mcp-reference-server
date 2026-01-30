import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',

    // Enable globals (describe, it, expect, etc.)
    globals: true,

    // Include test files
    include: ['tests/**/*.test.ts'],

    // Global test timeout
    testTimeout: 10000,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/cli/**', 'src/**/index.ts'],
    },

    // Setup files run before each test file
    setupFiles: ['./tests/setup.ts'],
  },
});

/**
 * Functional Validator Tests
 *
 * Tests the schema-driven functional validation that generates test cases
 * from JSON schemas and calls tools to verify they work correctly.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FunctionalValidator } from '../../src/validators/index.js';
import { createMockTransport } from '../fixtures/index.js';
import type { McpTransport } from '../../src/transports/index.js';
import { ONX_TOOLS } from '@onx/schemas';

describe('FunctionalValidator', () => {
  let mockTransport: McpTransport;
  let validator: FunctionalValidator;

  beforeEach(() => {
    mockTransport = createMockTransport();
    validator = new FunctionalValidator(mockTransport);
  });

  describe('runAllTests', () => {
    it('should run tests for all required tools', async () => {
      await mockTransport.connect();
      const results = await validator.runAllTests();

      expect(results.size).toBe(ONX_TOOLS.length);
      for (const tool of ONX_TOOLS) {
        expect(results.has(tool)).toBe(true);
      }
    });

    it('should return validation results for each tool', async () => {
      await mockTransport.connect();
      const results = await validator.runAllTests();

      for (const [tool, toolResults] of results) {
        expect(Array.isArray(toolResults)).toBe(true);
        toolResults.forEach(result => {
          expect(result).toHaveProperty('passed');
          expect(result).toHaveProperty('tool');
          expect(result).toHaveProperty('check');
          expect(result).toHaveProperty('message');
          expect(result.tool).toBe(tool);
        });
      }
    });
  });

  describe('runToolTests', () => {
    describe('schema-driven test generation', () => {
      it('should generate empty-input test for tools with required fields', async () => {
        await mockTransport.connect();
        // get-inventory has required field 'skus'
        const results = await validator.runToolTests('get-inventory');

        const emptyInputResult = results.find(r => r.check === 'functional-empty-input');
        expect(emptyInputResult).toBeDefined();
      });

      it('should NOT generate empty-input test for tools with no required fields', async () => {
        await mockTransport.connect();
        // get-orders has no required fields
        const results = await validator.runToolTests('get-orders');

        const emptyInputResult = results.find(r => r.check === 'functional-empty-input');
        expect(emptyInputResult).toBeUndefined();
      });

      it('should pass empty-input when server returns isError: true', async () => {
        mockTransport = createMockTransport({
          callToolResponse: (name, args) => {
            // get-inventory requires 'skus' - server should reject empty input
            if (name === 'get-inventory' && !args.skus) {
              return { content: [{ type: 'text', text: 'skus is required' }], isError: true };
            }
            return { content: [{ type: 'text', text: 'OK' }], isError: false };
          },
        });
        validator = new FunctionalValidator(mockTransport);

        await mockTransport.connect();
        const results = await validator.runToolTests('get-inventory');

        // empty-input expects isError: true, and we got it
        const emptyInputResult = results.find(r => r.check === 'functional-empty-input');
        expect(emptyInputResult?.passed).toBe(true);
      });

      it('should generate missing-required tests for each required field', async () => {
        await mockTransport.connect();
        // get-inventory has required field: skus
        const results = await validator.runToolTests('get-inventory');

        const missingSkusResult = results.find(r => r.check === 'functional-missing-required-skus');
        expect(missingSkusResult).toBeDefined();
      });

      it('should generate schema-valid-input test', async () => {
        await mockTransport.connect();
        const results = await validator.runToolTests('get-inventory');

        const schemaValidResult = results.find(r => r.check === 'functional-schema-valid-input');
        expect(schemaValidResult).toBeDefined();
      });

      it('should pass schema-valid-input for any valid MCP response', async () => {
        await mockTransport.connect();
        const results = await validator.runToolTests('get-inventory');

        // schema-valid-input accepts any response (isError true or false)
        const schemaValidResult = results.find(r => r.check === 'functional-schema-valid-input');
        expect(schemaValidResult?.passed).toBe(true);
      });

      it('should pass schema-valid-input even when server returns isError: true', async () => {
        mockTransport = createMockTransport({
          callToolResponse: { content: [{ type: 'text', text: 'Not found' }], isError: true },
        });
        validator = new FunctionalValidator(mockTransport);

        await mockTransport.connect();
        const results = await validator.runToolTests('get-orders');

        // schema-valid-input doesn't care about isError value
        const schemaValidResult = results.find(r => r.check === 'functional-schema-valid-input');
        expect(schemaValidResult?.passed).toBe(true);
      });
    });

    describe('response validation', () => {
      it('should fail when response missing content array', async () => {
        mockTransport = createMockTransport({
          callToolResponse: { isError: false } as any,
        });
        validator = new FunctionalValidator(mockTransport);

        await mockTransport.connect();
        const results = await validator.runToolTests('get-orders');

        const schemaValidResult = results.find(r => r.check === 'functional-schema-valid-input');
        expect(schemaValidResult?.passed).toBe(false);
        expect(schemaValidResult?.message).toContain('content');
      });

      it('should fail when response missing isError boolean', async () => {
        mockTransport = createMockTransport({
          callToolResponse: { content: [] } as any,
        });
        validator = new FunctionalValidator(mockTransport);

        await mockTransport.connect();
        const results = await validator.runToolTests('get-orders');

        const schemaValidResult = results.find(r => r.check === 'functional-schema-valid-input');
        expect(schemaValidResult?.passed).toBe(false);
        expect(schemaValidResult?.message).toContain('isError');
      });
    });

    describe('error handling', () => {
      it('should handle exceptions from tool calls', async () => {
        mockTransport = createMockTransport();
        vi.mocked(mockTransport.callTool).mockRejectedValue(new Error('Network error'));
        validator = new FunctionalValidator(mockTransport);

        await mockTransport.connect();
        const results = await validator.runToolTests('get-orders');

        const errorResults = results.filter(r => !r.passed);
        expect(errorResults.length).toBeGreaterThan(0);
        expect(errorResults[0].message).toContain('exception');
      });

      it('should fail empty-input when expected isError but got success', async () => {
        // Server incorrectly accepts invalid input
        mockTransport = createMockTransport({
          callToolResponse: { content: [{ type: 'text', text: 'OK' }], isError: false },
        });
        validator = new FunctionalValidator(mockTransport);

        await mockTransport.connect();
        // create-sales-order requires 'order', so empty-input should fail
        const results = await validator.runToolTests('create-sales-order');

        // empty-input expects isError: true but server returned isError: false
        const emptyInputResult = results.find(r => r.check === 'functional-empty-input');
        expect(emptyInputResult?.passed).toBe(false);
      });
    });
  });
});

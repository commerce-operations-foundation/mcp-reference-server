/**
 * Functional Validator Tests
 *
 * Tests the functional validation that calls tools with test data
 * to verify they work correctly.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FunctionalValidator } from '../../src/validators/functional-validator.js';
import { createMockTransport, createCompliantToolSet } from '../fixtures/index.js';
import type { McpTransport, McpResponse } from '../../src/transports/base.js';
import { ONX_TOOLS } from '../../src/schemas/index.js';

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

      // Should have results for all required tools
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
    describe('get-orders', () => {
      it('should pass empty query test on success response', async () => {
        await mockTransport.connect();
        const results = await validator.runToolTests('get-orders');

        const emptyQueryResult = results.find(r => r.check === 'functional-empty-query');
        expect(emptyQueryResult?.passed).toBe(true);
      });

      it('should fail empty query test on error response', async () => {
        mockTransport = createMockTransport({
          callToolResponse: {
            success: false,
            error: { code: -1, message: 'Connection error' },
          },
        });
        validator = new FunctionalValidator(mockTransport);

        await mockTransport.connect();
        const results = await validator.runToolTests('get-orders');

        const emptyQueryResult = results.find(r => r.check === 'functional-empty-query');
        expect(emptyQueryResult?.passed).toBe(false);
      });
    });

    describe('get-inventory', () => {
      it('should expect failure for missing required sku', async () => {
        mockTransport = createMockTransport({
          callToolResponse: (name, args) => {
            if (name === 'get-inventory' && !args.skus) {
              return { success: false, error: { code: -32602, message: 'skus is required' } };
            }
            return { success: true, data: {} };
          },
        });
        validator = new FunctionalValidator(mockTransport);

        await mockTransport.connect();
        const results = await validator.runToolTests('get-inventory');

        const missingSkuResult = results.find(r => r.check === 'functional-missing-required-sku');
        expect(missingSkuResult?.passed).toBe(true); // Expecting error is correct behavior
      });

      it('should expect failure for empty skus array', async () => {
        mockTransport = createMockTransport({
          callToolResponse: (name, args) => {
            if (name === 'get-inventory') {
              const skus = args.skus as unknown[];
              if (!skus || skus.length === 0) {
                return { success: false, error: { code: -32602, message: 'At least one SKU required' } };
              }
            }
            return { success: true, data: {} };
          },
        });
        validator = new FunctionalValidator(mockTransport);

        await mockTransport.connect();
        const results = await validator.runToolTests('get-inventory');

        const emptySkusResult = results.find(r => r.check === 'functional-empty-skus-array');
        expect(emptySkusResult?.passed).toBe(true); // Expecting error is correct
      });

      it('should pass for valid sku query', async () => {
        await mockTransport.connect();
        const results = await validator.runToolTests('get-inventory');

        const validSkuResult = results.find(r => r.check === 'functional-valid-sku');
        expect(validSkuResult?.passed).toBe(true);
      });
    });

    describe('create-sales-order', () => {
      it('should expect failure for missing order object', async () => {
        mockTransport = createMockTransport({
          callToolResponse: (name, args) => {
            if (name === 'create-sales-order' && !args.order) {
              return { success: false, error: { code: -32602, message: 'order is required' } };
            }
            return { success: true, data: { content: [{ type: 'text', text: 'Order ORD-123 created' }] } };
          },
        });
        validator = new FunctionalValidator(mockTransport);

        await mockTransport.connect();
        const results = await validator.runToolTests('create-sales-order');

        const missingOrderResult = results.find(r => r.check === 'functional-missing-order');
        expect(missingOrderResult?.passed).toBe(true);
      });

      it('should expect failure for missing line items', async () => {
        mockTransport = createMockTransport({
          callToolResponse: (name, args) => {
            if (name === 'create-sales-order') {
              const order = args.order as { lineItems?: unknown[] };
              if (order && !order.lineItems) {
                return { success: false, error: { code: -32602, message: 'lineItems required' } };
              }
            }
            return { success: true, data: { content: [{ type: 'text', text: 'Order created' }] } };
          },
        });
        validator = new FunctionalValidator(mockTransport);

        await mockTransport.connect();
        const results = await validator.runToolTests('create-sales-order');

        const missingLineItemsResult = results.find(r => r.check === 'functional-missing-line-items');
        expect(missingLineItemsResult?.passed).toBe(true);
      });

      it('should pass for valid minimal order', async () => {
        mockTransport = createMockTransport({
          callToolResponse: {
            success: true,
            data: { content: [{ type: 'text', text: 'Order ORD-123 created with id: abc' }] },
          },
        });
        validator = new FunctionalValidator(mockTransport);

        await mockTransport.connect();
        const results = await validator.runToolTests('create-sales-order');

        const validOrderResult = results.find(r => r.check === 'functional-valid-minimal-order');
        expect(validOrderResult?.passed).toBe(true);
      });
    });

    describe('cancel-order', () => {
      it('should expect failure for missing order id', async () => {
        mockTransport = createMockTransport({
          callToolResponse: (name, args) => {
            if (name === 'cancel-order' && !args.orderId) {
              return { success: false, error: { code: -32602, message: 'orderId required' } };
            }
            return { success: true, data: {} };
          },
        });
        validator = new FunctionalValidator(mockTransport);

        await mockTransport.connect();
        const results = await validator.runToolTests('cancel-order');

        const missingIdResult = results.find(r => r.check === 'functional-missing-order-id');
        expect(missingIdResult?.passed).toBe(true);
      });

      it('should expect failure for nonexistent order', async () => {
        mockTransport = createMockTransport({
          callToolResponse: (name, args) => {
            if (name === 'cancel-order' && args.orderId === 'nonexistent-order-id-12345') {
              return { success: false, error: { code: -1, message: 'Order not found' } };
            }
            return { success: true, data: {} };
          },
        });
        validator = new FunctionalValidator(mockTransport);

        await mockTransport.connect();
        const results = await validator.runToolTests('cancel-order');

        const nonexistentResult = results.find(r => r.check === 'functional-nonexistent-order');
        expect(nonexistentResult?.passed).toBe(true);
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
    });

    describe('acceptAnyResponse tests', () => {
      it('should pass get-products when any response is returned', async () => {
        mockTransport = createMockTransport({
          callToolResponse: {
            success: false,
            error: { code: -1, message: 'No products found' },
          },
        });
        validator = new FunctionalValidator(mockTransport);

        await mockTransport.connect();
        const results = await validator.runToolTests('get-products');

        const respondResult = results.find(r => r.check === 'functional-responds-to-query');
        // Should pass because acceptAnyResponse is true
        expect(respondResult?.passed).toBe(true);
      });
    });
  });
});

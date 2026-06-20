/**
 * Tool Validator Tests
 *
 * Tests the tool presence and schema validation logic against canonical schemas.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ToolValidator } from '../../src/validators/index.js';
import { createToolDefinition, createCompliantToolSet } from '../fixtures/index.js';
import { ONX_TOOLS } from '@onx/schemas';

describe('ToolValidator', () => {
  let validator: ToolValidator;

  beforeEach(() => {
    validator = new ToolValidator();
  });

  describe('validateToolPresence', () => {
    it('should pass when all required tools are present', () => {
      const tools = createCompliantToolSet();
      const results = validator.validateToolPresence(tools);

      const failedResults = results.filter(r => !r.passed);
      expect(failedResults).toHaveLength(0);
      expect(results).toHaveLength(ONX_TOOLS.length);
    });

    it('should fail when required tools are missing', () => {
      const allTools = createCompliantToolSet();
      const tools = allTools.slice(0, Math.ceil(allTools.length / 2));
      const results = validator.validateToolPresence(tools);

      const failedResults = results.filter(r => !r.passed);
      expect(failedResults.length).toBeGreaterThan(0);

      // Check that missing tools are reported (last tool will always be missing when we take first half)
      const lastTool = ONX_TOOLS[ONX_TOOLS.length - 1];
      const missingToolNames = failedResults.map(r => r.tool);
      expect(missingToolNames).toContain(lastTool);
    });

    it('should return correct check type for each result', () => {
      const tools = createCompliantToolSet();
      const results = validator.validateToolPresence(tools);

      results.forEach(result => {
        expect(result.check).toBe('tool-exists');
      });
    });
  });

  describe('validateToolSchema', () => {
    it('should pass for a tool with schema matching canonical', () => {
      const tool = createToolDefinition('cancel-order', {
        inputSchema: {
          type: 'object',
          properties: {
            orderId: { type: 'string' },
            reason: { type: 'string' },
            notifyCustomer: { type: 'boolean' },
            notes: { type: 'string' },
            lineItems: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  sku: { type: 'string', minLength: 1 },
                  quantity: { type: 'number', minimum: 1 },
                  id: { type: 'string' },
                },
                required: ['sku', 'quantity'],
              },
            },
          },
          required: ['orderId'],
        },
      });

      const results = validator.validateToolSchema(tool);
      const failures = results.filter(r => !r.passed);

      expect(failures).toHaveLength(0);
    });

    it('should fail when required property is missing from schema', () => {
      const tool = createToolDefinition('cancel-order', {
        inputSchema: {
          type: 'object',
          properties: {
            reason: { type: 'string' },
          },
          required: ['reason'],
        },
      });

      const results = validator.validateToolSchema(tool);
      const failures = results.filter(r => !r.passed);

      expect(failures.length).toBeGreaterThan(0);
      expect(failures.some(f => f.message.includes('orderId'))).toBe(true);
    });

    it('should fail when required field is not in required array', () => {
      const tool = createToolDefinition('cancel-order', {
        inputSchema: {
          type: 'object',
          properties: {
            orderId: { type: 'string' },
          },
          required: [], // orderId should be required
        },
      });

      const results = validator.validateToolSchema(tool);
      const failures = results.filter(r => !r.passed);

      expect(failures.some(f =>
        f.check === 'schema-missing-required' && f.message.includes('orderId')
      )).toBe(true);
    });

    it('should fail when constraint is missing (minimum)', () => {
      const tool = createToolDefinition('cancel-order', {
        inputSchema: {
          type: 'object',
          properties: {
            orderId: { type: 'string' },
            lineItems: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  sku: { type: 'string', minLength: 1 },
                  quantity: { type: 'number' }, // Missing minimum: 1
                },
                required: ['sku', 'quantity'],
              },
            },
          },
          required: ['orderId'],
        },
      });

      const results = validator.validateToolSchema(tool);
      const failures = results.filter(r => !r.passed);

      expect(failures.some(f => f.check === 'schema-missing-minimum')).toBe(true);
    });

    it('should fail when constraint value differs (minLength)', () => {
      const tool = createToolDefinition('cancel-order', {
        inputSchema: {
          type: 'object',
          properties: {
            orderId: { type: 'string' },
            lineItems: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  sku: { type: 'string', minLength: 5 }, // Should be 1
                  quantity: { type: 'number', minimum: 1 },
                },
                required: ['sku', 'quantity'],
              },
            },
          },
          required: ['orderId'],
        },
      });

      const results = validator.validateToolSchema(tool);
      const failures = results.filter(r => !r.passed);

      expect(failures.some(f => f.check === 'schema-minLength-mismatch')).toBe(true);
    });

    it('should fail when tool has no description', () => {
      const tool = {
        name: 'get-orders',
        inputSchema: { type: 'object', properties: {} },
      };

      const results = validator.validateToolSchema(tool as any);
      const descFailure = results.find(r => r.check === 'schema-description');

      expect(descFailure?.passed).toBe(false);
    });

    it('should pass for tools not in spec)', () => {
      const tool = createToolDefinition('custom-tool', {
        inputSchema: {
          type: 'object',
          properties: {
            foo: { type: 'string' },
          },
        },
      });

      const results = validator.validateToolSchema(tool);
      const failures = results.filter(r => !r.passed);

      expect(failures).toHaveLength(0);
      expect(results.some(r => r.check === 'schema-extra-tool')).toBe(true);
    });

    it('should fail when inputSchema is missing', () => {
      const tool = {
        name: 'cancel-order',
        description: 'Cancel an order',
      };

      const results = validator.validateToolSchema(tool as any);
      const schemaFailure = results.find(r => r.check === 'schema-exists');

      expect(schemaFailure?.passed).toBe(false);
    });

    it('should fail when server is too strict (extra required field)', () => {
      const tool = createToolDefinition('cancel-order', {
        inputSchema: {
          type: 'object',
          properties: {
            orderId: { type: 'string' },
            reason: { type: 'string' },
          },
          required: ['orderId', 'reason'], // reason is not required in canonical
        },
      });

      const results = validator.validateToolSchema(tool);
      const failures = results.filter(r => !r.passed);

      expect(failures.some(f =>
        f.check === 'schema-extra-required' && f.message.includes('reason')
      )).toBe(true);
    });

    it('should fail when server has extra property and canonical has additionalProperties: false', () => {
      // cancel-order canonical has additionalProperties: false
      const tool = createToolDefinition('cancel-order', {
        inputSchema: {
          type: 'object',
          properties: {
            orderId: { type: 'string' },
            reason: { type: 'string' },
            notifyCustomer: { type: 'boolean' },
            notes: { type: 'string' },
            lineItems: { type: 'array' },
            customField: { type: 'string' }, // Extra property not in canonical
          },
          required: ['orderId'],
        },
      });

      const results = validator.validateToolSchema(tool);
      const failures = results.filter(r => !r.passed);

      expect(failures.some(f =>
        f.check === 'schema-extra-property' && f.message.includes('customField')
      )).toBe(true);
    });

    it('should pass when nested object allows additionalProperties', () => {
      // create-sales-order.order.discounts[] items have additionalProperties: {}
      const tool = createToolDefinition('create-sales-order', {
        inputSchema: {
          type: 'object',
          properties: {
            order: {
              type: 'object',
              properties: {
                lineItems: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      sku: { type: 'string', minLength: 1 },
                      quantity: { type: 'number', minimum: 1 },
                    },
                    required: ['sku', 'quantity'],
                  },
                },
                discounts: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      customDiscountField: { type: 'string' }, // Extra property - allowed
                    },
                    additionalProperties: {},
                  },
                },
              },
              required: ['lineItems'],
            },
          },
          required: ['order'],
        },
      });

      const results = validator.validateToolSchema(tool);
      const extraPropertyFailure = results.find(r =>
        r.check === 'schema-extra-property' && r.message.includes('customDiscountField')
      );

      expect(extraPropertyFailure).toBeUndefined();
    });

  });

  describe('validateAll', () => {
    it('should return results for all required tools', () => {
      const tools = createCompliantToolSet();
      const results = validator.validateAll(tools);

      expect(results.length).toBeGreaterThanOrEqual(ONX_TOOLS.length);

      // Each required tool should have a result
      for (const requiredTool of ONX_TOOLS) {
        const result = results.find(r => r.tool === requiredTool);
        expect(result).toBeDefined();
        expect(result?.exists).toBe(true);
      }
    });

    it('should mark missing tools as not existing', () => {
      const allTools = createCompliantToolSet();
      const tools = allTools.slice(0, Math.ceil(allTools.length / 2));
      const results = validator.validateAll(tools);

      const missingResults = results.filter(r => !r.exists);
      expect(missingResults.length).toBeGreaterThan(0);

      missingResults.forEach(result => {
        expect(result.schemaValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it('should include extra tools with warnings', () => {
      const tools = [
        ...createCompliantToolSet(),
        createToolDefinition('my-custom-tool'),
      ];

      const results = validator.validateAll(tools);
      const extraResult = results.find(r => r.tool === 'my-custom-tool');

      expect(extraResult).toBeDefined();
      expect(extraResult?.exists).toBe(true);
      expect(extraResult?.warnings.length).toBeGreaterThan(0);
      expect(extraResult?.warnings[0].check).toBe('extra-tool');
    });
  });
});

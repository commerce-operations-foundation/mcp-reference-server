/**
 * Tool Validator Tests
 *
 * Tests the tool presence and schema validation logic against canonical schemas.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToolValidator } from '../../src/validators/tool-validator.js';
import { createToolDefinition, createCompliantToolSet, createPartialToolSet } from '../fixtures/index.js';

// Mock tools for testing (matches the fixture tool set)
const MOCK_ONX_TOOLS = [
  'create-sales-order',
  'update-order',
  'cancel-order',
  'fulfill-order',
  'create-return',
  'get-orders',
  'get-customers',
  'get-products',
  'get-product-variants',
  'get-inventory',
  'get-fulfillments',
  'get-returns',
];

// Mock the schema index to control what canonical schemas and tools are available
vi.mock('../../src/schemas/index.js', () => ({
  ONX_TOOLS: [
    'create-sales-order',
    'update-order',
    'cancel-order',
    'fulfill-order',
    'create-return',
    'get-orders',
    'get-customers',
    'get-products',
    'get-product-variants',
    'get-inventory',
    'get-fulfillments',
    'get-returns',
  ],
  getCanonicalSchema: vi.fn((toolName: string) => {
    // Return mock canonical schemas for testing
    const schemas: Record<string, any> = {
      'cancel-order': {
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
              },
              required: ['sku', 'quantity'],
            },
          },
        },
        required: ['orderId'],
      },
      'create-sales-order': {
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
            },
          },
        },
        required: ['order'],
      },
      'get-orders': {
        type: 'object',
        properties: {
          ids: { type: 'array' },
          externalIds: { type: 'array' },
        },
      },
    };
    return schemas[toolName] || null;
  }),
  loadCanonicalSchemas: vi.fn(),
  listCanonicalTools: vi.fn(() => ['cancel-order', 'create-sales-order', 'get-orders']),
  clearSchemaCache: vi.fn(),
}));

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
      expect(results).toHaveLength(MOCK_ONX_TOOLS.length);
    });

    it('should fail when required tools are missing', () => {
      const tools = createPartialToolSet();
      const results = validator.validateToolPresence(tools);

      const failedResults = results.filter(r => !r.passed);
      expect(failedResults.length).toBeGreaterThan(0);

      // Check that missing tools are reported
      const missingToolNames = failedResults.map(r => r.tool);
      expect(missingToolNames).toContain('get-inventory');
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

    it('should pass for unknown tools (not in spec)', () => {
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

    it('should warn when no canonical schema exists for required tool', () => {
      // create-return has no canonical schema in our mock
      const tool = createToolDefinition('create-return', {
        inputSchema: {
          type: 'object',
          properties: {
            return: { type: 'object' },
          },
          required: ['return'],
        },
      });

      const results = validator.validateToolSchema(tool);

      expect(results.some(r => r.check === 'schema-no-canonical')).toBe(true);
    });
  });

  describe('validateAll', () => {
    it('should return results for all required tools', () => {
      const tools = createCompliantToolSet();
      const results = validator.validateAll(tools);

      expect(results.length).toBeGreaterThanOrEqual(MOCK_ONX_TOOLS.length);

      // Each required tool should have a result
      for (const requiredTool of MOCK_ONX_TOOLS) {
        const result = results.find(r => r.tool === requiredTool);
        expect(result).toBeDefined();
        expect(result?.exists).toBe(true);
      }
    });

    it('should mark missing tools as not existing', () => {
      const tools = createPartialToolSet();
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

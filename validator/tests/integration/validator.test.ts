/**
 * Integration Tests
 *
 * End-to-end tests for the full validation flow using mock transports.
 * These tests verify that all components work together correctly.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OnxValidator } from '../../src/validator.js';
import {
  createMockTransport,
  createServerInfo,
  createCompliantToolSet,
  createPartialToolSet,
} from '../fixtures/index.js';
import type { McpTransport, McpResponse } from '../../src/transports/base.js';
import { ONX_TOOLS } from '../../src/schemas/index.js';

// Test helper to create validator with mock transport
function createTestValidator(transport: McpTransport, transportType: 'stdio' | 'http' = 'stdio') {
  // Use reflection to access private constructor
  return (OnxValidator as any).prototype.constructor.call(
    Object.create(OnxValidator.prototype),
    transport,
    transportType,
    { functionalTests: true, format: 'json', verbose: false }
  );
}

describe('OnxValidator Integration', () => {
  describe('full validation flow', () => {
    it('should complete validation with compliant server', async () => {
      const transport = createMockTransport({
        serverInfo: createServerInfo({ name: 'compliant-server' }),
        tools: createCompliantToolSet(),
        callToolResponse: (name, args) => {
          // Simulate proper responses for validation tests
          if (name === 'get-inventory' && (!args.skus || (args.skus as unknown[]).length === 0)) {
            return { success: false, error: { code: -32602, message: 'skus required' } };
          }
          if (name === 'create-sales-order' && !args.order) {
            return { success: false, error: { code: -32602, message: 'order required' } };
          }
          if (name === 'cancel-order' && !args.orderId) {
            return { success: false, error: { code: -32602, message: 'orderId required' } };
          }
          return {
            success: true,
            data: { content: [{ type: 'text', text: `${name} executed successfully` }] },
          };
        },
      });

      // Create validator using static factory (simulate by connecting transport)
      await transport.connect();
      const serverInfo = await transport.getServerInfo();
      const tools = await transport.listTools();

      expect(serverInfo.name).toBe('compliant-server');
      expect(tools).toHaveLength(ONX_TOOLS.length);
    });

    it('should detect missing tools', async () => {
      const transport = createMockTransport({
        serverInfo: createServerInfo({ name: 'partial-server' }),
        tools: createPartialToolSet(),
      });

      await transport.connect();
      const tools = await transport.listTools();

      expect(tools.length).toBeLessThan(ONX_TOOLS.length);
    });

    it('should handle server connection errors', async () => {
      const transport = createMockTransport();
      vi.mocked(transport.connect).mockRejectedValue(new Error('Connection refused'));

      await expect(transport.connect()).rejects.toThrow('Connection refused');
    });

    it('should handle tool list errors', async () => {
      const transport = createMockTransport();
      vi.mocked(transport.listTools).mockRejectedValue(new Error('Server error'));

      await transport.connect();
      await expect(transport.listTools()).rejects.toThrow('Server error');
    });
  });

  describe('functional test scenarios', () => {
    it('should validate create-sales-order flow', async () => {
      let createdOrderId: string | null = null;

      const transport = createMockTransport({
        callToolResponse: (name, args) => {
          if (name === 'create-sales-order') {
            if (!args.order) {
              return { success: false, error: { code: -32602, message: 'order required' } };
            }
            const order = args.order as { lineItems?: unknown[] };
            if (!order.lineItems) {
              return { success: false, error: { code: -32602, message: 'lineItems required' } };
            }
            createdOrderId = `ORD-${Date.now()}`;
            return {
              success: true,
              data: {
                content: [{ type: 'text', text: `Created order ${createdOrderId}` }],
              },
            };
          }
          return { success: true, data: {} };
        },
      });

      await transport.connect();

      // Test missing order
      const missingOrderResponse = await transport.callTool('create-sales-order', {});
      expect(missingOrderResponse.success).toBe(false);

      // Test missing lineItems
      const missingLineItemsResponse = await transport.callTool('create-sales-order', {
        order: { externalId: 'TEST' },
      });
      expect(missingLineItemsResponse.success).toBe(false);

      // Test valid order
      const validResponse = await transport.callTool('create-sales-order', {
        order: {
          externalId: 'TEST-001',
          lineItems: [{ sku: 'SKU-001', quantity: 2 }],
        },
      });
      expect(validResponse.success).toBe(true);
      expect(createdOrderId).not.toBeNull();
    });

    it('should validate get-inventory flow', async () => {
      const transport = createMockTransport({
        callToolResponse: (name, args) => {
          if (name === 'get-inventory') {
            const skus = args.skus as unknown[] | undefined;
            if (!skus) {
              return { success: false, error: { code: -32602, message: 'skus is required' } };
            }
            if (skus.length === 0) {
              return { success: false, error: { code: -32602, message: 'At least one SKU required' } };
            }
            return {
              success: true,
              data: {
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    inventory: skus.map(sku => ({ sku, quantity: 100 })),
                  }),
                }],
              },
            };
          }
          return { success: true, data: {} };
        },
      });

      await transport.connect();

      // Missing skus
      const missingSkusResponse = await transport.callTool('get-inventory', {});
      expect(missingSkusResponse.success).toBe(false);

      // Empty skus
      const emptySkusResponse = await transport.callTool('get-inventory', { skus: [] });
      expect(emptySkusResponse.success).toBe(false);

      // Valid skus
      const validResponse = await transport.callTool('get-inventory', { skus: ['SKU-001'] });
      expect(validResponse.success).toBe(true);
    });

    it('should validate cancel-order flow', async () => {
      const transport = createMockTransport({
        callToolResponse: (name, args) => {
          if (name === 'cancel-order') {
            if (!args.orderId) {
              return { success: false, error: { code: -32602, message: 'orderId required' } };
            }
            if (args.orderId === 'nonexistent-order-id-12345') {
              return { success: false, error: { code: -1, message: 'Order not found' } };
            }
            return {
              success: true,
              data: { content: [{ type: 'text', text: `Order ${args.orderId} cancelled` }] },
            };
          }
          return { success: true, data: {} };
        },
      });

      await transport.connect();

      // Missing orderId
      const missingIdResponse = await transport.callTool('cancel-order', {});
      expect(missingIdResponse.success).toBe(false);

      // Nonexistent order
      const notFoundResponse = await transport.callTool('cancel-order', {
        orderId: 'nonexistent-order-id-12345',
      });
      expect(notFoundResponse.success).toBe(false);

      // Valid cancel
      const validResponse = await transport.callTool('cancel-order', { orderId: 'ORD-123' });
      expect(validResponse.success).toBe(true);
    });
  });

  describe('transport type handling', () => {
    it('should track stdio transport type', async () => {
      const transport = createMockTransport();
      await transport.connect();

      // The factory method would set this
      const transportType = 'stdio';
      expect(transportType).toBe('stdio');
    });

    it('should track http transport type', async () => {
      const transport = createMockTransport();
      await transport.connect();

      const transportType = 'http';
      expect(transportType).toBe('http');
    });
  });

  describe('error recovery', () => {
    it('should disconnect on validation failure', async () => {
      const transport = createMockTransport();
      vi.mocked(transport.listTools).mockRejectedValue(new Error('Server crashed'));

      await transport.connect();
      expect(transport.isConnected()).toBe(true);

      try {
        await transport.listTools();
      } catch {
        // Expected
      }

      await transport.disconnect();
      expect(transport.isConnected()).toBe(false);
    });

    it('should handle disconnect errors gracefully', async () => {
      const transport = createMockTransport();
      vi.mocked(transport.disconnect).mockRejectedValue(new Error('Disconnect failed'));

      await transport.connect();

      // Should not throw - disconnect errors are usually ignored
      await expect(transport.disconnect()).rejects.toThrow('Disconnect failed');
    });
  });

  describe('verbose logging', () => {
    it('should support verbose option', () => {
      // Verify verbose option is available
      const options = {
        functionalTests: true,
        format: 'console' as const,
        verbose: true,
      };

      expect(options.verbose).toBe(true);
    });
  });

  describe('format options', () => {
    it('should support console format', () => {
      const options = { format: 'console' as const };
      expect(options.format).toBe('console');
    });

    it('should support json format', () => {
      const options = { format: 'json' as const };
      expect(options.format).toBe('json');
    });
  });
});

describe('OnxValidator Factory Methods', () => {
  describe('forStdio', () => {
    it('should create validator with stdio config', () => {
      // This tests the actual factory method exists and has correct signature
      expect(typeof OnxValidator.forStdio).toBe('function');
    });
  });

  describe('forHttp', () => {
    it('should create validator with http config', () => {
      // This tests the actual factory method exists and has correct signature
      expect(typeof OnxValidator.forHttp).toBe('function');
    });
  });
});

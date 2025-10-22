import { TestMCPClient } from '../helpers/test-client';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
describe('MCP Server Integration', () => {
  let client: TestMCPClient;

  beforeAll(async () => {
    client = new TestMCPClient();
    await client.connect();
  }, 30000); // Increase timeout for server startup

  afterAll(async () => {
    if (client) {
      await client.disconnect();
    }
  });

  describe('Protocol Handshake', () => {
    it('should complete initialization', async () => {
      const response = await client.sendRequest('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
        },
        clientInfo: {
          name: 'test-client',
          version: '1.0.0',
        },
      });

      expect(response.protocolVersion).toBe('2024-11-05');
      expect(response.capabilities).toBeDefined();
      expect(response.serverInfo).toBeDefined();
      expect(response.serverInfo.name).toBe('cof-mcp');
    });

    it('should list available tools', async () => {
      const response = await client.sendRequest('tools/list');

      expect(response.tools).toBeInstanceOf(Array);
      expect(response.tools.length).toBeGreaterThanOrEqual(10);

      const toolNames = response.tools.map((t: any) => t.name);

      // Verify all required tools are present
      const requiredTools = [
        'create-sales-order',
        'cancel-order',
        'update-order',
        'fulfill-order',
        'get-orders',
        'get-customers',
        'get-products',
        'get-product-variants',
        'get-inventory',
        'get-fulfillments',
      ];

      for (const toolName of requiredTools) {
        expect(toolNames).toContain(toolName);
      }

      // Verify tool structure
      for (const tool of response.tools) {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
        expect(tool.inputSchema).toHaveProperty('type');
        expect(tool.inputSchema.type).toBe('object');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid method', async () => {
      const response = await client.sendRequest('invalid/method');

      // Expect JSON-RPC protocol error (invalid method)
      expect(response.__jsonRpcError).toBe(true);
      expect(response.code).toBe(-32601); // Method not found
      expect(response.message).toContain('Method not found');
    });

    it('should handle malformed tool call', async () => {
      const response = await client.sendRequest('tools/call', {
        // Missing required fields
        invalidParam: true,
      });

      // Expect JSON-RPC protocol error (malformed request)
      expect(response.__jsonRpcError).toBe(true);
      expect(response.code).toBeDefined();
      expect(response.message).toBeDefined();
    });

    it('should handle tool not found', async () => {
      const response = await client.sendRequest('tools/call', {
        name: 'non-existent-tool',
        arguments: {},
      });

      // Expect JSON-RPC protocol error (tool not found is a protocol error)
      expect(response.__jsonRpcError).toBe(true);
      expect(response.message).toContain('Unknown tool');
      expect(response.code).toBeDefined();
    });

    it('should handle invalid tool arguments', async () => {
      const response = await client.sendRequest('tools/call', {
        name: 'create-sales-order',
        arguments: {
          // Missing required fields
          invalid: 'data',
        },
      });

      // Expect JSON-RPC protocol error (validation errors are protocol errors)
      expect(response.__jsonRpcError).toBe(true);
      expect(response.message).toContain('Validation failed');
      expect(response.code).toBeDefined();
    });
  });

  describe('Tool Execution', () => {
    it('should execute a simple query tool', async () => {
      const response = await client.sendRequest('tools/call', {
        name: 'get-inventory',
        arguments: {
          skus: ['SKU001'],
        },
      });

      expect(response).toBeDefined();
      expect(response.content).toBeInstanceOf(Array);
      expect(response.content[0]).toHaveProperty('type', 'text');
      expect(response.isError).toBeUndefined(); // isError should only be present for error responses

      const result = JSON.parse(response.content[0].text);
      expect(result.success).toBe(true);
      expect(result.inventory).toBeInstanceOf(Array);
      expect(result.inventory[0]).toHaveProperty('sku', 'SKU001');
    });

    it('should handle concurrent tool calls', async () => {
      const promises = [];

      // Make 5 concurrent calls
      for (let i = 0; i < 5; i++) {
        promises.push(
          client.sendRequest('tools/call', {
            name: 'get-products',
            arguments: {
              skus: [`SKU00${i + 1}`],
            },
          })
        );
      }

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      for (const response of results) {
        expect(response).toBeDefined();
        // Response can be either successful tool response or JSON-RPC error
        if (response.__jsonRpcError) {
          expect(response.code).toBeDefined();
          expect(response.message).toBeDefined();
        } else {
          expect(response.content).toBeInstanceOf(Array);
        }
      }
    });
  });

  describe('Server Lifecycle', () => {
    it('should handle graceful shutdown', async () => {
      const tempClient = new TestMCPClient();
      await tempClient.connect();

      // Verify connected
      const response = await tempClient.sendRequest('tools/list');
      expect(response.tools).toBeInstanceOf(Array);

      // Disconnect
      await tempClient.disconnect();

      // Verify disconnected - should throw
      await expect(tempClient.sendRequest('tools/list')).rejects.toThrow('Client not connected');
    });

    it('should handle multiple client connections', async () => {
      const client1 = new TestMCPClient();
      const client2 = new TestMCPClient();

      try {
        await client1.connect();
        await client2.connect();

        // Both clients should work independently
        const [response1, response2] = await Promise.all([
          client1.sendRequest('tools/list'),
          client2.sendRequest('tools/list'),
        ]);

        expect(response1.tools).toBeInstanceOf(Array);
        expect(response2.tools).toBeInstanceOf(Array);
      } finally {
        await client1.disconnect();
        await client2.disconnect();
      }
    });
  });
});

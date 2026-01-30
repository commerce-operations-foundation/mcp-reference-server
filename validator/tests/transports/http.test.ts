/**
 * HTTP Transport Tests
 *
 * Tests the HTTP transport implementation for communicating with
 * HTTP-based MCP servers.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpTransport } from '../../src/transports/http.js';
import { createMockFetch, createServerInfo } from '../fixtures/index.js';

// Mock the global fetch
const originalFetch = global.fetch;

describe('HttpTransport', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('constructor', () => {
    it('should create instance with URL config', () => {
      const transport = new HttpTransport({
        type: 'http',
        url: 'http://localhost:3000/mcp',
      });

      expect(transport).toBeInstanceOf(HttpTransport);
      expect(transport.isConnected()).toBe(false);
    });

    it('should create instance with headers', () => {
      const transport = new HttpTransport({
        type: 'http',
        url: 'http://localhost:3000/mcp',
        headers: {
          Authorization: 'Bearer token123',
        },
      });

      expect(transport).toBeInstanceOf(HttpTransport);
    });
  });

  describe('connect', () => {
    it('should send initialize request and store server info', async () => {
      mockFetch = createMockFetch([
        {
          result: {
            serverInfo: { name: 'test-server', version: '1.0.0' },
            protocolVersion: '2024-11-05',
          },
        },
        { result: {} }, // notifications/initialized
      ]);
      global.fetch = mockFetch as unknown as typeof fetch;

      const transport = new HttpTransport({
        type: 'http',
        url: 'http://localhost:3000/mcp',
      });

      await transport.connect();

      expect(transport.isConnected()).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Verify initialize request
      const initCall = mockFetch.mock.calls[0];
      expect(initCall[0]).toBe('http://localhost:3000/mcp');
      const initBody = JSON.parse(initCall[1].body as string);
      expect(initBody.method).toBe('initialize');
      expect(initBody.params.clientInfo.name).toBe('onx-validator');
    });

    it('should throw error on initialize failure', async () => {
      mockFetch = createMockFetch([
        { error: { code: -32600, message: 'Invalid request' } },
      ]);
      global.fetch = mockFetch as unknown as typeof fetch;

      const transport = new HttpTransport({
        type: 'http',
        url: 'http://localhost:3000/mcp',
      });

      await expect(transport.connect()).rejects.toThrow('Initialize failed');
      expect(transport.isConnected()).toBe(false);
    });

    it('should include custom headers in requests', async () => {
      mockFetch = createMockFetch([
        {
          result: {
            serverInfo: { name: 'test-server', version: '1.0.0' },
            protocolVersion: '2024-11-05',
          },
        },
        { result: {} },
      ]);
      global.fetch = mockFetch as unknown as typeof fetch;

      const transport = new HttpTransport({
        type: 'http',
        url: 'http://localhost:3000/mcp',
        headers: { Authorization: 'Bearer secret' },
      });

      await transport.connect();

      const initCall = mockFetch.mock.calls[0];
      expect(initCall[1].headers).toMatchObject({
        'Content-Type': 'application/json',
        Authorization: 'Bearer secret',
      });
    });
  });

  describe('disconnect', () => {
    it('should reset connection state', async () => {
      mockFetch = createMockFetch([
        {
          result: {
            serverInfo: { name: 'test-server', version: '1.0.0' },
            protocolVersion: '2024-11-05',
          },
        },
        { result: {} },
      ]);
      global.fetch = mockFetch as unknown as typeof fetch;

      const transport = new HttpTransport({
        type: 'http',
        url: 'http://localhost:3000/mcp',
      });

      await transport.connect();
      expect(transport.isConnected()).toBe(true);

      await transport.disconnect();
      expect(transport.isConnected()).toBe(false);
    });
  });

  describe('getServerInfo', () => {
    it('should return server info after connection', async () => {
      mockFetch = createMockFetch([
        {
          result: {
            serverInfo: { name: 'my-server', version: '2.0.0' },
            protocolVersion: '2024-11-05',
          },
        },
        { result: {} },
      ]);
      global.fetch = mockFetch as unknown as typeof fetch;

      const transport = new HttpTransport({
        type: 'http',
        url: 'http://localhost:3000/mcp',
      });

      await transport.connect();
      const info = await transport.getServerInfo();

      expect(info).toEqual({
        name: 'my-server',
        version: '2.0.0',
        protocolVersion: '2024-11-05',
      });
    });

    it('should throw error when not connected', async () => {
      const transport = new HttpTransport({
        type: 'http',
        url: 'http://localhost:3000/mcp',
      });

      await expect(transport.getServerInfo()).rejects.toThrow('Not connected');
    });
  });

  describe('listTools', () => {
    it('should return list of tools', async () => {
      const tools = [
        { name: 'tool1', description: 'First tool', inputSchema: { type: 'object' } },
        { name: 'tool2', description: 'Second tool', inputSchema: { type: 'object' } },
      ];

      mockFetch = createMockFetch([
        {
          result: {
            serverInfo: { name: 'server', version: '1.0.0' },
            protocolVersion: '2024-11-05',
          },
        },
        { result: {} },
        { result: { tools } },
      ]);
      global.fetch = mockFetch as unknown as typeof fetch;

      const transport = new HttpTransport({
        type: 'http',
        url: 'http://localhost:3000/mcp',
      });

      await transport.connect();
      const result = await transport.listTools();

      expect(result).toEqual(tools);

      // Verify tools/list request
      const listCall = mockFetch.mock.calls[2];
      const listBody = JSON.parse(listCall[1].body as string);
      expect(listBody.method).toBe('tools/list');
    });

    it('should throw error on list failure', async () => {
      mockFetch = createMockFetch([
        {
          result: {
            serverInfo: { name: 'server', version: '1.0.0' },
            protocolVersion: '2024-11-05',
          },
        },
        { result: {} },
        { error: { code: -32601, message: 'Method not found' } },
      ]);
      global.fetch = mockFetch as unknown as typeof fetch;

      const transport = new HttpTransport({
        type: 'http',
        url: 'http://localhost:3000/mcp',
      });

      await transport.connect();
      await expect(transport.listTools()).rejects.toThrow('Failed to list tools');
    });
  });

  describe('callTool', () => {
    it('should call tool and return success response', async () => {
      mockFetch = createMockFetch([
        {
          result: {
            serverInfo: { name: 'server', version: '1.0.0' },
            protocolVersion: '2024-11-05',
          },
        },
        { result: {} },
        {
          result: {
            content: [{ type: 'text', text: 'Order created: ORD-123' }],
          },
        },
      ]);
      global.fetch = mockFetch as unknown as typeof fetch;

      const transport = new HttpTransport({
        type: 'http',
        url: 'http://localhost:3000/mcp',
      });

      await transport.connect();
      const response = await transport.callTool('create-sales-order', {
        order: { lineItems: [{ sku: 'ABC', quantity: 1 }] },
      });

      expect(response.success).toBe(true);
      expect(response.data).toEqual({
        content: [{ type: 'text', text: 'Order created: ORD-123' }],
      });
    });

    it('should return error response on RPC error', async () => {
      mockFetch = createMockFetch([
        {
          result: {
            serverInfo: { name: 'server', version: '1.0.0' },
            protocolVersion: '2024-11-05',
          },
        },
        { result: {} },
        { error: { code: -32602, message: 'Invalid params' } },
      ]);
      global.fetch = mockFetch as unknown as typeof fetch;

      const transport = new HttpTransport({
        type: 'http',
        url: 'http://localhost:3000/mcp',
      });

      await transport.connect();
      const response = await transport.callTool('create-sales-order', {});

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe(-32602);
      expect(response.error?.message).toBe('Invalid params');
    });

    it('should handle isError in response', async () => {
      mockFetch = createMockFetch([
        {
          result: {
            serverInfo: { name: 'server', version: '1.0.0' },
            protocolVersion: '2024-11-05',
          },
        },
        { result: {} },
        {
          result: {
            content: [{ type: 'text', text: 'Order not found' }],
            isError: true,
          },
        },
      ]);
      global.fetch = mockFetch as unknown as typeof fetch;

      const transport = new HttpTransport({
        type: 'http',
        url: 'http://localhost:3000/mcp',
      });

      await transport.connect();
      const response = await transport.callTool('get-orders', { ids: ['invalid'] });

      expect(response.success).toBe(false);
      expect(response.error?.message).toBe('Order not found');
    });
  });

  describe('HTTP error handling', () => {
    it('should throw on HTTP error status', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      const transport = new HttpTransport({
        type: 'http',
        url: 'http://localhost:3000/mcp',
      });

      await expect(transport.connect()).rejects.toThrow('HTTP error: 500');
    });
  });
});

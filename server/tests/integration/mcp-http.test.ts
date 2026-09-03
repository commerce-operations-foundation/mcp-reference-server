import { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ConfigLoader } from '../../src/config/config-loader.js';
import { createOnxHttpServer, type OnxHttpServer } from '../../src/http-server.js';
import { ServerConfig } from '../../src/types/index.js';

const PROTOCOL_VERSION = '2026-07-28';
const envelope = {
  'io.modelcontextprotocol/protocolVersion': PROTOCOL_VERSION,
  'io.modelcontextprotocol/clientInfo': { name: 'http-integration-test', version: '1.0.0' },
  'io.modelcontextprotocol/clientCapabilities': {},
};

describe('MCP 2026-07-28 HTTP', () => {
  let app: OnxHttpServer;
  let baseUrl: string;
  let requestId = 0;

  beforeAll(async () => {
    const config = new ConfigLoader().loadDefaults() as ServerConfig;
    config.adapter = {
      type: 'built-in',
      name: 'mock',
      options: { errorRate: 0, latency: '0ms' },
    };
    app = await createOnxHttpServer(config);
    await new Promise<void>((resolve, reject) => {
      app.server.once('error', reject);
      app.server.listen(0, '127.0.0.1', resolve);
    });
    const address = app.server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  }, 30000);

  afterAll(async () => {
    await app?.close();
  });

  async function mcpRequest(method: string, params: Record<string, unknown> = {}, methodHeader = method) {
    const headers: Record<string, string> = {
      Accept: 'application/json, text/event-stream',
      'Content-Type': 'application/json',
      'MCP-Protocol-Version': PROTOCOL_VERSION,
      'Mcp-Method': methodHeader,
    };
    if (typeof params.name === 'string') {
      headers['Mcp-Name'] = params.name;
    }

    const response = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: ++requestId,
        method,
        params: { ...params, _meta: envelope },
      }),
    });
    return { response, body: await response.json() as any };
  }

  it('negotiates the modern protocol without a session or initialize handshake', async () => {
    const { response, body } = await mcpRequest('server/discover');

    expect(response.status).toBe(200);
    expect(response.headers.get('mcp-session-id')).toBeNull();
    expect(body.result.supportedVersions).toContain(PROTOCOL_VERSION);
    expect(body.result._meta['io.modelcontextprotocol/serverInfo'].name).toBe('cof-mcp');
  });

  it('exposes the complete existing onX tool catalog', async () => {
    const { body } = await mcpRequest('tools/list');
    const names = body.result.tools.map((tool: any) => tool.name);

    expect(body.result.tools).toHaveLength(12);
    expect(names).toContain('create-sales-order');
    expect(names).toContain('get-inventory');
    expect(names).toContain('get-returns');
  });

  it('executes an onX tool against the mock adapter', async () => {
    const { response, body } = await mcpRequest('tools/call', {
      name: 'get-inventory',
      arguments: { skus: ['SKU001'] },
    });

    expect(response.status).toBe(200);
    const result = JSON.parse(body.result.content[0].text);
    expect(result.success).toBe(true);
    expect(result.inventory[0].sku).toBe('SKU001');
  });

  it('handles independent HTTP exchanges without shared MCP session state', async () => {
    const [first, second] = await Promise.all([
      mcpRequest('tools/list'),
      mcpRequest('tools/call', { name: 'get-inventory', arguments: { skus: ['SKU002'] } }),
    ]);

    expect(first.response.headers.get('mcp-session-id')).toBeNull();
    expect(second.response.headers.get('mcp-session-id')).toBeNull();
    expect(first.body.result.tools).toHaveLength(12);
    expect(JSON.parse(second.body.result.content[0].text).inventory[0].sku).toBe('SKU002');
  });

  it('honors modern protocol routing headers', async () => {
    const { response, body } = await mcpRequest('tools/list', {}, 'tools/call');

    expect(response.status).toBe(400);
    expect(body.error.code).toBe(-32020);
  });

  it('preserves health and Juniper REST endpoints', async () => {
    const health = await fetch(`${baseUrl}/health`);
    const catalog = await fetch(`${baseUrl}/api/tools`);
    const inventory = await fetch(`${baseUrl}/api/tools/get-inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skus: ['SKU003'] }),
    });

    expect(health.status).toBe(200);
    expect((await health.json() as any).server).toBe('onx-mcp-http');
    expect((await catalog.json() as any).count).toBe(12);
    const inventoryBody = await inventory.json() as any;
    expect(inventory.status).toBe(200);
    expect(inventoryBody.success).toBe(true);
    expect(inventoryBody.inventory[0].sku).toBe('SKU003');
  });
});

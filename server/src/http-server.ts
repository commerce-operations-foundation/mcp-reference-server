#!/usr/bin/env node

/** onX MCP 2026-07-28 HTTP endpoint plus the temporary Juniper REST facade. */

import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { fileURLToPath } from 'node:url';
import { createMcpHandler, type McpHttpHandler } from '@modelcontextprotocol/server';
import { toNodeHandler } from '@modelcontextprotocol/node';
import { ConfigManager } from './config/config-manager.js';
import { createOnxMcpRuntime, type OnxMcpRuntime } from './server.js';
import { AdapterConfig, ServerConfig } from './types/index.js';
import { Logger } from './utils/logger.js';
import { RetryHandler } from './utils/retry.js';
import { Sanitizer } from './utils/sanitizer.js';
import { TimeoutHandler } from './utils/timeout.js';

const PORT = parseInt(process.env.PORT || '4000', 10);

async function parseBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString();
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function cors(res: ServerResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, MCP-Protocol-Version, Mcp-Method, Mcp-Name'
  );
}

function json(res: ServerResponse, status: number, data: unknown): void {
  cors(res);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

type RouteHandler = (body: unknown) => Promise<unknown>;

function createRestRoutes(runtime: OnxMcpRuntime): Record<string, RouteHandler> {
  const orchestrator = runtime.orchestrator;
  return {
    '/api/tools/create-sales-order': (body) => orchestrator.createSalesOrder(body as any),
    '/api/tools/cancel-order': (body) => orchestrator.cancelOrder(body as any),
    '/api/tools/update-order': (body) => orchestrator.updateOrder(body as any),
    '/api/tools/fulfill-order': (body) => orchestrator.fulfillOrder(body as any),
    '/api/tools/create-return': (body) => orchestrator.createReturn(body as any),
    '/api/tools/get-orders': (body) => orchestrator.getOrders(body as any),
    '/api/tools/get-customers': (body) => orchestrator.getCustomers(body as any),
    '/api/tools/get-products': (body) => orchestrator.getProducts(body as any),
    '/api/tools/get-product-variants': (body) => orchestrator.getProductVariants(body as any),
    '/api/tools/get-inventory': (body) => orchestrator.getInventory(body as any),
    '/api/tools/get-fulfillments': (body) => orchestrator.getFulfillments(body as any),
    '/api/tools/get-returns': (body) => orchestrator.getReturns(body as any),
  };
}

export interface OnxHttpServer {
  server: ReturnType<typeof createServer>;
  mcpHandler: McpHttpHandler;
  runtime: OnxMcpRuntime;
  close(): Promise<void>;
}

export async function createOnxHttpServer(config: ServerConfig): Promise<OnxHttpServer> {
  const adapterConfig: AdapterConfig = {
    type: (process.env.ADAPTER_TYPE as AdapterConfig['type']) ?? config.adapter.type ?? 'built-in',
    name: process.env.ADAPTER_NAME ?? config.adapter.name ?? 'mock',
    package: process.env.ADAPTER_PACKAGE ?? config.adapter.package,
    path: process.env.ADAPTER_PATH ?? config.adapter.path,
    options: config.adapter.options,
  };
  const runtime = await createOnxMcpRuntime(config, adapterConfig);
  const routes = createRestRoutes(runtime);
  const mcpHandler = createMcpHandler(runtime.factory, {
    legacy: 'stateless',
    onerror: (error) => Logger.error('MCP HTTP error:', error),
  });
  const nodeMcpHandler = toNodeHandler(mcpHandler, {
    onerror: (error) => Logger.error('MCP Node adapter error:', error),
  });

  const server = createServer(async (req, res) => {
    const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;
    const method = req.method ?? 'GET';
    cors(res);

    if (method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (pathname === '/mcp') {
      await nodeMcpHandler(req, res);
      return;
    }

    if (pathname === '/health' && method === 'GET') {
      try {
        const health = await runtime.orchestrator.checkHealth();
        json(res, 200, { server: 'onx-mcp-http', health });
      } catch {
        json(res, 200, { status: 'ok', server: 'onx-mcp-http' });
      }
      return;
    }

    if (pathname === '/api/tools' && method === 'GET') {
      json(res, 200, {
        tools: Object.keys(routes).map((path) => path.replace('/api/tools/', '')),
        count: Object.keys(routes).length,
      });
      return;
    }

    const route = routes[pathname];
    if (!route) {
      json(res, 404, { error: 'Not found', availableRoutes: ['/mcp', ...Object.keys(routes)] });
      return;
    }

    if (method !== 'POST') {
      json(res, 405, { error: 'Method not allowed. Use POST.' });
      return;
    }

    try {
      json(res, 200, await route(await parseBody(req)));
    } catch (error: any) {
      Logger.error(`Error handling ${pathname}`, { error: error?.message ?? String(error) });
      json(res, 500, { error: error?.message ?? 'Internal server error' });
    }
  });

  return {
    server,
    mcpHandler,
    runtime,
    async close() {
      await new Promise<void>((resolve, reject) => {
        if (!server.listening) return resolve();
        server.close((error) => (error ? reject(error) : resolve()));
      });
      await mcpHandler.close();
      await runtime.close();
    },
  };
}

async function main(): Promise<void> {
  Logger.init('info');
  const config = ConfigManager.getInstance().getAll();
  RetryHandler.setConfig(config.resilience.retry);
  Sanitizer.setConfig(config.security.sanitization);
  TimeoutHandler.setConfig(config.performance.timeout);

  const app = await createOnxHttpServer(config);
  app.server.listen(PORT, () => {
    Logger.info(`onX MCP HTTP Server running on port ${PORT}`);
    Logger.info(`MCP endpoint: http://localhost:${PORT}/mcp`);
    Logger.info(`Health check: http://localhost:${PORT}/health`);
    Logger.info(`Tools list: http://localhost:${PORT}/api/tools`);
  });

  const shutdown = async () => {
    Logger.info('Shutting down HTTP server...');
    await app.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error('Failed to start HTTP server:', error);
    process.exit(1);
  });
}

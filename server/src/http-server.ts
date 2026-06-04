#!/usr/bin/env node

/**
 * onX MCP Server — HTTP REST Entry Point
 *
 * Exposes all 12 onX operations as HTTP REST endpoints, backed by the same
 * ServiceOrchestrator and adapter pattern used by the MCP stdio server.
 *
 * This allows web applications (like Juniper Commerce) to call the MCP server
 * over HTTP instead of stdio.
 */

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { ConfigManager } from './config/config-manager.js';
import { ServiceOrchestrator } from './services/service-orchestrator.js';
import { Logger } from './utils/logger.js';
import { RetryHandler } from './utils/retry.js';
import { Sanitizer } from './utils/sanitizer.js';
import { TimeoutHandler } from './utils/timeout.js';

const PORT = parseInt(process.env.PORT || '4000', 10);

let orchestrator: ServiceOrchestrator;

async function parseBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString();
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); }
      catch { reject(new Error('Invalid JSON body')); }
    });
    req.on('error', reject);
  });
}

function cors(res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function json(res: ServerResponse, status: number, data: unknown) {
  cors(res);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

type RouteHandler = (body: unknown) => Promise<unknown>;

const routes: Record<string, RouteHandler> = {
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

async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  const url = req.url ?? '/';
  const method = req.method ?? 'GET';

  cors(res);

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (url === '/health' && method === 'GET') {
    try {
      const health = await orchestrator.checkHealth();
      json(res, 200, { server: 'onx-mcp-http', health });
    } catch {
      json(res, 200, { status: 'ok', server: 'onx-mcp-http' });
    }
    return;
  }

  if (url === '/api/tools' && method === 'GET') {
    json(res, 200, {
      tools: Object.keys(routes).map(path => path.replace('/api/tools/', '')),
      count: Object.keys(routes).length,
    });
    return;
  }

  const handler = routes[url];
  if (!handler) {
    json(res, 404, { error: 'Not found', availableRoutes: Object.keys(routes) });
    return;
  }

  if (method !== 'POST') {
    json(res, 405, { error: 'Method not allowed. Use POST.' });
    return;
  }

  try {
    const body = await parseBody(req);
    const result = await handler(body);
    json(res, 200, result);
  } catch (err: any) {
    Logger.error(`Error handling ${url}`, { error: err?.message ?? String(err) });
    json(res, 500, { error: err?.message ?? 'Internal server error' });
  }
}

async function main() {
  Logger.init('info');

  const configManager = ConfigManager.getInstance();
  const config = configManager.getAll();

  RetryHandler.setConfig(config.resilience.retry);
  Sanitizer.setConfig(config.security.sanitization);
  TimeoutHandler.setConfig(config.performance.timeout);

  orchestrator = new ServiceOrchestrator();
  await orchestrator.initialize({
    type: (process.env.ADAPTER_TYPE as any) ?? config.adapter.type ?? 'built-in',
    name: process.env.ADAPTER_NAME ?? config.adapter.name ?? 'mock',
    package: process.env.ADAPTER_PACKAGE ?? config.adapter.package,
    path: process.env.ADAPTER_PATH ?? config.adapter.path,
  });

  const server = createServer(handleRequest);

  server.listen(PORT, () => {
    Logger.info(`onX MCP HTTP Server running on port ${PORT}`);
    Logger.info(`Health check: http://localhost:${PORT}/health`);
    Logger.info(`Tools list: http://localhost:${PORT}/api/tools`);
    Logger.info(`Adapter: ${process.env.ADAPTER_TYPE ?? 'built-in'}/${process.env.ADAPTER_NAME ?? 'mock'}`);
  });

  const shutdown = async () => {
    Logger.info('Shutting down HTTP server...');
    server.close();
    await orchestrator.cleanup();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('Failed to start HTTP server:', err);
  process.exit(1);
});

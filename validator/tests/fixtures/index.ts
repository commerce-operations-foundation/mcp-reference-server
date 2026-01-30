/**
 * Test Fixtures
 *
 * Provides reusable test data and mock factories for consistent testing
 * across all test files.
 */

import { vi } from 'vitest';
import type { ToolDefinition, ValidationResult, ToolValidationResult } from '../../src/types.js';
import type { McpTransport, McpResponse, ServerInfo } from '../../src/transports/base.js';
import { ONX_TOOLS } from '../../src/schemas/index.js';

// ============================================================================
// Server Info Fixtures
// ============================================================================

/**
 * Creates a mock server info object
 */
export function createServerInfo(overrides: Partial<ServerInfo> = {}): ServerInfo {
  return {
    name: 'test-server',
    version: '1.0.0',
    protocolVersion: '2024-11-05',
    ...overrides,
  };
}

// ============================================================================
// Tool Definition Fixtures
// ============================================================================

/**
 * Creates a minimal valid tool definition
 */
export function createToolDefinition(
  name: string,
  overrides: Partial<ToolDefinition> = {}
): ToolDefinition {
  return {
    name,
    description: `Test tool: ${name}`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
    ...overrides,
  };
}

/**
 * All possible tool definitions (including those without schemas yet)
 */
const ALL_TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: 'create-sales-order',
    description: 'Create a new sales order',
    inputSchema: {
      type: 'object',
      properties: {
        order: {
          type: 'object',
          properties: {
            externalId: { type: 'string' },
            lineItems: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  sku: { type: 'string' },
                  quantity: { type: 'number' },
                },
                required: ['sku', 'quantity'],
              },
            },
          },
          required: ['lineItems'],
        },
      },
      required: ['order'],
    },
  },
  {
    name: 'update-order',
    description: 'Update an existing order',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        updates: { type: 'object' },
      },
      required: ['id', 'updates'],
    },
  },
  {
    name: 'cancel-order',
    description: 'Cancel an order',
    inputSchema: {
      type: 'object',
      properties: {
        orderId: { type: 'string' },
        reason: { type: 'string' },
        notifyCustomer: { type: 'boolean' },
        notes: { type: 'string' },
        lineItems: { type: 'array' },
      },
      required: ['orderId'],
    },
  },
  {
    name: 'fulfill-order',
    description: 'Fulfill an order',
    inputSchema: {
      type: 'object',
      properties: {
        orderId: { type: 'string' },
        lineItems: { type: 'array' },
        trackingNumbers: { type: 'array' },
      },
      required: ['orderId', 'lineItems', 'trackingNumbers'],
    },
  },
  {
    name: 'create-return',
    description: 'Create a return',
    inputSchema: {
      type: 'object',
      properties: {
        return: { type: 'object' },
      },
      required: ['return'],
    },
  },
  {
    name: 'get-orders',
    description: 'Get orders',
    inputSchema: {
      type: 'object',
      properties: {
        ids: { type: 'array' },
        externalIds: { type: 'array' },
        statuses: { type: 'array' },
        names: { type: 'array' },
        includeLineItems: { type: 'boolean' },
      },
    },
  },
  {
    name: 'get-customers',
    description: 'Get customers',
    inputSchema: {
      type: 'object',
      properties: {
        ids: { type: 'array' },
        emails: { type: 'array' },
      },
    },
  },
  {
    name: 'get-products',
    description: 'Get products',
    inputSchema: {
      type: 'object',
      properties: {
        ids: { type: 'array' },
        skus: { type: 'array' },
      },
    },
  },
  {
    name: 'get-product-variants',
    description: 'Get product variants',
    inputSchema: {
      type: 'object',
      properties: {
        ids: { type: 'array' },
        skus: { type: 'array' },
        productIds: { type: 'array' },
      },
    },
  },
  {
    name: 'get-inventory',
    description: 'Get inventory levels',
    inputSchema: {
      type: 'object',
      properties: {
        skus: { type: 'array' },
        locationIds: { type: 'array' },
      },
      required: ['skus'],
    },
  },
  {
    name: 'get-fulfillments',
    description: 'Get fulfillments',
    inputSchema: {
      type: 'object',
      properties: {
        ids: { type: 'array' },
        orderIds: { type: 'array' },
      },
    },
  },
  {
    name: 'get-returns',
    description: 'Get returns',
    inputSchema: {
      type: 'object',
      properties: {
        ids: { type: 'array' },
        orderIds: { type: 'array' },
        returnNumbers: { type: 'array' },
        statuses: { type: 'array' },
        outcomes: { type: 'array' },
      },
    },
  },
];

/**
 * Creates a complete set of onX-compliant tool definitions
 * Only includes tools that have canonical schemas (ONX_TOOLS)
 */
export function createCompliantToolSet(): ToolDefinition[] {
  return ALL_TOOL_DEFINITIONS.filter(tool =>
    ONX_TOOLS.includes(tool.name)
  );
}

/**
 * Creates a partial tool set (missing some required tools)
 * Returns roughly half the required tools
 */
export function createPartialToolSet(): ToolDefinition[] {
  const compliantTools = createCompliantToolSet();
  return compliantTools.slice(0, Math.ceil(compliantTools.length / 2));
}

// ============================================================================
// Mock Transport Factory
// ============================================================================

/**
 * Creates a mock MCP transport for testing
 */
export function createMockTransport(config: {
  serverInfo?: ServerInfo;
  tools?: ToolDefinition[];
  callToolResponse?: McpResponse | ((name: string, args: Record<string, unknown>) => McpResponse);
} = {}): McpTransport {
  const {
    serverInfo = createServerInfo(),
    tools = createCompliantToolSet(),
    callToolResponse = { success: true, data: { content: [{ type: 'text', text: 'OK' }] } },
  } = config;

  let connected = false;

  return {
    connect: vi.fn(async () => {
      connected = true;
    }),
    disconnect: vi.fn(async () => {
      connected = false;
    }),
    getServerInfo: vi.fn(async () => {
      if (!connected) throw new Error('Not connected');
      return serverInfo;
    }),
    listTools: vi.fn(async () => {
      if (!connected) throw new Error('Not connected');
      return tools;
    }),
    callTool: vi.fn(async (name: string, args: Record<string, unknown>) => {
      if (!connected) throw new Error('Not connected');
      if (typeof callToolResponse === 'function') {
        return callToolResponse(name, args);
      }
      return callToolResponse;
    }),
    isConnected: vi.fn(() => connected),
  };
}

// ============================================================================
// Validation Result Fixtures
// ============================================================================

/**
 * Creates a passing validation result
 */
export function createPassingResult(
  tool: string,
  check: string,
  message?: string
): ValidationResult {
  return {
    passed: true,
    tool,
    check,
    message: message || `Check ${check} passed`,
  };
}

/**
 * Creates a failing validation result
 */
export function createFailingResult(
  tool: string,
  check: string,
  message?: string,
  details?: unknown
): ValidationResult {
  return {
    passed: false,
    tool,
    check,
    message: message || `Check ${check} failed`,
    details,
  };
}

/**
 * Creates a tool validation result
 */
export function createToolValidationResult(
  tool: string,
  config: Partial<ToolValidationResult> = {}
): ToolValidationResult {
  return {
    tool,
    exists: true,
    schemaValid: true,
    functionalValid: true,
    errors: [],
    warnings: [],
    ...config,
  };
}

// ============================================================================
// HTTP Response Fixtures
// ============================================================================

/**
 * Creates a mock JSON-RPC response
 */
export function createJsonRpcResponse(result: unknown, id = 1) {
  return {
    jsonrpc: '2.0' as const,
    id,
    result,
  };
}

/**
 * Creates a mock JSON-RPC error response
 */
export function createJsonRpcError(code: number, message: string, id = 1) {
  return {
    jsonrpc: '2.0' as const,
    id,
    error: {
      code,
      message,
    },
  };
}

/**
 * Creates a mock fetch function for HTTP transport testing
 */
export function createMockFetch(responses: Array<{ result?: unknown; error?: { code: number; message: string } }>) {
  let callIndex = 0;

  return vi.fn(async (_url: string, _options: RequestInit) => {
    const response = responses[callIndex] || responses[responses.length - 1];
    callIndex++;

    const body = response.error
      ? createJsonRpcError(response.error.code, response.error.message, callIndex)
      : createJsonRpcResponse(response.result, callIndex);

    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => body,
    } as Response;
  });
}

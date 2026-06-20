import { vi } from 'vitest';
import type { ToolDefinition, ValidationResult, ToolValidationResult } from '../../src/types.js';
import type { McpTransport, McpToolResult, ServerInfo } from '../../src/transports/index.js';
import { ONX_TOOLS, getToolInputSchema } from '@onx/schemas';

export function createServerInfo(overrides: Partial<ServerInfo> = {}): ServerInfo {
  return {
    name: 'test-server',
    version: '1.0.0',
    protocolVersion: '2024-11-05',
    ...overrides,
  };
}

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

export function createCompliantToolSet(): ToolDefinition[] {
  return ONX_TOOLS.map(name => {
    const schema = getToolInputSchema(name);
    if (!schema) {
      throw new Error(`Schema not found for tool: ${name}`);
    }
    return {
      name,
      description: schema.description || `Tool: ${name}`,
      inputSchema: schema,
    };
  });
}

/**
 * Creates a mock MCP transport for testing
 */
export function createMockTransport(config: {
  serverInfo?: ServerInfo;
  tools?: ToolDefinition[];
  callToolResponse?: McpToolResult | ((name: string, args: Record<string, unknown>) => McpToolResult);
} = {}): McpTransport {
  const {
    serverInfo = createServerInfo(),
    tools = createCompliantToolSet(),
    callToolResponse = { content: [{ type: 'text', text: 'OK' }], isError: false },
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

// Create passing, failing, and tool validation results
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

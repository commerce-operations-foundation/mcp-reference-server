/**
 * Base transport interface for MCP communication
 */

import { ToolDefinition } from '../types.js';

export interface McpResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: number;
    message: string;
  };
}

export interface ServerInfo {
  name: string;
  version: string;
  protocolVersion: string;
}

export interface McpTransport {

  // Connect to the MCP server
  connect(): Promise<void>;

  // Disconnect from the MCP server
  disconnect(): Promise<void>;

  // Get server information via initialize
  getServerInfo(): Promise<ServerInfo>;

  // List all available tools
  listTools(): Promise<ToolDefinition[]>;

  // Call a tool with the given arguments
  callTool(name: string, args: Record<string, unknown>): Promise<McpResponse>;

  // Check if connected
  isConnected(): boolean;
}

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}
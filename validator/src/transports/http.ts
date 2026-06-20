/**
 * HTTP transport for MCP servers exposing HTTP endpoints
 */

import { McpTransport, McpToolResult, ServerInfo, JsonRpcRequest, JsonRpcResponse } from './base.js';
import { ToolDefinition, HttpTransportConfig } from '../types.js';


export class HttpTransport implements McpTransport {
  private config: HttpTransportConfig;
  private requestId = 0;
  private serverInfo: ServerInfo | null = null;
  private connected = false;

  constructor(config: HttpTransportConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    // Send initialize request
    const response = await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'onx-validator',
        version: '1.0.0',
      },
    });

    if (response.error) {
      throw new Error(`Initialize failed: ${response.error.message}`);
    }

    const result = response.result as {
      serverInfo?: { name?: string; version?: string };
      protocolVersion?: string;
    };

    this.serverInfo = {
      name: result.serverInfo?.name || 'unknown',
      version: result.serverInfo?.version || 'unknown',
      protocolVersion: result.protocolVersion || 'unknown',
    };

    // Send initialized notification
    await this.sendNotification('notifications/initialized', {});

    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.serverInfo = null;
  }

  async getServerInfo(): Promise<ServerInfo> {
    if (!this.serverInfo) {
      throw new Error('Not connected');
    }
    return this.serverInfo;
  }

  async listTools(): Promise<ToolDefinition[]> {
    const response = await this.sendRequest('tools/list', {});

    if (response.error) {
      throw new Error(`Failed to list tools: ${response.error.message}`);
    }

    const result = response.result as { tools?: ToolDefinition[] };
    return result.tools || [];
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<McpToolResult> {
    const response = await this.sendRequest('tools/call', {
      name,
      arguments: args,
    });

    if (response.error) {
      // JSON-RPC level error - wrap as MCP tool result
      return {
        content: [{ type: 'text', text: response.error.message }],
        isError: true,
      };
    }

    const result = response.result as {
      content?: Array<{ type: string; text?: string }>;
      isError?: boolean;
    };

    return {
      content: result.content || [],
      isError: result.isError ?? false,
    };
  }

  isConnected(): boolean {
    return this.connected;
  }

  private async sendRequest(method: string, params: Record<string, unknown>): Promise<JsonRpcResponse> {
    const id = ++this.requestId;
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    const response = await fetch(this.config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json() as JsonRpcResponse;
    return json;
  }

  private async sendNotification(method: string, params: Record<string, unknown>): Promise<void> {
    const notification = {
      jsonrpc: '2.0',
      method,
      params,
    };

    try {
      await fetch(this.config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.config.headers,
        },
        body: JSON.stringify(notification),
      });
    } catch {
      // Notifications don't require a response, ignore errors
    }
  }
}

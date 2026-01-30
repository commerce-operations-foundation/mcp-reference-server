/**
 * HTTP transport for MCP servers exposing HTTP endpoints
 */

import { McpTransport, McpResponse, ServerInfo } from './base.js';
import { ToolDefinition, HttpTransportConfig } from '../types.js';

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

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

  async callTool(name: string, args: Record<string, unknown>): Promise<McpResponse> {
    const response = await this.sendRequest('tools/call', {
      name,
      arguments: args,
    });

    if (response.error) {
      return {
        success: false,
        error: {
          code: response.error.code,
          message: response.error.message,
        },
      };
    }

    const result = response.result as {
      content?: Array<{ type: string; text?: string }>;
      isError?: boolean;
    };

    if (result.isError) {
      const errorText = result.content?.find(c => c.type === 'text')?.text || 'Unknown error';
      return {
        success: false,
        error: {
          code: -1,
          message: errorText,
        },
      };
    }

    return {
      success: true,
      data: result,
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

/**
 * Stdio transport for MCP servers running as child processes
 */

import { spawn, ChildProcess } from 'node:child_process';
import { McpTransport, McpToolResult, ServerInfo, JsonRpcRequest, JsonRpcResponse } from './base.js';
import { ToolDefinition, StdioTransportConfig } from '../types.js';

export class StdioTransport implements McpTransport {
  private config: StdioTransportConfig;
  private process: ChildProcess | null = null;
  private requestId = 0;
  private pendingRequests = new Map<number, {
    resolve: (value: JsonRpcResponse) => void;
    reject: (error: Error) => void;
  }>();
  private buffer = '';
  private serverInfo: ServerInfo | null = null;

  constructor(config: StdioTransportConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.process = spawn(this.config.command, this.config.args || [], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, ...this.config.env },
      });

      this.process.stdout?.on('data', (data: Buffer) => {
        this.handleData(data.toString());
      });

      this.process.stderr?.on('data', (data: Buffer) => {
        // Log stderr but don't fail - servers may write logs here
        if (process.env.DEBUG) {
          console.error('[server stderr]', data.toString());
        }
      });

      this.process.on('error', (error) => {
        reject(new Error(`Failed to start server: ${error.message}`));
      });

      this.process.on('close', (code) => {
        if (code !== 0 && code !== null) {
          // Reject any pending requests
          for (const { reject } of this.pendingRequests.values()) {
            reject(new Error(`Server process exited with code ${code}`));
          }
          this.pendingRequests.clear();
        }
      });

      // Give the process a moment to start, then initialize
      setTimeout(async () => {
        try {
          const response = await this.sendRequest('initialize', {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: {
              name: 'onx-validator',
              version: '1.0.0',
            },
          });

          if (response.error) {
            reject(new Error(`Initialize failed: ${response.error.message}`));
            return;
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
          this.sendNotification('notifications/initialized', {});

          resolve();
        } catch (error) {
          reject(error);
        }
      }, 500);
    });
  }

  async disconnect(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
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
    return this.process !== null && !this.process.killed;
  }

  private handleData(data: string): void {
    this.buffer += data;

    // Process complete JSON-RPC messages (newline-delimited)
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const message = JSON.parse(line) as JsonRpcResponse;

        if (message.id !== undefined) {
          const pending = this.pendingRequests.get(message.id);
          if (pending) {
            pending.resolve(message);
            this.pendingRequests.delete(message.id);
          }
        }
      } catch {
        // Ignore non-JSON lines (might be logs)
        if (process.env.DEBUG) {
          console.error('[parse error]', line);
        }
      }
    }
  }

  private sendRequest(method: string, params: Record<string, unknown>): Promise<JsonRpcResponse> {
    return new Promise((resolve, reject) => {
      if (!this.process?.stdin) {
        reject(new Error('Not connected'));
        return;
      }

      const id = ++this.requestId;
      const request: JsonRpcRequest = {
        jsonrpc: '2.0',
        id,
        method,
        params,
      };

      this.pendingRequests.set(id, { resolve, reject });

      const message = JSON.stringify(request) + '\n';
      this.process.stdin.write(message);

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request ${method} timed out`));
        }
      }, 30000);
    });
  }

  private sendNotification(method: string, params: Record<string, unknown>): void {
    if (!this.process?.stdin) return;

    const notification = {
      jsonrpc: '2.0',
      method,
      params,
    };

    this.process.stdin.write(JSON.stringify(notification) + '\n');
  }
}

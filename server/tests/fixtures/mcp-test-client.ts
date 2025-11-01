/**
 * Test client for MCP protocol testing
 */

import { EventEmitter } from 'events';

export interface MCPRequest {
  jsonrpc: '2.0';
  method: string;
  params?: any;
  id: string | number;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id: string | number;
}

/**
 * Mock MCP client for testing server behavior
 */
export class MockMCPClient extends EventEmitter {
  private requestId = 1;
  private pendingRequests = new Map<string | number, {
    resolve: (response: MCPResponse) => void;
    reject: (error: Error) => void;
  }>();

  /**
   * Send a request to the server
   */
  async sendRequest(method: string, params?: any): Promise<MCPResponse> {
    const id = this.requestId++;
    const request: MCPRequest = {
      jsonrpc: '2.0',
      method,
      params,
      id
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.emit('request', request);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request ${id} timed out`));
        }
      }, 5000);
    });
  }

  /**
   * Handle response from server
   */
  handleResponse(response: MCPResponse): void {
    const pending = this.pendingRequests.get(response.id);
    if (pending) {
      this.pendingRequests.delete(response.id);
      pending.resolve(response);
    }
  }

  /**
   * Helper methods for common requests
   */
  async initialize(): Promise<MCPResponse> {
    return this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    });
  }

  async listTools(): Promise<MCPResponse> {
    return this.sendRequest('tools/list');
  }

  async callTool(name: string, arguments_: any): Promise<MCPResponse> {
    return this.sendRequest('tools/call', {
      name,
      arguments: arguments_
    });
  }

  async captureOrder(orderParams: any): Promise<MCPResponse> {
    return this.callTool('capture-order', orderParams);
  }

  async getOrder(orderIdentifier: any): Promise<MCPResponse> {
    return this.callTool('get-order', orderIdentifier);
  }

  async cancelOrder(orderId: string, reason?: string): Promise<MCPResponse> {
    return this.callTool('cancel-order', { orderId, reason });
  }

  async getInventory(sku: string, warehouseId?: string): Promise<MCPResponse> {
    return this.callTool('get-inventory', { sku, warehouseId });
  }
}

/**
 * Create a mock stdio transport for testing
 */
export class MockStdioTransport extends EventEmitter {
  private client: MockMCPClient;
  private server: any; // Will be the actual server instance

  constructor() {
    super();
    this.client = new MockMCPClient();
  }

  connectClient(client: MockMCPClient): void {
    this.client = client;
    
    // Forward requests to server
    this.client.on('request', (request) => {
      this.emit('request', request);
    });
  }

  connectServer(server: any): void {
    this.server = server;
    
    // Forward responses to client
    this.on('response', (response) => {
      this.client.handleResponse(response);
    });
  }

  sendToServer(request: MCPRequest): void {
    this.emit('request', request);
  }

  sendToClient(response: MCPResponse): void {
    this.emit('response', response);
  }

  getClient(): MockMCPClient {
    return this.client;
  }
}
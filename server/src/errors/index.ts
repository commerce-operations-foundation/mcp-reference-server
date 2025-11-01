/**
 * MCP Protocol Error Definitions
 * Using SDK error types with specific error classes used by the application
 */

import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

// Re-export SDK error for backward compatibility
export { McpError as MCPError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

// Error classes actually used by error-adapter.ts
export class MethodNotFoundError extends McpError {
  constructor(method: string) {
    super(ErrorCode.MethodNotFound, 'Method not found', { method });
    this.name = 'MethodNotFoundError';
  }
}

export class InvalidParamsError extends McpError {
  constructor(data?: any) {
    super(ErrorCode.InvalidParams, 'Invalid params', data);
    this.name = 'InvalidParamsError';
  }
}

export class ToolNotFoundError extends McpError {
  constructor(toolName: string) {
    super(-32001, 'Tool not found', { toolName });
    this.name = 'ToolNotFoundError';
  }
}

/**
 * Fulfillment-specific error for adapter failures
 */
export class FulfillmentAdapterError extends McpError {
  constructor(message: string, data?: any) {
    super(-32100, `Fulfillment Adapter Error: ${message}`, data);
    this.name = 'FulfillmentAdapterError';
  }
}

/**
 * Fulfillment-specific error for validation failures
 */
export class FulfillmentValidationError extends McpError {
  constructor(message: string, data?: any) {
    super(-32102, `Fulfillment Validation Error: ${message}`, data);
    this.name = 'FulfillmentValidationError';
  }
}
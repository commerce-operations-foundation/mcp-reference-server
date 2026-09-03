/**
 * MCP Protocol Error Definitions
 * Using SDK error types with specific error classes used by the application
 */
import { ProtocolError, ProtocolErrorCode } from "@modelcontextprotocol/server";

// Re-export SDK error for backward compatibility
export { ProtocolError as MCPError, ProtocolErrorCode } from '@modelcontextprotocol/server';

// Error classes actually used by error-adapter.ts
export class MethodNotFoundError extends ProtocolError {
  constructor(method: string) {
    super(ProtocolErrorCode.MethodNotFound, 'Method not found', { method });
    this.name = 'MethodNotFoundError';
  }
}

export class InvalidParamsError extends ProtocolError {
  constructor(data?: any) {
    super(ProtocolErrorCode.InvalidParams, 'Invalid params', data);
    this.name = 'InvalidParamsError';
  }
}

export class ToolNotFoundError extends ProtocolError {
  constructor(toolName: string) {
    super(-32001, 'Tool not found', { toolName });
    this.name = 'ToolNotFoundError';
  }
}

/**
 * Fulfillment-specific error for adapter failures
 */
export class FulfillmentAdapterError extends ProtocolError {
  constructor(message: string, data?: any) {
    super(-32100, `Fulfillment Adapter Error: ${message}`, data);
    this.name = 'FulfillmentAdapterError';
  }
}

/**
 * Fulfillment-specific error for validation failures
 */
export class FulfillmentValidationError extends ProtocolError {
  constructor(message: string, data?: any) {
    super(-32102, `Fulfillment Validation Error: ${message}`, data);
    this.name = 'FulfillmentValidationError';
  }
}

/**
 * Error Adapter Layer
 * Provides deterministic mapping from internal errors to MCP protocol errors
 */

import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { 
  FulfillmentError,
  ValidationError,
  ConfigurationError,
  ConnectionError
} from '../utils/errors.js';
import { AdapterError } from '../types/adapter.js';
import {
  InvalidParamsError,
  FulfillmentAdapterError,
  FulfillmentValidationError,
  ToolNotFoundError,
  MethodNotFoundError
} from './index.js';

/**
 * Type for MCP tool response content
 */
export type MCPContentItem = {
  type: 'text';
  text: string;
};

/**
 * Type for MCP tool response
 */
export type MCPToolResponse = {
  content: MCPContentItem[];
  isError?: boolean;
};

/**
 * Type guard to check if error is a protocol error
 */
export function isProtocolError(error: Error): boolean {
  // Check if error has explicit isProtocolError property
  if ('isProtocolError' in error) {
    const isProtocolErrorValue = (error as any).isProtocolError;
    if (typeof isProtocolErrorValue === 'boolean') {
      return isProtocolErrorValue;
    }
  }
  
  // Protocol errors are validation, unknown tool, or malformed request errors
  return (
    error instanceof ValidationError ||
    error instanceof ToolNotFoundError ||
    error instanceof MethodNotFoundError ||
    error instanceof InvalidParamsError ||
    error.name === 'ValidationError' ||
    (typeof error.message === 'string' && (
      error.message.toLowerCase().includes('validation') ||
      error.message.toLowerCase().includes('required') ||
      error.message.toLowerCase().includes('invalid') ||
      error.message.toLowerCase().includes('unknown tool') ||
      error.message.toLowerCase().includes('method not found')
    ))
  );
}

/**
 * Type guard to check if error should be retried
 */
export function isRetryableError(error: Error): boolean {
  // Check if error has explicit retryable property
  if ('retryable' in error) {
    const retryableValue = (error as any).retryable;
    if (typeof retryableValue === 'boolean') {
      return retryableValue;
    }
  }
  
  if (error instanceof FulfillmentError) {
    return error.retryable;
  }
  
  return (
    error instanceof ConnectionError ||
    (typeof error.message === 'string' && (
      error.message.toLowerCase().includes('timeout') ||
      error.message.toLowerCase().includes('unavailable') ||
      error.message.toLowerCase().includes('rate limit')
    ))
  );
}

/**
 * Map internal error to MCP protocol error
 */
export function mapToMcpError(error: Error): McpError {
  // Handle FulfillmentError with toJSONRPCError method
  if (error instanceof FulfillmentError && typeof error.toJSONRPCError === 'function') {
    return error.toJSONRPCError();
  }

  // Handle ValidationError specifically
  if (error instanceof ValidationError) {
    return new McpError(
      ErrorCode.InvalidParams,
      error.message,
      {
        field: error.field,
        value: error.value,
        retryable: false
      }
    );
  }

  // Handle AdapterError
  if (error instanceof AdapterError) {
    return new McpError(
      ErrorCode.InternalError,
      `Adapter Error: ${error.message}`,
      {
        code: error.code,
        details: error.details,
        retryable: true
      }
    );
  }

  // Handle tool-specific errors
  if (error instanceof ToolNotFoundError) {
    return new McpError(
      ErrorCode.MethodNotFound,
      error.message,
      error.data
    );
  }

  if (error instanceof MethodNotFoundError) {
    return new McpError(
      ErrorCode.MethodNotFound,
      error.message,
      error.data
    );
  }

  // Handle configuration errors
  if (error instanceof ConfigurationError) {
    return new McpError(
      ErrorCode.InternalError,
      error.message,
      {
        code: error.code,
        details: error.details,
        retryable: false
      }
    );
  }

  // Handle connection errors (retryable)
  if (error instanceof ConnectionError) {
    return new McpError(
      ErrorCode.InternalError,
      error.message,
      {
        code: error.code,
        details: error.details,
        retryable: true
      }
    );
  }

  // Handle existing MCP errors
  if (error instanceof McpError) {
    return error;
  }

  // Handle MCP-specific errors from errors/index.ts
  if (error instanceof FulfillmentAdapterError || error instanceof FulfillmentValidationError) {
    return error as McpError;
  }

  // Default case: treat as internal error
  return new McpError(
    ErrorCode.InternalError,
    error.message || 'Unknown error occurred',
    {
      originalError: error.name,
      retryable: isRetryableError(error)
    }
  );
}

/**
 * Create MCP tool response for errors
 */
export function createErrorResponse(error: Error) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  
  return {
    content: [
      {
        type: 'text' as const,
        text: errorMessage
      }
    ],
    isError: true
  };
}

/**
 * Create MCP tool response for successful results
 */
export function createSuccessResponse(result: any) {
  // Check if result is already in MCP content format
  if (result && typeof result === 'object' && 'content' in result && Array.isArray(result.content)) {
    return result;
  }
  
  // Auto-wrap the result in MCP content format
  return {
    content: [
      {
        type: 'text' as const,
        text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
      }
    ]
  };
}

/**
 * Error adapter class for centralized error handling
 */
export class ErrorAdapter {
  /**
   * Process an error and determine how to handle it
   */
  static processError(error: Error) {
    if (isProtocolError(error)) {
      // Protocol errors should be thrown to let MCP SDK handle them
      return {
        shouldThrow: true,
        mcpError: mapToMcpError(error)
      };
    } else {
      // Tool execution errors should be returned as error responses
      return {
        shouldThrow: false,
        toolResponse: createErrorResponse(error)
      };
    }
  }

  /**
   * Convert any error to appropriate MCP format
   */
  static toMcpFormat(error: Error) {
    const processed = this.processError(error);
    
    if (processed.shouldThrow && processed.mcpError) {
      return processed.mcpError;
    }
    
    if (processed.toolResponse) {
      return processed.toolResponse;
    }
    
    // Fallback
    return createErrorResponse(error);
  }
}
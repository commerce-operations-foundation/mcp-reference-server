/**
 * MCP Protocol type definitions
 * Re-exporting from MCP SDK to ensure consistency
 */

// Import SDK types
import type {
  JSONRPCRequest,
  JSONRPCResponse,
  JSONRPCError,
  InitializeRequest,
  ListToolsRequest,
  CallToolRequest,
  InitializeResult,
  ListToolsResult,
  CallToolResult,
  Tool,
  McpError,
  ErrorCode
} from '@modelcontextprotocol/sdk/types.js';

// Re-export for backward compatibility
export type {
  JSONRPCRequest,
  JSONRPCResponse,
  JSONRPCError,
  InitializeRequest,
  ListToolsRequest,
  CallToolRequest,
  InitializeResult,
  ListToolsResult,
  CallToolResult,
  Tool as ToolDescription,
  McpError,
  ErrorCode
};

// Re-export schema as JSONSchema for backward compatibility
export type JSONSchema = {
  type?: string;
  properties?: Record<string, any>;
  required?: string[];
  items?: any;
  additionalProperties?: boolean;
  [key: string]: any;
};

// Legacy type aliases for backward compatibility
export type ToolsListRequest = ListToolsRequest;
export type ToolCallRequest = CallToolRequest;
export type InitializeResponse = InitializeResult;
export type ToolsListResponse = ListToolsResult;
export type ToolCallResponse = CallToolResult;

// Custom tool execution interfaces (internal implementation)
export interface ToolExecutor {
  name: string;
  description: string;
  execute(params: any): Promise<ToolResult>;
  getMetadata(): ToolMetadata;
}

export interface ToolMetadata {
  name: string;
  description: string;
  inputSchema?: JSONSchema;
}

// Use SDK's CallToolResult structure
export interface ToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: any;
    mimeType?: string;
  }>;
  isError?: boolean;
}
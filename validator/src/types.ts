/**
 * Types for the onX MCP Validator
 */

export interface ToolDefinition {
  name: string;
  description?: string;
  inputSchema: JSONSchema;
}

export interface JSONSchema {
  type?: string;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  items?: JSONSchema;
  additionalProperties?: boolean | JSONSchema;
  description?: string;
  default?: unknown;
  enum?: unknown[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
  oneOf?: JSONSchema[];
  anyOf?: JSONSchema[];
  allOf?: JSONSchema[];
  $ref?: string;
}

export interface ValidationResult {
  passed: boolean;
  tool: string;
  check: string;
  message: string;
  details?: unknown;
}

export interface ToolValidationResult {
  tool: string;
  exists: boolean;
  schemaValid: boolean;
  functionalValid: boolean;
  errors: ValidationResult[];
  warnings: ValidationResult[];
}

export interface ComplianceReport {
  serverInfo: {
    name: string;
    version: string;
    protocolVersion: string;
  };
  timestamp: string;
  transport: 'stdio' | 'http';
  summary: {
    totalTools: number;
    implementedTools: number;
    missingTools: string[];
    passedChecks: number;
    failedChecks: number;
    warnings: number;
  };
  tools: ToolValidationResult[];
  compliance: 'full' | 'partial' | 'non-compliant';
  score: number; // 0-100
}

// ONX_TOOLS is now exported from @onx/schemas package
// Import from './schemas/index.js' instead

/**
 * Transport configuration
 */
export interface StdioTransportConfig {
  type: 'stdio';
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface HttpTransportConfig {
  type: 'http';
  url: string;
  headers?: Record<string, string>;
}

export type TransportConfig = StdioTransportConfig | HttpTransportConfig;

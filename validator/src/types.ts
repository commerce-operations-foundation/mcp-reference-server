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
    // Server tools
    totalTools: number;              // Total tools on server (onX + other)
    otherTools: number;              // Non-onX tools on server (FYI)

    // onX compliance
    onXTools: number;                // Total onX standard tools
    onXToolsImplemented: number;     // onX tools present on server
    missingTools: number;            // onX tools not present (count)

    // Validation results
    passedChecks: number;
    failedChecks: number;
    warnings: number;
  };
  tools: ToolValidationResult[];
  compliance: 'full' | 'partial' | 'non-compliant';
  score: number; // 0-100
}

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

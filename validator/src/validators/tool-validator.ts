/**
 * Tool Validator
 * Validates that tools exist and schemas match canonical onX specifications
 */

import {
  ToolDefinition,
  ValidationResult,
  ToolValidationResult,
  JSONSchema,
} from '../types.js';
import { getCanonicalSchema, ONX_TOOLS } from '../schemas/index.js';
import { compareSchemas } from '../schemas/comparator.js';

export class ToolValidator {
  private canonicalSchemas: Map<string, JSONSchema> = new Map();

  constructor() {
    // Pre-load canonical schemas for required tools
    for (const toolName of ONX_TOOLS) {
      const schema = getCanonicalSchema(toolName);
      if (schema) {
        this.canonicalSchemas.set(toolName, schema);
      }
    }
  }

  /**
   * Validate all required tools are present
   */
  validateToolPresence(tools: ToolDefinition[]): ValidationResult[] {
    const results: ValidationResult[] = [];
    const toolNames = new Set(tools.map(t => t.name));

    for (const required of ONX_TOOLS) {
      const exists = toolNames.has(required);
      results.push({
        passed: exists,
        tool: required,
        check: 'tool-exists',
        message: exists
          ? `Tool "${required}" is implemented`
          : `Missing required tool: "${required}"`,
      });
    }

    return results;
  }

  /**
   * Validate a single tool's schema against the canonical schema
   */
  validateToolSchema(tool: ToolDefinition): ValidationResult[] {
    const results: ValidationResult[] = [];
    const canonicalSchema = this.canonicalSchemas.get(tool.name);

    // If no canonical schema exists for this tool, it's either:
    // 1. Not a required tool (extra tool) - that's fine
    // 2. A required tool without a schema file - warn but don't fail
    if (!canonicalSchema) {
      if (ONX_TOOLS.includes(tool.name as any)) {
        results.push({
          passed: true, // Don't fail, just warn
          tool: tool.name,
          check: 'schema-no-canonical',
          message: `No canonical schema found for "${tool.name}" - skipping deep validation`,
        });
      } else {
        results.push({
          passed: true,
          tool: tool.name,
          check: 'schema-extra-tool',
          message: `Tool "${tool.name}" is not part of onX spec (additional tool)`,
        });
      }
      return results;
    }

    // Check that inputSchema exists
    if (!tool.inputSchema || typeof tool.inputSchema !== 'object') {
      results.push({
        passed: false,
        tool: tool.name,
        check: 'schema-exists',
        message: `Tool "${tool.name}" is missing inputSchema`,
      });
      return results;
    }

    // Ensure tool has a description
    if (!tool.description || tool.description.trim().length === 0) {
      results.push({
        passed: false,
        tool: tool.name,
        check: 'schema-description',
        message: `Tool "${tool.name}" is missing a description`,
      });
    } else {
      results.push({
        passed: true,
        tool: tool.name,
        check: 'schema-description',
        message: `Tool "${tool.name}" has description`,
      });
    }

    // Deep compare endpoint schema against canonical schema
    const comparisonResults = compareSchemas(tool.name, tool.inputSchema, canonicalSchema);
    results.push(...comparisonResults);

    // If no comparison issues, add a passing result
    if (comparisonResults.filter(r => !r.passed).length === 0) {
      results.push({
        passed: true,
        tool: tool.name,
        check: 'schema-matches-canonical',
        message: `Schema matches canonical onX specification`,
      });
    }

    return results;
  }

  /**
   * Validate all tools and produce tool-by-tool results
   */
  validateAll(tools: ToolDefinition[]): ToolValidationResult[] {
    const results: ToolValidationResult[] = [];
    const toolMap = new Map(tools.map(t => [t.name, t]));

    for (const requiredName of ONX_TOOLS) {
      const tool = toolMap.get(requiredName);

      if (!tool) {
        results.push({
          tool: requiredName,
          exists: false,
          schemaValid: false,
          functionalValid: false,
          errors: [{
            passed: false,
            tool: requiredName,
            check: 'tool-exists',
            message: `Missing required tool: "${requiredName}"`,
          }],
          warnings: [],
        });
        continue;
      }

      const schemaResults = this.validateToolSchema(tool);
      const errors = schemaResults.filter(r => !r.passed);
      const warnings = schemaResults.filter(r => r.passed && r.check === 'schema-no-canonical');

      results.push({
        tool: requiredName,
        exists: true,
        schemaValid: errors.length === 0,
        functionalValid: false, // Will be updated by functional tests
        errors,
        warnings,
      });
    }

    // Check for extra tools (not an error, just informational)
    for (const tool of tools) {
      if (!ONX_TOOLS.includes(tool.name as any)) {
        const existing = results.find(r => r.tool === tool.name);
        if (!existing) {
          results.push({
            tool: tool.name,
            exists: true,
            schemaValid: true,
            functionalValid: true,
            errors: [],
            warnings: [{
              passed: true,
              tool: tool.name,
              check: 'extra-tool',
              message: `Additional tool "${tool.name}" found (not part of onX spec)`,
            }],
          });
        }
      }
    }

    return results;
  }
}

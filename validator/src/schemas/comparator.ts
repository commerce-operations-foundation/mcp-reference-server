/**
 * Schema Comparator
 * Deep comparison of endpoint schemas against canonical onX schemas
 */

import { JSONSchema, ValidationResult } from '../types.js';

/**
 * Compare an endpoint's schema against the canonical schema
 * Returns validation results for all differences found
 */
export function compareSchemas(
  toolName: string,
  endpointSchema: JSONSchema,
  canonicalSchema: JSONSchema,
  path = ''
): ValidationResult[] {
  const results: ValidationResult[] = [];
  const currentPath = path || 'root';

  // Compare type
  if (canonicalSchema.type && endpointSchema.type !== canonicalSchema.type) {
    results.push({
      passed: false,
      tool: toolName,
      check: 'schema-type-mismatch',
      message: `Type mismatch at ${currentPath}: expected "${canonicalSchema.type}", got "${endpointSchema.type}"`,
      details: { path: currentPath, expected: canonicalSchema.type, actual: endpointSchema.type },
    });
  }

  // Compare required fields
  const canonicalRequired = new Set(canonicalSchema.required || []);
  const endpointRequired = new Set(endpointSchema.required || []);

  for (const field of canonicalRequired) {
    if (!endpointRequired.has(field)) {
      results.push({
        passed: false,
        tool: toolName,
        check: 'schema-missing-required',
        message: `Missing required field "${field}" at ${currentPath}`,
        details: { path: currentPath, field },
      });
    }
  }

  // Compare properties
  if (canonicalSchema.properties) {
    const endpointProps = endpointSchema.properties || {};

    for (const [propName, canonicalProp] of Object.entries(canonicalSchema.properties)) {
      const propPath = path ? `${path}.${propName}` : propName;
      const endpointProp = endpointProps[propName];

      if (!endpointProp) {
        results.push({
          passed: false,
          tool: toolName,
          check: 'schema-missing-property',
          message: `Missing property "${propName}" at ${currentPath}`,
          details: { path: propPath },
        });
        continue;
      }

      // Recursively compare nested schemas
      const nestedResults = compareSchemas(toolName, endpointProp, canonicalProp, propPath);
      results.push(...nestedResults);

      // Compare constraints
      const constraintResults = compareConstraints(toolName, endpointProp, canonicalProp, propPath);
      results.push(...constraintResults);
    }
  }

  // Compare array items
  if (canonicalSchema.items && canonicalSchema.type === 'array') {
    const itemPath = `${currentPath}[]`;

    if (!endpointSchema.items) {
      results.push({
        passed: false,
        tool: toolName,
        check: 'schema-missing-items',
        message: `Missing items schema at ${currentPath}`,
        details: { path: itemPath },
      });
    } else {
      const itemResults = compareSchemas(
        toolName,
        endpointSchema.items as JSONSchema,
        canonicalSchema.items as JSONSchema,
        itemPath
      );
      results.push(...itemResults);
    }
  }

  return results;
}

/**
 * Compare constraint values (minimum, maximum, minLength, maxLength, pattern, format)
 */
function compareConstraints(
  toolName: string,
  endpointSchema: JSONSchema,
  canonicalSchema: JSONSchema,
  path: string
): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Numeric constraints
  if (canonicalSchema.minimum !== undefined) {
    if (endpointSchema.minimum === undefined) {
      results.push({
        passed: false,
        tool: toolName,
        check: 'schema-missing-minimum',
        message: `Missing "minimum: ${canonicalSchema.minimum}" constraint at ${path}`,
        details: { path, constraint: 'minimum', expected: canonicalSchema.minimum },
      });
    } else if (endpointSchema.minimum !== canonicalSchema.minimum) {
      results.push({
        passed: false,
        tool: toolName,
        check: 'schema-minimum-mismatch',
        message: `Minimum mismatch at ${path}: expected ${canonicalSchema.minimum}, got ${endpointSchema.minimum}`,
        details: { path, expected: canonicalSchema.minimum, actual: endpointSchema.minimum },
      });
    }
  }

  if (canonicalSchema.maximum !== undefined) {
    if (endpointSchema.maximum === undefined) {
      results.push({
        passed: false,
        tool: toolName,
        check: 'schema-missing-maximum',
        message: `Missing "maximum: ${canonicalSchema.maximum}" constraint at ${path}`,
        details: { path, constraint: 'maximum', expected: canonicalSchema.maximum },
      });
    } else if (endpointSchema.maximum !== canonicalSchema.maximum) {
      results.push({
        passed: false,
        tool: toolName,
        check: 'schema-maximum-mismatch',
        message: `Maximum mismatch at ${path}: expected ${canonicalSchema.maximum}, got ${endpointSchema.maximum}`,
        details: { path, expected: canonicalSchema.maximum, actual: endpointSchema.maximum },
      });
    }
  }

  // String constraints
  if (canonicalSchema.minLength !== undefined) {
    if (endpointSchema.minLength === undefined) {
      results.push({
        passed: false,
        tool: toolName,
        check: 'schema-missing-minLength',
        message: `Missing "minLength: ${canonicalSchema.minLength}" constraint at ${path}`,
        details: { path, constraint: 'minLength', expected: canonicalSchema.minLength },
      });
    } else if (endpointSchema.minLength !== canonicalSchema.minLength) {
      results.push({
        passed: false,
        tool: toolName,
        check: 'schema-minLength-mismatch',
        message: `minLength mismatch at ${path}: expected ${canonicalSchema.minLength}, got ${endpointSchema.minLength}`,
        details: { path, expected: canonicalSchema.minLength, actual: endpointSchema.minLength },
      });
    }
  }

  if (canonicalSchema.maxLength !== undefined) {
    if (endpointSchema.maxLength === undefined) {
      results.push({
        passed: false,
        tool: toolName,
        check: 'schema-missing-maxLength',
        message: `Missing "maxLength: ${canonicalSchema.maxLength}" constraint at ${path}`,
        details: { path, constraint: 'maxLength', expected: canonicalSchema.maxLength },
      });
    } else if (endpointSchema.maxLength !== canonicalSchema.maxLength) {
      results.push({
        passed: false,
        tool: toolName,
        check: 'schema-maxLength-mismatch',
        message: `maxLength mismatch at ${path}: expected ${canonicalSchema.maxLength}, got ${endpointSchema.maxLength}`,
        details: { path, expected: canonicalSchema.maxLength, actual: endpointSchema.maxLength },
      });
    }
  }

  // Pattern constraint
  if (canonicalSchema.pattern !== undefined) {
    if (endpointSchema.pattern === undefined) {
      results.push({
        passed: false,
        tool: toolName,
        check: 'schema-missing-pattern',
        message: `Missing "pattern" constraint at ${path}`,
        details: { path, constraint: 'pattern', expected: canonicalSchema.pattern },
      });
    } else if (endpointSchema.pattern !== canonicalSchema.pattern) {
      results.push({
        passed: false,
        tool: toolName,
        check: 'schema-pattern-mismatch',
        message: `Pattern mismatch at ${path}`,
        details: { path, expected: canonicalSchema.pattern, actual: endpointSchema.pattern },
      });
    }
  }

  // Format constraint
  if (canonicalSchema.format !== undefined) {
    if (endpointSchema.format === undefined) {
      results.push({
        passed: false,
        tool: toolName,
        check: 'schema-missing-format',
        message: `Missing "format: ${canonicalSchema.format}" constraint at ${path}`,
        details: { path, constraint: 'format', expected: canonicalSchema.format },
      });
    } else if (endpointSchema.format !== canonicalSchema.format) {
      results.push({
        passed: false,
        tool: toolName,
        check: 'schema-format-mismatch',
        message: `Format mismatch at ${path}: expected "${canonicalSchema.format}", got "${endpointSchema.format}"`,
        details: { path, expected: canonicalSchema.format, actual: endpointSchema.format },
      });
    }
  }

  // Enum constraint
  if (canonicalSchema.enum !== undefined) {
    if (endpointSchema.enum === undefined) {
      results.push({
        passed: false,
        tool: toolName,
        check: 'schema-missing-enum',
        message: `Missing "enum" constraint at ${path}`,
        details: { path, expected: canonicalSchema.enum },
      });
    } else {
      const canonicalSet = new Set(canonicalSchema.enum.map(v => JSON.stringify(v)));
      const endpointSet = new Set(endpointSchema.enum.map(v => JSON.stringify(v)));

      const missing = [...canonicalSet].filter(v => !endpointSet.has(v));
      if (missing.length > 0) {
        results.push({
          passed: false,
          tool: toolName,
          check: 'schema-enum-mismatch',
          message: `Enum mismatch at ${path}: missing values`,
          details: { path, missing: missing.map(v => JSON.parse(v)) },
        });
      }
    }
  }

  return results;
}

/**
 * Generate a summary of schema comparison
 */
export function summarizeComparison(results: ValidationResult[]): {
  passed: number;
  failed: number;
  byCheck: Record<string, number>;
} {
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  const byCheck: Record<string, number> = {};
  for (const result of results.filter(r => !r.passed)) {
    byCheck[result.check] = (byCheck[result.check] || 0) + 1;
  }

  return { passed, failed, byCheck };
}

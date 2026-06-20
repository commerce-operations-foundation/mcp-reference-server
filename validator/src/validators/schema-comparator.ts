/**
 * Schema Comparator
 * Deep comparison of endpoint schemas against canonical onX schemas
 */

import { JSONSchema, ValidationResult } from '../types.js';

// Compare an endpoint's schema against the canonical schema
// Returns validation results for all differences found
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

  // Server missing required field (too lenient)
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

  // Server has extra required field (too strict)
  for (const field of endpointRequired) {
    if (!canonicalRequired.has(field)) {
      results.push({
        passed: false,
        tool: toolName,
        check: 'schema-extra-required',
        message: `Extra required field "${field}" at ${currentPath} (server is stricter than spec)`,
        details: { path: currentPath, field },
      });
    }
  }

  // Compare properties
  if (canonicalSchema.properties) {
    const endpointProps = endpointSchema.properties || {};
    const canonicalProps = canonicalSchema.properties;

    for (const [propName, canonicalProp] of Object.entries(canonicalProps)) {
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

    // Check for extra properties when canonical forbids them
    if (canonicalSchema.additionalProperties === false) {
      for (const propName of Object.keys(endpointProps)) {
        if (!(propName in canonicalProps)) {
          const propPath = path ? `${path}.${propName}` : propName;
          results.push({
            passed: false,
            tool: toolName,
            check: 'schema-extra-property',
            message: `Extra property "${propName}" at ${currentPath} (not allowed by spec)`,
            details: { path: propPath },
          });
        }
      }
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

type ConstraintKey = 'minimum' | 'maximum' | 'minLength' | 'maxLength' | 'pattern' | 'format';

const SIMPLE_CONSTRAINTS: ConstraintKey[] = ['minimum', 'maximum', 'minLength', 'maxLength', 'pattern', 'format'];

function compareConstraints(
  toolName: string,
  endpointSchema: JSONSchema,
  canonicalSchema: JSONSchema,
  path: string
): ValidationResult[] {
  const results: ValidationResult[] = [];

  for (const constraint of SIMPLE_CONSTRAINTS) {
    const expected = canonicalSchema[constraint];
    if (expected === undefined) continue;

    const actual = endpointSchema[constraint];
    if (actual === undefined) {
      results.push({
        passed: false,
        tool: toolName,
        check: `schema-missing-${constraint}`,
        message: `Missing "${constraint}: ${expected}" constraint at ${path}`,
        details: { path, constraint, expected },
      });
    } else if (actual !== expected) {
      results.push({
        passed: false,
        tool: toolName,
        check: `schema-${constraint}-mismatch`,
        message: `${constraint} mismatch at ${path}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
        details: { path, expected, actual },
      });
    }
  }

  // Enum requires special handling for set comparison
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

/**
 * Schema Loader
 * Re-exports canonical onX tool schemas from the shared schemas directory
 */

import { JSONSchema } from '../types.js';

// Import from the canonical schemas package
import {
  ONX_TOOLS,
  toolInputSchemas,
  getToolInputSchema,
} from '@onx/schemas';

// Re-export
export { ONX_TOOLS };

/**
 * Load all canonical tool schemas
 */
export function loadCanonicalSchemas(): Map<string, JSONSchema> {
  return toolInputSchemas as Map<string, JSONSchema>;
}

/**
 * Get a specific tool's canonical schema
 */
export function getCanonicalSchema(toolName: string): JSONSchema | null {
  return getToolInputSchema(toolName) as JSONSchema | null;
}

/**
 * List all available canonical tool names
 */
export function listCanonicalTools(): string[] {
  return [...ONX_TOOLS];
}

/**
 * Clear the schema cache (no-op, schemas are loaded once in the source module)
 */
export function clearSchemaCache(): void {
  // No-op: schemas are managed by the source module
}

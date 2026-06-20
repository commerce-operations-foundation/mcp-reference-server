/**
 * onX Schema Package
 * Canonical definitions for the Order Network eXchange specification
 */

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/**
 * Tools required for onX spec compliance
 */
export const ONX_TOOLS = [
  // Order operations
  'create-sales-order',
  'update-order',
  'cancel-order',
  'fulfill-order',
  'create-return',

  // Query operations
  'get-orders',
  'get-customers',
  'get-products',
  'get-product-variants',
  'get-inventory',
  'get-fulfillments',
  'get-returns',
];

/**
 * Load schemas for all tools
 */
function loadSchemas() {
  const schemas = new Map();

  for (const toolName of ONX_TOOLS) {
    try {
      const schema = require(`./tool-inputs/${toolName}.json`);
      schemas.set(toolName, schema);
    } catch {
      console.warn(`Warning: Schema file missing for ${toolName}`);
    }
  }

  return schemas;
}

// Export schemas as a Map (loaded once at module initialization)
export const toolInputSchemas = loadSchemas();

// Export getter for individual schema
export function getToolInputSchema(toolName) {
  return toolInputSchemas.get(toolName) || null;
}

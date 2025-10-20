import { z } from 'zod';

import type { JSONSchema } from '../../types/mcp.js';

/**
 * Convert a Zod schema to a JSON Schema Draft-07 representation that AJV can consume.
 */
export function toJsonSchema(schema: z.ZodType): JSONSchema {
  return z.toJSONSchema(schema, {
    target: 'draft-7',
    reused: 'inline',
    cycles: 'ref',
    unrepresentable: 'throw',
  }) as JSONSchema;
}

export function makeZodFieldMap<T extends readonly string[]>(fields: T): Record<T[number], true> {
  return fields.reduce(
    (acc, field) => {
      acc[field as T[number]] = true;
      return acc;
    },
    {} as Record<T[number], true>
  );
}

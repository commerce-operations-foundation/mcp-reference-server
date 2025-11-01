/**
 * Validation service using AJV
 */

import Ajv, { ValidateFunction } from 'ajv';
import { ValidationError } from '../utils/errors.js';
import { JSONSchema } from '../types/index.js';
import { getErrorMessage } from '../utils/type-guards.js';

export class Validator {
  private ajv: Ajv;
  private schemaCache = new Map<string, ValidateFunction>();

  constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false,
      validateFormats: true,
    });
  }

  /**
   * Validate data against a schema
   */
  async validate<T = any>(data: unknown, schema: JSONSchema): Promise<T> {
    const schemaKey = JSON.stringify(schema);
    let validator = this.schemaCache.get(schemaKey);

    // Compile schema if not cached
    if (!validator) {
      try {
        validator = this.ajv.compile(schema);
        this.schemaCache.set(schemaKey, validator);
      } catch (error: unknown) {
        throw new Error(`Invalid schema: ${getErrorMessage(error)}`);
      }
    }

    // Validate data
    const valid = validator(data);

    if (!valid) {
      const errors = validator.errors || [];
      const firstError = errors[0];

      throw new ValidationError(
        firstError?.instancePath?.replace('/', '') || 'data',
        firstError?.message || 'Validation failed',
        data
      );
    }

    return data as T;
  }

  /**
   * Get validation errors in a formatted way
   */
  getErrors(validator: ValidateFunction): Array<{
    field: string;
    message: string;
    value?: any;
  }> {
    if (!validator.errors) {
      return [];
    }

    return validator.errors.map((error) => ({
      field: error.instancePath.replace('/', '').replace(/\//g, '.'),
      message: error.message || 'Validation failed',
      value: error.data,
    }));
  }

  /**
   * Clear the schema cache (useful for testing or memory management)
   */
  clearCache(): void {
    this.schemaCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.schemaCache.size,
      keys: Array.from(this.schemaCache.keys()).map((key) => (key.length > 100 ? `${key.substring(0, 100)}...` : key)),
    };
  }
}

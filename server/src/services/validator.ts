/**
 * Validation service using AJV
 */

import Ajv, { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import { ValidationError } from '../utils/errors.js';
import { JSONSchema } from '../types/index.js';
import { getErrorMessage } from '../utils/type-guards.js';

export class Validator {
  private ajv: Ajv;
  private schemaCache = new Map<string, ValidateFunction>();
  
  constructor() {
    // Initialize AJV with options
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false,
      validateFormats: true
    });
    
    // Add format validators (email, date-time, etc.)
    addFormats(this.ajv);
    
    // Add custom formats
    this.addCustomFormats();
  }
  
  private addCustomFormats(): void {
    // Add phone number format
    this.ajv.addFormat('phone', {
      type: 'string',
      validate: (value: string) => {
        const phoneRegex = /^[+]?[0-9]{1,3}[-\s.]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
        return phoneRegex.test(value);
      }
    });
    
    // Add currency format (ISO 4217)
    this.ajv.addFormat('currency', {
      type: 'string',
      validate: (value: string) => {
        return /^[A-Z]{3}$/.test(value);
      }
    });
    
    // Add SKU format
    this.ajv.addFormat('sku', {
      type: 'string',
      validate: (value: string) => {
        return /^[A-Z0-9\-_]+$/i.test(value);
      }
    });
  }
  
  
  /**
   * Validate data against a schema
   */
  async validate<T = any>(data: unknown, schema: JSONSchema): Promise<T> {
    // Create cache key from schema
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
   * Validate partial data (for updates)
   */
  async validatePartial<T = any>(
    data: unknown,
    schema: JSONSchema
  ): Promise<T> {
    // Create a partial schema (all fields optional)
    const partialSchema: JSONSchema = {
      ...schema,
      required: [] // Remove required fields for partial validation
    };
    
    return this.validate(data, partialSchema);
  }
  
  
  /**
   * Get validation errors in a formatted way
   */
  getErrors(validator: ValidateFunction): Array<{
    field: string;
    message: string;
    value?: any;
  }> {
    if (!validator.errors) {return [];}
    
    return validator.errors.map(error => ({
      field: error.instancePath.replace('/', '').replace(/\//g, '.'),
      message: error.message || 'Validation failed',
      value: error.data
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
      keys: Array.from(this.schemaCache.keys()).map(key => 
        key.length > 100 ? `${key.substring(0, 100)}...` : key
      )
    };
  }
}
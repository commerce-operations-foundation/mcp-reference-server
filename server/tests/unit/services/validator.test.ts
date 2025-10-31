/**
 * Unit tests for Validator service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Validator } from '../../../src/services/validator';
import { ValidationError } from '../../../src/utils/errors';

describe('Validator', () => {
  let validator: Validator;

  beforeEach(() => {
    validator = new Validator();
  });

  describe('Data Validation', () => {
    it('should validate correct data', async () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
          email: { type: 'string', format: 'email' },
        },
        required: ['name'],
      };

      const validData = {
        name: 'John Doe',
        age: 30,
        email: 'john@example.com',
      };

      const result = await validator.validate(validData, schema);
      expect(result).toEqual(validData);
    });

    it('should throw ValidationError for invalid data', async () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name'],
      };

      const invalidData = {
        age: 30, // missing required 'name'
      };

      await expect(validator.validate(invalidData, schema)).rejects.toThrow(ValidationError);
    });

    it('should throw error for invalid schema', async () => {
      const invalidSchema = {
        type: 'invalid',
      } as any;

      const data = { test: 'value' };

      await expect(validator.validate(data, invalidSchema)).rejects.toThrow('Invalid schema:');
    });
  });

  describe('Error Handling', () => {
    it('should provide helpful error messages', async () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
        required: ['name'],
      };

      try {
        await validator.validate({}, schema);
      } catch (error: any) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.message).toContain('name');
      }
    });

    it('should handle invalid schema types', async () => {
      // Test with non-object, non-boolean schema
      await expect(validator.validate({}, 'invalid-schema' as any)).rejects.toThrow('Invalid schema:');
    });
  });
});

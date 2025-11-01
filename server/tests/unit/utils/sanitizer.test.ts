import { Sanitizer } from '../../../src/utils/sanitizer';
import { describe, it, expect } from 'vitest';

describe('Sanitizer', () => {
  describe('sanitizeForLogging', () => {
    it('should redact sensitive fields', () => {
      const data = {
        username: 'john',
        password: 'secret123',
        apiKey: 'api-key-123',
        token: 'bearer-token',
        secret: 'top-secret',
        creditCard: '1234-5678-9012-3456',
        ssn: '123-45-6789',
        taxId: 'TAX123',
        cvv: '123',
        normalField: 'normal-value',
      };

      const sanitized = Sanitizer.sanitizeForLogging(data);

      expect(sanitized.username).toBe('john');
      expect(sanitized.normalField).toBe('normal-value');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.apiKey).toBe('[REDACTED]');
      expect(sanitized.token).toBe('[REDACTED]');
      expect(sanitized.secret).toBe('[REDACTED]');
      expect(sanitized.creditCard).toBe('[REDACTED]');
      expect(sanitized.ssn).toBe('[REDACTED]');
      expect(sanitized.taxId).toBe('[REDACTED]');
      expect(sanitized.cvv).toBe('[REDACTED]');
    });

    it('should handle nested objects', () => {
      const data = {
        user: {
          name: 'john',
          credentials: {
            password: 'secret123',
            apiKey: 'api-key-123',
          },
        },
        config: {
          dbPassword: 'db-secret',
          normalSetting: 'value',
        },
      };

      const sanitized = Sanitizer.sanitizeForLogging(data);

      expect(sanitized.user.name).toBe('john');
      expect(sanitized.user.credentials.password).toBe('[REDACTED]');
      expect(sanitized.user.credentials.apiKey).toBe('[REDACTED]');
      expect(sanitized.config.dbPassword).toBe('[REDACTED]');
      expect(sanitized.config.normalSetting).toBe('value');
    });

    it('should handle arrays', () => {
      const data = [
        { name: 'user1', password: 'secret1' },
        { name: 'user2', token: 'token2' },
      ];

      const sanitized = Sanitizer.sanitizeForLogging(data);

      expect(sanitized[0].name).toBe('user1');
      expect(sanitized[0].password).toBe('[REDACTED]');
      expect(sanitized[1].name).toBe('user2');
      expect(sanitized[1].token).toBe('[REDACTED]');
    });

    it('should handle non-object values', () => {
      expect(Sanitizer.sanitizeForLogging('string')).toBe('string');
      expect(Sanitizer.sanitizeForLogging(123)).toBe(123);
      expect(Sanitizer.sanitizeForLogging(null)).toBe(null);
      expect(Sanitizer.sanitizeForLogging(undefined)).toBe(undefined);
      expect(Sanitizer.sanitizeForLogging(true)).toBe(true);
    });

    it('should be case insensitive for sensitive field detection', () => {
      const data = {
        PASSWORD: 'secret',
        ApiKey: 'key',
        TOKEN: 'token',
        CreditCard: '1234-5678-9012-3456',
      };

      const sanitized = Sanitizer.sanitizeForLogging(data);

      expect(sanitized.PASSWORD).toBe('[REDACTED]');
      expect(sanitized.ApiKey).toBe('[REDACTED]');
      expect(sanitized.TOKEN).toBe('[REDACTED]');
      expect(sanitized.CreditCard).toBe('[REDACTED]');
    });
  });

  describe('email', () => {
    it('should validate and sanitize valid emails', () => {
      expect(Sanitizer.email('test@example.com')).toBe('test@example.com');
      expect(Sanitizer.email('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
      expect(Sanitizer.email('user.name+tag@domain.co.uk')).toBe('user.name+tag@domain.co.uk');
    });

    it('should return null for invalid emails', () => {
      expect(Sanitizer.email('invalid-email')).toBeNull();
      expect(Sanitizer.email('missing@')).toBeNull();
      expect(Sanitizer.email('@missing-local.com')).toBeNull();
      expect(Sanitizer.email('spaces in@email.com')).toBeNull();
      expect(Sanitizer.email('')).toBeNull();
      expect(Sanitizer.email('   ')).toBeNull();
    });

    it('should handle edge cases', () => {
      expect(Sanitizer.email('a@b.co')).toBe('a@b.co');
      expect(Sanitizer.email('test@localhost')).toBeNull(); // No TLD
      expect(Sanitizer.email('test..test@example.com')).toBeNull(); // Double dots
    });
  });

  describe('phone', () => {
    it('should sanitize phone numbers by removing invalid characters', () => {
      expect(Sanitizer.phone('+1-234-567-8900')).toBe('+12345678900');
      expect(Sanitizer.phone('(555) 123-4567')).toBe('5551234567');
      expect(Sanitizer.phone('555.123.4567')).toBe('5551234567'); // Dots removed
      expect(Sanitizer.phone('abc123def456ghi7890')).toBe('1234567890');
      expect(Sanitizer.phone('555-123-4567 ext 123')).toBe('5551234567123');
    });

    it('should handle empty and special cases', () => {
      expect(Sanitizer.phone('')).toBeNull();
      expect(Sanitizer.phone('abcdefg')).toBeNull();
      expect(Sanitizer.phone('!@#$%^&*')).toBeNull();
      expect(Sanitizer.phone('123')).toBeNull(); // Too short
    });
  });

  describe('truncate', () => {
    it('should truncate strings longer than max length', () => {
      expect(Sanitizer.truncate('Hello, World!', 10)).toBe('Hello, ...');
      expect(Sanitizer.truncate('This is a very long string', 15)).toBe('This is a ve...');
    });

    it('should not truncate strings within max length', () => {
      expect(Sanitizer.truncate('Short', 10)).toBe('Short');
      expect(Sanitizer.truncate('Exactly 10', 10)).toBe('Exactly 10');
    });

    it('should handle edge cases', () => {
      expect(Sanitizer.truncate('', 5)).toBe('');
      expect(Sanitizer.truncate('abc', 3)).toBe('abc');
      expect(Sanitizer.truncate('abcd', 3)).toBe('...');
      expect(Sanitizer.truncate('ab', 0)).toBe('...');
    });
  });

  describe('removeEmpty', () => {
    it('should remove null and undefined values from objects', () => {
      const obj = {
        valid: 'value',
        nullValue: null,
        undefinedValue: undefined,
        emptyString: '',
        zero: 0,
        falsy: false,
      };

      const cleaned = Sanitizer.removeEmpty(obj);

      expect(cleaned).toEqual({
        valid: 'value',
        emptyString: '',
        zero: 0,
        falsy: false,
      });
      expect(cleaned.nullValue).toBeUndefined();
      expect(cleaned.undefinedValue).toBeUndefined();
    });

    it('should handle nested objects', () => {
      const obj = {
        level1: {
          valid: 'value',
          nullValue: null,
          level2: {
            nested: 'nested-value',
            undefinedValue: undefined,
          },
        },
        anotherNull: null,
      };

      const cleaned = Sanitizer.removeEmpty(obj);

      expect(cleaned).toEqual({
        level1: {
          valid: 'value',
          level2: {
            nested: 'nested-value',
          },
        },
      });
    });

    it('should handle arrays', () => {
      const arr = ['value1', null, 'value2', undefined, '', 0];
      const cleaned = Sanitizer.removeEmpty(arr);

      expect(cleaned).toEqual(['value1', 'value2', '', 0]);
    });

    it('should handle arrays of objects', () => {
      const arr = [
        { valid: 'value1', nullValue: null },
        { valid: 'value2', undefinedValue: undefined },
        null,
        undefined,
      ];

      const cleaned = Sanitizer.removeEmpty(arr);

      expect(cleaned).toEqual([{ valid: 'value1' }, { valid: 'value2' }]);
    });

    it('should handle primitive values', () => {
      expect(Sanitizer.removeEmpty('string')).toBe('string');
      expect(Sanitizer.removeEmpty(123)).toBe(123);
      expect(Sanitizer.removeEmpty(true)).toBe(true);
      expect(Sanitizer.removeEmpty(false)).toBe(false);
      expect(Sanitizer.removeEmpty(0)).toBe(0);
      expect(Sanitizer.removeEmpty('')).toBe('');
    });

    it('should return null/undefined as-is', () => {
      expect(Sanitizer.removeEmpty(null)).toBe(null);
      expect(Sanitizer.removeEmpty(undefined)).toBe(undefined);
    });
  });
});

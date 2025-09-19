/**
 * Security Sanitizer Unit Tests
 */

import { LogSanitizer } from '../../../src/security/log-sanitizer';

describe('LogSanitizer', () => {
  describe('redactSensitive', () => {
    it('should redact password fields', () => {
      const obj = {
        username: 'john',
        password: 'secret123',
        email: 'john@example.com'
      };

      const result = LogSanitizer.redactSensitive(obj);

      expect(result).toEqual({
        username: 'john',
        password: '[REDACTED]',
        email: 'john@example.com'  // email is not a sensitive field by default
      });
    });

    it('should redact API keys and tokens', () => {
      const obj = {
        apiKey: 'key123',
        api_key: 'another_key',
        token: 'bearer_token',
        secret: 'top_secret'
      };

      const result = LogSanitizer.redactSensitive(obj);

      expect(result).toEqual({
        apiKey: '[REDACTED]',
        api_key: '[REDACTED]',
        token: '[REDACTED]',
        secret: '[REDACTED]'
      });
    });

    it('should redact credit card and sensitive personal info', () => {
      const obj = {
        creditCard: '4111-1111-1111-1111',
        credit_card: '4222-2222-2222-2222',
        ssn: '123-45-6789',
        social_security: '987-65-4321'
      };

      const result = LogSanitizer.redactSensitive(obj);

      expect(result).toEqual({
        creditCard: '[REDACTED]',
        credit_card: '[REDACTED]',
        ssn: '[REDACTED]',
        social_security: '[REDACTED]'
      });
    });

    it('should handle nested objects', () => {
      const obj = {
        user: {
          name: 'John',
          password: 'secret',
          preferences: {
            theme: 'dark',
            apiKey: 'nested_key'
          }
        },
        config: {
          database: {
            host: 'localhost',
            password: 'db_secret'
          }
        }
      };

      const result = LogSanitizer.redactSensitive(obj);

      expect(result).toEqual({
        user: {
          name: 'John',
          password: '[REDACTED]',
          preferences: {
            theme: 'dark',
            apiKey: '[REDACTED]'
          }
        },
        config: {
          database: {
            host: 'localhost',
            password: '[REDACTED]'
          }
        }
      });
    });

    it('should handle arrays', () => {
      const obj = {
        users: [
          { name: 'John', password: 'secret1' },
          { name: 'Jane', apiKey: 'key123' }
        ]
      };

      const result = LogSanitizer.redactSensitive(obj);

      expect(result).toEqual({
        users: [
          { name: 'John', password: '[REDACTED]' },
          { name: 'Jane', apiKey: '[REDACTED]' }
        ]
      });
    });

    it('should preserve non-sensitive fields', () => {
      const obj = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com', // This will NOT be redacted (email is not sensitive by default)
        username: 'testuser',
        role: 'admin',
        createdAt: '2025-01-17T18:00:00Z'
      };

      const result = LogSanitizer.redactSensitive(obj);

      expect(result).toEqual({
        id: '123',
        name: 'Test User',
        email: 'test@example.com',  // email is preserved
        username: 'testuser',
        role: 'admin',
        createdAt: '2025-01-17T18:00:00Z'
      });
    });

    it('should handle null and undefined values', () => {
      const obj = {
        normalField: 'value',
        nullField: null,
        undefinedField: undefined,
        password: 'secret'
      };

      const result = LogSanitizer.redactSensitive(obj);

      expect(result).toEqual({
        normalField: 'value',
        nullField: null,
        undefinedField: undefined,
        password: '[REDACTED]'
      });
    });

    it('should handle non-object inputs', () => {
      expect(LogSanitizer.redactSensitive('string')).toBe('string');
      expect(LogSanitizer.redactSensitive(123)).toBe(123);
      expect(LogSanitizer.redactSensitive(true)).toBe(true);
      expect(LogSanitizer.redactSensitive(null)).toBe(null);
      expect(LogSanitizer.redactSensitive(undefined)).toBe(undefined);
    });

    it('should handle arrays of primitives', () => {
      const arr = ['value1', 'value2', 'value3'];
      const result = LogSanitizer.redactSensitive(arr);
      expect(result).toEqual(['value1', 'value2', 'value3']);
    });

    it('should be case-insensitive for field matching', () => {
      const obj = {
        PASSWORD: 'secret1',
        ApiKey: 'key123',
        SECRET_VALUE: 'secret2'
      };

      const result = LogSanitizer.redactSensitive(obj);

      expect(result).toEqual({
        PASSWORD: '[REDACTED]',
        ApiKey: '[REDACTED]',
        SECRET_VALUE: '[REDACTED]'
      });
    });
  });

  describe('containsSensitiveData', () => {
    it('should detect sensitive data in strings', () => {
      expect(LogSanitizer.containsSensitiveData('user password is secret')).toBe(true);
      expect(LogSanitizer.containsSensitiveData('API key provided')).toBe(true);
      expect(LogSanitizer.containsSensitiveData('token expired')).toBe(true);
      expect(LogSanitizer.containsSensitiveData('secret configuration')).toBe(true);
    });

    it('should detect credit card references', () => {
      expect(LogSanitizer.containsSensitiveData('creditCard number')).toBe(true);
      expect(LogSanitizer.containsSensitiveData('credit_card info')).toBe(true);
    });

    it('should detect personal information references', () => {
      expect(LogSanitizer.containsSensitiveData('SSN required')).toBe(true);
      expect(LogSanitizer.containsSensitiveData('social_security number')).toBe(true);
      expect(LogSanitizer.containsSensitiveData('email address')).toBe(false);  // email is not considered sensitive by default
      expect(LogSanitizer.containsSensitiveData('phone number')).toBe(false);  // phone is not considered sensitive by default
    });

    it('should not flag non-sensitive strings', () => {
      expect(LogSanitizer.containsSensitiveData('user logged in')).toBe(false);
      expect(LogSanitizer.containsSensitiveData('order processed')).toBe(false);
      expect(LogSanitizer.containsSensitiveData('system startup')).toBe(false);
      expect(LogSanitizer.containsSensitiveData('normal operation')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(LogSanitizer.containsSensitiveData('PASSWORD field')).toBe(true);
      expect(LogSanitizer.containsSensitiveData('ApiKey validation')).toBe(true);
      expect(LogSanitizer.containsSensitiveData('SECRET data')).toBe(true);
    });
  });
});

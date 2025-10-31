/**
 * Integration tests for configuration enforcement
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { RetryHandler } from '../../src/utils/retry.js';
import { Sanitizer } from '../../src/utils/sanitizer.js';
import { TimeoutHandler } from '../../src/utils/timeout.js';

describe('Configuration Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('RetryHandler Configuration', () => {
    it('should use config values for retry behavior', async () => {
      const config = {
        enabled: true,
        maxAttempts: 2,
        initialDelay: 500,
      };

      RetryHandler.setConfig(config);

      let attempts = 0;
      const operation = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 2) {
          const error = new Error('temporary failure');
          (error as any).code = 'ECONNRESET'; // Make it retryable
          return Promise.reject(error);
        }
        return Promise.resolve('success');
      });

      const result = await RetryHandler.execute(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should skip retry when disabled in config', async () => {
      const config = {
        enabled: false,
        maxAttempts: 3,
        initialDelay: 1000,
      };

      RetryHandler.setConfig(config);

      const operation = vi.fn().mockRejectedValue(new Error('failure'));

      await expect(RetryHandler.execute(operation)).rejects.toThrow('failure');
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe('Sanitizer Configuration', () => {
    it('should enforce max request size when enabled', () => {
      const config = {
        enabled: true,
        maxRequestSize: 100, // Very small for testing
      };

      Sanitizer.setConfig(config);

      const largeData = { data: 'x'.repeat(200) };

      expect(() => Sanitizer.validateRequestSize(largeData)).toThrow(
        /Request size \d+ exceeds maximum allowed 100 bytes/
      );
    });

    it('should skip validation when disabled', () => {
      const config = {
        enabled: false,
        maxRequestSize: 100,
      };

      Sanitizer.setConfig(config);

      const largeData = { data: 'x'.repeat(200) };

      expect(() => Sanitizer.validateRequestSize(largeData)).not.toThrow();
    });

    it('should sanitize data when enabled', () => {
      const config = {
        enabled: true,
        maxRequestSize: 1024 * 1024,
      };

      Sanitizer.setConfig(config);

      const sensitiveData = { password: 'secret123', name: 'John' };
      const sanitized = Sanitizer.sanitizeIfEnabled(sensitiveData);

      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.name).toBe('John');
    });

    it('should return original data when disabled', () => {
      const config = {
        enabled: false,
        maxRequestSize: 1024 * 1024,
      };

      Sanitizer.setConfig(config);

      const sensitiveData = { password: 'secret123', name: 'John' };
      const result = Sanitizer.sanitizeIfEnabled(sensitiveData);

      expect(result).toBe(sensitiveData);
      expect(result.password).toBe('secret123');
    });
  });

  describe('TimeoutHandler Configuration', () => {
    it('should use configured timeouts', async () => {
      const config = {
        request: 100,
        adapter: 50,
      };

      TimeoutHandler.setConfig(config);

      const slowOperation = () => new Promise((resolve) => setTimeout(() => resolve('done'), 200));

      await expect(TimeoutHandler.withTimeout(slowOperation, 'adapter')).rejects.toThrow(
        'Operation timed out after 50ms'
      );
    });
  });
});

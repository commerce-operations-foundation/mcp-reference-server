import { RetryHandler } from '../../../src/utils/retry';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BackendUnavailableError, ValidationError } from '../../../src/utils/errors';
import { Logger } from '../../../src/utils/logger';

// Mock Logger to avoid console output during tests
vi.mock('../../../src/utils/logger', () => ({
  Logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('RetryHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should return result on successful operation', async () => {
      const operation = vi.fn().mockResolvedValue('success');

      const result = await RetryHandler.execute(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry retryable errors', async () => {
      const retryableError = new BackendUnavailableError('test-backend');
      const operation = vi
        .fn()
        .mockRejectedValueOnce(retryableError)
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValue('success');

      const result = await RetryHandler.execute(operation, {
        maxRetries: 2,
        initialDelay: 1,
        backoffMultiplier: 2,
      });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
      expect(Logger.warn).toHaveBeenCalledTimes(2);
    });

    it('should not retry non-retryable errors', async () => {
      const nonRetryableError = new ValidationError('field', 'invalid');
      const operation = vi.fn().mockRejectedValue(nonRetryableError);

      await expect(RetryHandler.execute(operation)).rejects.toThrow(nonRetryableError);

      expect(operation).toHaveBeenCalledTimes(1);
      expect(Logger.warn).toHaveBeenCalledWith(
        'Operation failed, not retrying',
        expect.objectContaining({
          attempt: 1,
          retryable: false,
        })
      );
    });

    it('should respect maxRetries limit', async () => {
      const retryableError = new BackendUnavailableError('test-backend');
      const operation = vi.fn().mockRejectedValue(retryableError);

      await expect(
        RetryHandler.execute(operation, {
          maxRetries: 2,
          initialDelay: 1,
        })
      ).rejects.toThrow(retryableError);

      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should retry network errors', async () => {
      const networkError = new Error('Connection failed') as any;
      networkError.code = 'ECONNRESET';

      const operation = vi.fn().mockRejectedValueOnce(networkError).mockResolvedValue('success');

      const result = await RetryHandler.execute(operation, {
        initialDelay: 1,
      });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should use custom retryable error function', async () => {
      const customError = new Error('Custom error');
      const operation = vi.fn().mockRejectedValueOnce(customError).mockResolvedValue('success');

      const customRetryableErrors = vi.fn().mockReturnValue(true);

      const result = await RetryHandler.execute(operation, {
        retryableErrors: customRetryableErrors,
        initialDelay: 1,
      });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
      expect(customRetryableErrors).toHaveBeenCalledWith(customError);
    });
  });

  describe('executeAll', () => {
    it('should execute all operations successfully', async () => {
      const operations = [
        vi.fn().mockResolvedValue('result1'),
        vi.fn().mockResolvedValue('result2'),
        vi.fn().mockResolvedValue('result3'),
      ];

      const results = await RetryHandler.executeAll(operations);

      expect(results).toEqual(['result1', 'result2', 'result3']);
      operations.forEach((op) => expect(op).toHaveBeenCalledTimes(1));
    });

    it('should fail if any operation fails with non-retryable error', async () => {
      const operations = [
        vi.fn().mockResolvedValue('result1'),
        vi.fn().mockRejectedValue(new ValidationError('field', 'invalid')),
        vi.fn().mockResolvedValue('result3'),
      ];

      await expect(RetryHandler.executeAll(operations)).rejects.toThrow('Validation failed');
    });

    it('should retry failed operations', async () => {
      const retryableError = new BackendUnavailableError('test');
      const operations = [
        vi.fn().mockResolvedValue('result1'),
        vi.fn().mockRejectedValueOnce(retryableError).mockResolvedValue('result2'),
        vi.fn().mockResolvedValue('result3'),
      ];

      const results = await RetryHandler.executeAll(operations, {
        initialDelay: 1,
      });

      expect(results).toEqual(['result1', 'result2', 'result3']);
      expect(operations[1]).toHaveBeenCalledTimes(2);
    });
  });

  describe('executeAllSettled', () => {
    it('should return all results even if some fail', async () => {
      const operations = [
        vi.fn().mockResolvedValue('result1'),
        vi.fn().mockRejectedValue(new ValidationError('field', 'invalid')),
        vi.fn().mockResolvedValue('result3'),
      ];

      const results = await RetryHandler.executeAllSettled(operations);

      expect(results).toHaveLength(3);
      expect(results[0]).toEqual({ status: 'fulfilled', value: 'result1' });
      expect(results[1].status).toBe('rejected');
      expect(results[2]).toEqual({ status: 'fulfilled', value: 'result3' });
    });

    it('should retry operations that can be retried', async () => {
      const retryableError = new BackendUnavailableError('test');
      const operations = [
        vi.fn().mockRejectedValueOnce(retryableError).mockResolvedValue('result1'),
        vi.fn().mockRejectedValue(new ValidationError('field', 'invalid')),
      ];

      const results = await RetryHandler.executeAllSettled(operations, {
        initialDelay: 1,
      });

      expect(results[0]).toEqual({ status: 'fulfilled', value: 'result1' });
      expect(results[1].status).toBe('rejected');
      expect(operations[0]).toHaveBeenCalledTimes(2); // Retried
      expect(operations[1]).toHaveBeenCalledTimes(1); // Not retried
    });
  });
});

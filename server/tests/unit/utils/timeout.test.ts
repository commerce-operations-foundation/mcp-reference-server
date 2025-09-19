/**
 * Tests for TimeoutHandler
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TimeoutHandler } from '../../../src/utils/timeout.js';

describe('TimeoutHandler', () => {
  beforeEach(() => {
    // Reset configuration
    TimeoutHandler.setConfig({ request: 30000, adapter: 5000 });
  });

  describe('setConfig', () => {
    it('should set timeout configuration', () => {
      const config = { request: 60000, adapter: 10000 };
      TimeoutHandler.setConfig(config);
      
      expect(TimeoutHandler.getTimeout('request')).toBe(60000);
      expect(TimeoutHandler.getTimeout('adapter')).toBe(10000);
    });
  });

  describe('getTimeout', () => {
    it('should return configured timeouts', () => {
      expect(TimeoutHandler.getTimeout('request')).toBe(30000);
      expect(TimeoutHandler.getTimeout('adapter')).toBe(5000);
    });

    it('should return defaults when no config set', () => {
      TimeoutHandler.setConfig(null as any);
      
      expect(TimeoutHandler.getTimeout('request')).toBe(30000);
      expect(TimeoutHandler.getTimeout('adapter')).toBe(5000);
    });
  });

  describe('withTimeout', () => {
    it('should complete operation before timeout', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      
      const result = await TimeoutHandler.withTimeout(operation, 'request');
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should timeout operation that takes too long', async () => {
      const operation = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('too slow'), 1000))
      );
      
      await expect(
        TimeoutHandler.withTimeout(operation, 'adapter', 100)
      ).rejects.toThrow('Operation timed out after 100ms');
    });

    it('should use configured timeout when no custom timeout provided', async () => {
      TimeoutHandler.setConfig({ request: 100, adapter: 50 });
      
      const operation = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('too slow'), 200))
      );
      
      await expect(
        TimeoutHandler.withTimeout(operation, 'adapter')
      ).rejects.toThrow('Operation timed out after 50ms');
    });

    it('should propagate operation errors', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('operation failed'));
      
      await expect(
        TimeoutHandler.withTimeout(operation, 'request')
      ).rejects.toThrow('operation failed');
    });
  });

  describe('createTimeout', () => {
    it('should create timeout promise that rejects', async () => {
      await expect(
        TimeoutHandler.createTimeout(10, 'custom timeout')
      ).rejects.toThrow('custom timeout');
    });

    it('should use default message when none provided', async () => {
      await expect(
        TimeoutHandler.createTimeout(10)
      ).rejects.toThrow('Operation timed out');
    });
  });
});
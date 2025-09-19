/**
 * Structured Logger Unit Tests
 */

import { vi, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { StructuredLogger, getLogger, resetLogger, LogContext } from '../../../src/logging/structured-logger';
import * as winston from 'winston';

// Mock winston
vi.mock('winston', () => ({
  format: {
    combine: vi.fn(() => ({ transform: vi.fn() })),
    timestamp: vi.fn(() => ({ transform: vi.fn() })),
    errors: vi.fn(() => ({ transform: vi.fn() })),
    metadata: vi.fn(() => ({ transform: vi.fn() })),
    json: vi.fn(() => ({ transform: vi.fn() })),
    colorize: vi.fn(() => ({ transform: vi.fn() })),
    printf: vi.fn(() => ({ transform: vi.fn() })),
    simple: vi.fn(() => ({ transform: vi.fn() }))
  },
  transports: {
    Console: vi.fn(),
    File: vi.fn()
  },
  createLogger: vi.fn(() => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    log: vi.fn(),
    add: vi.fn()
  }))
}));

// Mock fs
vi.mock('fs', () => ({
  existsSync: vi.fn(() => true),
  mkdirSync: vi.fn()
}));

describe('StructuredLogger', () => {
  let logger: StructuredLogger;
  let mockWinstonLogger: any;

  beforeEach(() => {
    resetLogger();
    // Mock environment variable to ensure consistent test behavior
    vi.stubEnv('LOG_LEVEL', 'info');

    mockWinstonLogger = {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
      log: vi.fn(),
      add: vi.fn()
    };
    (winston.createLogger as vi.Mock).mockReturnValue(mockWinstonLogger);

    logger = new StructuredLogger('test-service');
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  describe('constructor', () => {
    it('should create a winston logger with correct configuration', () => {
      expect(winston.createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info',
          defaultMeta: { service: 'test-service' }
        })
      );
    });

    it('should use default service name if not provided', () => {
      new StructuredLogger();
      expect(winston.createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultMeta: { service: 'cof-mcp' }
        })
      );
    });
  });

  describe('correlation ID management', () => {
    it('should set and clear correlation ID', () => {
      const correlationId = 'test-correlation-123';

      logger.setCorrelationId(correlationId);
      logger.info('test message');

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'test message',
        expect.objectContaining({
          correlationId
        })
      );

      logger.clearCorrelationId();
      logger.info('test message 2');

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'test message 2',
        expect.objectContaining({
          correlationId: null
        })
      );
    });
  });

  describe('log levels', () => {
    it('should log error messages', () => {
      const context: LogContext = { toolName: 'test-tool' };
      logger.error('test error', context);

      expect(mockWinstonLogger.error).toHaveBeenCalledWith(
        'test error',
        expect.objectContaining({
          toolName: 'test-tool',
          timestamp: expect.any(String)
        })
      );
    });

    it('should log error objects', () => {
      const error = new Error('test error');
      logger.error('error occurred', error);

      expect(mockWinstonLogger.error).toHaveBeenCalledWith(
        'error occurred',
        expect.objectContaining({
          error: {
            message: 'test error',
            stack: expect.any(String),
            name: 'Error'
          }
        })
      );
    });

    it('should log warn messages', () => {
      logger.warn('test warning', { operation: 'test-op' });

      expect(mockWinstonLogger.warn).toHaveBeenCalledWith(
        'test warning',
        expect.objectContaining({
          operation: 'test-op'
        })
      );
    });

    it('should log info messages', () => {
      logger.info('test info');

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'test info',
        expect.objectContaining({
          correlationId: null,
          timestamp: expect.any(String)
        })
      );
    });

    it('should log debug messages', () => {
      logger.debug('test debug', { userId: 'user123' });

      expect(mockWinstonLogger.debug).toHaveBeenCalledWith(
        'test debug',
        expect.objectContaining({
          userId: 'user123'
        })
      );
    });

    it('should log trace messages', () => {
      logger.trace('test trace');

      expect(mockWinstonLogger.debug).toHaveBeenCalledWith(
        '[TRACE] test trace',
        expect.objectContaining({
          timestamp: expect.any(String)
        })
      );
    });
  });

  describe('structured logging methods', () => {
    it('should log requests with sanitized parameters', () => {
      const params = { password: 'secret', normalField: 'value' };
      logger.logRequest('test-method', params, { correlationId: '123' });

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'Request received',
        expect.objectContaining({
          method: 'test-method',
          params: { password: '[REDACTED]', normalField: 'value' },
          correlationId: '123'
        })
      );
    });

    it('should log responses with duration and success status', () => {
      logger.logResponse('test-method', 150, true, { correlationId: '123' });

      expect(mockWinstonLogger.log).toHaveBeenCalledWith(
        'info',
        'Request completed',
        expect.objectContaining({
          method: 'test-method',
          duration: 150,
          success: true,
          correlationId: '123'
        })
      );
    });

    it('should log tool execution', () => {
      const params = { input: 'test' };
      const result = { output: 'success' };

      logger.logToolExecution('test-tool', params, result, 100);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'Tool executed',
        expect.objectContaining({
          toolName: 'test-tool',
          params,
          success: true,
          duration: 100,
          resultSize: expect.any(Number)
        })
      );
    });

    it('should log adapter calls', () => {
      logger.logAdapterCall('get-order', 200, true);

      expect(mockWinstonLogger.debug).toHaveBeenCalledWith(
        'Adapter call',
        expect.objectContaining({
          operation: 'get-order',
          duration: 200,
          success: true
        })
      );
    });

    it('should log audit events', () => {
      const details = { orderId: '123', action: 'capture' };
      logger.audit('order-capture', details);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'Audit event',
        expect.objectContaining({
          action: 'order-capture',
          details,
          source: 'audit',
          timestamp: expect.any(String)
        })
      );
    });
  });

  describe('performance timing', () => {
    it('should provide a timer function that logs duration', () => {
      vi.useFakeTimers();

      const timer = logger.startTimer('test-operation');

      vi.advanceTimersByTime(100);
      timer();

      expect(mockWinstonLogger.debug).toHaveBeenCalledWith(
        'test-operation completed',
        expect.objectContaining({
          duration: 100
        })
      );

      vi.useRealTimers();
    });
  });

  describe('data sanitization', () => {
    it('should sanitize sensitive data in context', () => {
      const sensitiveContext = {
        password: 'secret123',
        apiKey: 'key123',
        normalField: 'safe'
      };

      logger.info('test message', sensitiveContext);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'test message',
        expect.objectContaining({
          password: '[REDACTED]',
          apiKey: '[REDACTED]',
          normalField: 'safe'
        })
      );
    });
  });
});

describe('getLogger singleton', () => {
  beforeEach(() => {
    resetLogger();
  });

  it('should return the same instance for multiple calls', () => {
    const logger1 = getLogger();
    const logger2 = getLogger();

    expect(logger1).toBe(logger2);
  });

  it('should create logger with custom service name', () => {
    getLogger('custom-service');

    expect(winston.createLogger).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultMeta: { service: 'custom-service' }
      })
    );
  });
});

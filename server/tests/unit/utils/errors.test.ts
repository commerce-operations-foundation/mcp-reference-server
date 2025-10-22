import {
  FulfillmentError,
  FulfillmentErrorCode,
  OrderNotFoundError,
  InsufficientInventoryError,
  ValidationError,
  BackendUnavailableError,
  PaymentFailedError,
  RateLimitExceededError,
  TimeoutError,
  NotImplementedError,
} from '../../../src/utils/errors';
import { AdapterError } from '../../../src/types/adapter';
import { describe, it, expect } from 'vitest';

describe('FulfillmentError and subclasses', () => {
  describe('FulfillmentError', () => {
    it('should create error with correct properties', () => {
      const error = new FulfillmentError(FulfillmentErrorCode.VALIDATION_ERROR, 'Test error', true, { test: 'data' });

      expect(error.code).toBe(FulfillmentErrorCode.VALIDATION_ERROR);
      expect(error.message).toBe('Test error');
      expect(error.retryable).toBe(true);
      expect(error.data).toEqual({ test: 'data' });
      expect(error.name).toBe('FulfillmentError');
      expect(error instanceof FulfillmentError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it('should default retryable to false', () => {
      const error = new FulfillmentError(FulfillmentErrorCode.ORDER_NOT_FOUND, 'Test error');
      expect(error.retryable).toBe(false);
    });

    it('should convert to JSON-RPC error format', () => {
      const error = new FulfillmentError(FulfillmentErrorCode.VALIDATION_ERROR, 'Test error', true, { field: 'test' });

      const jsonRpcError = error.toJSONRPCError();

      expect(jsonRpcError.code).toBe(FulfillmentErrorCode.VALIDATION_ERROR);
      expect(jsonRpcError.message).toContain('Test error');
      expect(jsonRpcError.data).toEqual({
        retryable: true,
        isProtocolError: false,
        field: 'test',
      });
    });
  });

  describe('OrderNotFoundError', () => {
    it('should create order not found error', () => {
      const error = new OrderNotFoundError('ORD-123');

      expect(error.code).toBe(FulfillmentErrorCode.ORDER_NOT_FOUND);
      expect(error.message).toBe('Order not found: ORD-123');
      expect(error.retryable).toBe(false);
      expect(error.data).toEqual({ orderId: 'ORD-123' });
      expect(error instanceof OrderNotFoundError).toBe(true);
      expect(error instanceof FulfillmentError).toBe(true);
    });
  });

  describe('InsufficientInventoryError', () => {
    it('should create insufficient inventory error', () => {
      const error = new InsufficientInventoryError('SKU-123', 10, 5);

      expect(error.code).toBe(FulfillmentErrorCode.INSUFFICIENT_INVENTORY);
      expect(error.message).toBe('Insufficient inventory for SKU SKU-123: requested 10, available 5');
      expect(error.retryable).toBe(false);
      expect(error.data).toEqual({
        sku: 'SKU-123',
        requested: 10,
        available: 5,
      });
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with value', () => {
      const error = new ValidationError('email', 'invalid format', 'not-an-email');

      expect(error.code).toBe(FulfillmentErrorCode.VALIDATION_ERROR);
      expect(error.message).toBe('Validation failed for field email: invalid format');
      expect(error.retryable).toBe(false);
      expect(error.data).toEqual({
        field: 'email',
        reason: 'invalid format',
        value: 'not-an-email',
      });
    });

    it('should create validation error without value', () => {
      const error = new ValidationError('phone', 'required field missing');

      expect(error.data).toEqual({
        field: 'phone',
        reason: 'required field missing',
        value: undefined,
      });
    });
  });

  describe('BackendUnavailableError', () => {
    it('should create backend unavailable error as retryable', () => {
      const error = new BackendUnavailableError('shopify-adapter');

      expect(error.code).toBe(FulfillmentErrorCode.BACKEND_UNAVAILABLE);
      expect(error.message).toBe('Backend unavailable: shopify-adapter');
      expect(error.retryable).toBe(true);
      expect(error.data).toEqual({ backend: 'shopify-adapter' });
    });
  });

  describe('PaymentFailedError', () => {
    it('should create payment failed error with reason', () => {
      const error = new PaymentFailedError('pay-123', 'insufficient funds');

      expect(error.code).toBe(FulfillmentErrorCode.PAYMENT_FAILED);
      expect(error.message).toBe('Payment failed: pay-123 - insufficient funds');
      expect(error.retryable).toBe(false);
      expect(error.data).toEqual({
        paymentId: 'pay-123',
        reason: 'insufficient funds',
      });
    });

    it('should create payment failed error without reason', () => {
      const error = new PaymentFailedError('pay-456');

      expect(error.message).toBe('Payment failed: pay-456');
      expect(error.data).toEqual({
        paymentId: 'pay-456',
        reason: undefined,
      });
    });
  });

  describe('RateLimitExceededError', () => {
    it('should create rate limit error with retry after', () => {
      const error = new RateLimitExceededError(5000);

      expect(error.code).toBe(FulfillmentErrorCode.RATE_LIMIT_EXCEEDED);
      expect(error.message).toBe('Rate limit exceeded, retry after 5000ms');
      expect(error.retryable).toBe(true);
      expect(error.data).toEqual({ retryAfter: 5000 });
    });

    it('should create rate limit error without retry after', () => {
      const error = new RateLimitExceededError();

      expect(error.message).toBe('Rate limit exceeded');
      expect(error.data).toEqual({ retryAfter: undefined });
    });
  });

  describe('TimeoutError', () => {
    it('should create timeout error', () => {
      const error = new TimeoutError('database-query', 30000);

      expect(error.code).toBe(FulfillmentErrorCode.TIMEOUT);
      expect(error.message).toBe('Operation database-query timed out after 30000ms');
      expect(error.retryable).toBe(true);
      expect(error.data).toEqual({
        operation: 'database-query',
        timeout: 30000,
      });
    });
  });

  describe('AdapterError', () => {
    it('should create adapter error with message and code', () => {
      const error = new AdapterError('connection failed', 'CONNECTION_ERROR', { retry: true });

      expect(error.code).toBe('CONNECTION_ERROR');
      expect(error.message).toBe('connection failed');
      expect(error.details).toEqual({ retry: true });
      expect(error.name).toBe('AdapterError');
    });

    it('should create adapter error without details', () => {
      const error = new AdapterError('temporary network issue', 'NETWORK_ERROR');

      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.message).toBe('temporary network issue');
      expect(error.details).toBeUndefined();
    });
  });

  describe('NotImplementedError', () => {
    it('should create not implemented error', () => {
      const error = new NotImplementedError('bulk-operations');

      expect(error.code).toBe(FulfillmentErrorCode.NOT_IMPLEMENTED);
      expect(error.message).toBe('Feature not implemented: bulk-operations');
      expect(error.retryable).toBe(false);
      expect(error.data).toEqual({ feature: 'bulk-operations' });
    });
  });

  describe('Error code categories', () => {
    it('should have correct order error codes', () => {
      expect(FulfillmentErrorCode.ORDER_NOT_FOUND).toBe(1001);
      expect(FulfillmentErrorCode.INSUFFICIENT_INVENTORY).toBe(1002);
      expect(FulfillmentErrorCode.INVALID_ORDER_STATE).toBe(1003);
      expect(FulfillmentErrorCode.PAYMENT_FAILED).toBe(1004);
      expect(FulfillmentErrorCode.SHIPPING_UNAVAILABLE).toBe(1005);
    });

    it('should have correct validation error codes', () => {
      expect(FulfillmentErrorCode.VALIDATION_ERROR).toBe(2001);
      expect(FulfillmentErrorCode.MISSING_REQUIRED_FIELD).toBe(2002);
      expect(FulfillmentErrorCode.INVALID_FORMAT).toBe(2003);
    });

    it('should have correct rate limiting error codes', () => {
      expect(FulfillmentErrorCode.RATE_LIMIT_EXCEEDED).toBe(3001);
      expect(FulfillmentErrorCode.TIMEOUT).toBe(3002);
    });

    it('should have correct backend error codes', () => {
      expect(FulfillmentErrorCode.ADAPTER_ERROR).toBe(4001);
      expect(FulfillmentErrorCode.BACKEND_UNAVAILABLE).toBe(4002);
    });

    it('should have correct feature error codes', () => {
      expect(FulfillmentErrorCode.NOT_IMPLEMENTED).toBe(5001);
    });
  });
});

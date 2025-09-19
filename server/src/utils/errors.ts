import { MCPError as ProtocolMCPError } from '../errors/index.js';

/**
 * Fulfillment-specific error codes organized by category
 */
export enum FulfillmentErrorCode {
  // Order errors (1xxx)
  ORDER_NOT_FOUND = 1001,
  INSUFFICIENT_INVENTORY = 1002,
  INVALID_ORDER_STATE = 1003,
  PAYMENT_FAILED = 1004,
  SHIPPING_UNAVAILABLE = 1005,
  
  // Validation errors (2xxx)
  VALIDATION_ERROR = 2001,
  MISSING_REQUIRED_FIELD = 2002,
  INVALID_FORMAT = 2003,
  
  // Rate limiting (3xxx)
  RATE_LIMIT_EXCEEDED = 3001,
  TIMEOUT = 3002,
  
  // Backend errors (4xxx)
  ADAPTER_ERROR = 4001,
  BACKEND_UNAVAILABLE = 4002,
  
  // Feature errors (5xxx)
  NOT_IMPLEMENTED = 5001
}

/**
 * Base Fulfillment error class with support for retryable operations and JSON-RPC conversion
 */
export class FulfillmentError extends Error {
  public readonly isProtocolError: boolean = false;
  
  constructor(
    public code: FulfillmentErrorCode,
    message: string,
    public retryable: boolean = false,
    public data?: any
  ) {
    super(message);
    this.name = 'FulfillmentError';
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, FulfillmentError.prototype);
  }
  
  /**
   * Convert to MCP JSON-RPC error format
   */
  toJSONRPCError(): ProtocolMCPError {
    return new ProtocolMCPError(
      this.code,
      this.message,
      {
        retryable: this.retryable,
        isProtocolError: this.isProtocolError,
        ...this.data
      }
    );
  }
}

/**
 * Base error class for MCP server errors (for simple cases)
 */
export class MCPError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: any;
  public readonly isProtocolError: boolean = false;
  public readonly retryable: boolean = false;

  constructor(message: string, code: string, statusCode: number = 500, details?: any, isProtocolError: boolean = false, retryable: boolean = false) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isProtocolError = isProtocolError;
    this.retryable = retryable;
    
    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error for schema validation failures
 */
export class ValidationError extends FulfillmentError {
  public readonly field: string;
  public readonly value?: any;
  public readonly isProtocolError: boolean = true; // Validation errors are protocol errors

  constructor(field: string, reason: string, value?: any) {
    super(
      FulfillmentErrorCode.VALIDATION_ERROR,
      `Validation failed for field ${field}: ${reason}`,
      false,
      { field, reason, value }
    );
    this.field = field;
    this.value = value;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Order not found error - Fulfillment version for complex cases
 */
export class OrderNotFoundError extends FulfillmentError {
  constructor(orderId: string) {
    super(
      FulfillmentErrorCode.ORDER_NOT_FOUND,
      `Order not found: ${orderId}`,
      false,
      { orderId }
    );
    Object.setPrototypeOf(this, OrderNotFoundError.prototype);
  }
}

/**
 * Insufficient inventory error
 */
export class InsufficientInventoryError extends FulfillmentError {
  constructor(sku: string, requested: number, available: number) {
    super(
      FulfillmentErrorCode.INSUFFICIENT_INVENTORY,
      `Insufficient inventory for SKU ${sku}: requested ${requested}, available ${available}`,
      false,
      { sku, requested, available }
    );
    Object.setPrototypeOf(this, InsufficientInventoryError.prototype);
  }
}

/**
 * Product not found error - Simple MCP version
 */
export class ProductNotFoundError extends MCPError {
  constructor(identifier: any) {
    super(
      `Product not found: ${JSON.stringify(identifier)}`,
      'PRODUCT_NOT_FOUND',
      404,
      { identifier }
    );
  }
}

/**
 * Customer not found error
 */
export class CustomerNotFoundError extends MCPError {
  constructor(identifier: any) {
    super(
      `Customer not found: ${JSON.stringify(identifier)}`,
      'CUSTOMER_NOT_FOUND',
      404,
      { identifier }
    );
  }
}

/**
 * Inventory not found error
 */
export class InventoryNotFoundError extends MCPError {
  constructor(sku: string, locationId?: string) {
    const location = locationId ? ` in location ${locationId}` : '';
    super(
      `Inventory not found for SKU ${sku}${location}`,
      'INVENTORY_NOT_FOUND',
      404,
      { sku, locationId }
    );
  }
}

/**
 * Backend unavailable error (retryable)
 */
export class BackendUnavailableError extends FulfillmentError {
  constructor(backend: string) {
    super(
      FulfillmentErrorCode.BACKEND_UNAVAILABLE,
      `Backend unavailable: ${backend}`,
      true,
      { backend }
    );
    Object.setPrototypeOf(this, BackendUnavailableError.prototype);
  }
}

/**
 * Adapter not initialized error
 */
export class AdapterNotInitializedError extends FulfillmentError {
  constructor(message = 'Adapter not initialized. Call initialize() first.') {
    super(FulfillmentErrorCode.ADAPTER_ERROR, message, false);
    Object.setPrototypeOf(this, AdapterNotInitializedError.prototype);
  }
}

/**
 * Payment failed error
 */
export class PaymentFailedError extends FulfillmentError {
  constructor(paymentId: string, reason?: string) {
    super(
      FulfillmentErrorCode.PAYMENT_FAILED,
      `Payment failed: ${paymentId}${reason ? ` - ${reason}` : ''}`,
      false,
      { paymentId, reason }
    );
    Object.setPrototypeOf(this, PaymentFailedError.prototype);
  }
}


/**
 * Rate limit exceeded error (retryable)
 */
export class RateLimitExceededError extends FulfillmentError {
  constructor(retryAfter?: number) {
    super(
      FulfillmentErrorCode.RATE_LIMIT_EXCEEDED,
      `Rate limit exceeded${retryAfter ? `, retry after ${retryAfter}ms` : ''}`,
      true,
      { retryAfter }
    );
    Object.setPrototypeOf(this, RateLimitExceededError.prototype);
  }
}

/**
 * Timeout error (retryable)
 */
export class TimeoutError extends FulfillmentError {
  constructor(operation: string, timeout: number) {
    super(
      FulfillmentErrorCode.TIMEOUT,
      `Operation ${operation} timed out after ${timeout}ms`,
      true,
      { operation, timeout }
    );
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * Not implemented error for features not yet supported
 */
export class NotImplementedError extends FulfillmentError {
  constructor(feature: string) {
    super(
      FulfillmentErrorCode.NOT_IMPLEMENTED,
      `Feature not implemented: ${feature}`,
      false,
      { feature }
    );
    Object.setPrototypeOf(this, NotImplementedError.prototype);
  }
}


/**
 * Configuration error
 */
export class ConfigurationError extends MCPError {
  constructor(message: string, details?: any) {
    super(`Configuration error: ${message}`, 'CONFIGURATION_ERROR', 500, details);
  }
}

/**
 * Connection error for adapter connections
 */
export class ConnectionError extends MCPError {
  constructor(message: string, details?: any) {
    super(`Connection error: ${message}`, 'CONNECTION_ERROR', 503, details, false, true);
  }
}
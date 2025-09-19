/**
 * Implementation of adapter error classes and type exports
 * This file contains the actual implementations of error classes
 * Replace with imports from the actual MCP server package when available
 */

// Import types for error constructors
import type { 
  OrderIdentifier, 
  ProductIdentifier, 
  CustomerIdentifier 
} from './fulfillment';

// Re-export specific types from the .d.ts file
export type {
  IFulfillmentAdapter,
  AdapterConfig,
  AdapterOptions,
  HealthStatus,
  HealthCheck,
  OrderResult,
  CancelResult,
  UpdateResult,
  ReturnResult,
  ExchangeResult,
  ShipmentResult,
  HoldResult,
  SplitResult,
  SplitShipment,
  ReservationResult,
  ReservedItem,
  ReservationRequest,
  AdapterCapabilities,
  AdapterConstructor
} from './adapter.d';

// Error class implementations
export class AdapterError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AdapterError';
    Object.setPrototypeOf(this, AdapterError.prototype);
  }
}

export class OrderNotFoundError extends AdapterError {
  constructor(identifier: OrderIdentifier) {
    super(
      `Order not found: ${JSON.stringify(identifier)}`,
      'ORDER_NOT_FOUND',
      identifier
    );
    Object.setPrototypeOf(this, OrderNotFoundError.prototype);
  }
}

export class ProductNotFoundError extends AdapterError {
  constructor(identifier: ProductIdentifier) {
    super(
      `Product not found: ${JSON.stringify(identifier)}`,
      'PRODUCT_NOT_FOUND',
      identifier
    );
    Object.setPrototypeOf(this, ProductNotFoundError.prototype);
  }
}

export class CustomerNotFoundError extends AdapterError {
  constructor(identifier: CustomerIdentifier) {
    super(
      `Customer not found: ${JSON.stringify(identifier)}`,
      'CUSTOMER_NOT_FOUND',
      identifier
    );
    Object.setPrototypeOf(this, CustomerNotFoundError.prototype);
  }
}

export class InsufficientInventoryError extends AdapterError {
  constructor(sku: string, requested: number, available: number) {
    super(
      `Insufficient inventory for SKU ${sku}: requested ${requested}, available ${available}`,
      'INSUFFICIENT_INVENTORY',
      { sku, requested, available }
    );
    Object.setPrototypeOf(this, InsufficientInventoryError.prototype);
  }
}

export class InvalidOrderStateError extends AdapterError {
  constructor(orderId: string, currentStatus: string, operation: string) {
    super(
      `Cannot ${operation} order ${orderId} in status ${currentStatus}`,
      'INVALID_ORDER_STATE',
      { orderId, currentStatus, operation }
    );
    Object.setPrototypeOf(this, InvalidOrderStateError.prototype);
  }
}
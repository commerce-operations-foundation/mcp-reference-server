/**
 * Adapter interface and request/response type definitions
 */

import {
  Order,
  Customer,
  Product,
  Inventory,
  Shipment,
  Buyer,
  OrderIdentifier,
  ProductIdentifier,
  CustomerIdentifier,
  ShipmentIdentifier,
  HoldParams,
  SplitParams,
  InventoryItem,
  ReturnItem,
  ExchangeParams,
  OrderUpdates,
  ShippingInfo,
  OrderRequest
} from './fulfillment.js';

// Configuration types
export interface AdapterConfig {
  type: 'built-in' | 'npm' | 'local';
  name?: string; // For built-in adapters
  package?: string; // For npm adapters
  path?: string; // For local adapters
  exportName?: string; // Optional export name
  options?: AdapterOptions;
}

export interface AdapterOptions {
  [key: string]: unknown;
}

// Health status type
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  timestamp?: string;
  checks?: HealthCheck[];
  version?: string;
  details?: Record<string, unknown>;
  checkedAt?: Date;
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message?: string;
  duration?: number;
  details?: Record<string, unknown>; // Added for test compatibility
}

// Request types for adapter methods
// Note: OrderRequest is imported from fulfillment.ts to avoid duplication

export interface OrderResult {
  success: boolean;
  orderId: string;
  orderNumber?: string;
  status: string;
  createdAt: string;
  message?: string;
}

export interface CancelResult {
  success: boolean;
  orderId: string;
  status: 'cancelled';
  cancelledAt: string;
  refundInitiated: boolean;
  message?: string;
}

export interface UpdateResult {
  success: boolean;
  orderId: string;
  updatedFields: string[];
  version?: number;
  message?: string;
}

export interface ReturnResult {
  success: boolean;
  returnId: string;
  rmaNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  refundAmount: number;
  returnLabel?: string;
  message?: string;
}

export interface ExchangeResult {
  success: boolean;
  exchangeId: string;
  originalOrderId: string;
  newOrderId: string;
  priceDifference: number;
  rmaNumber?: string;
  message?: string;
}

export interface ShipmentResult {
  success: boolean;
  shipmentId: string;
  trackingNumber?: string;
  carrier?: string;
  shippedAt: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  message?: string;
}

export interface HoldResult {
  success: boolean;
  orderId: string;
  holdId: string;
  status: 'on_hold';
  reason: string;
  autoRelease?: boolean;
  message?: string;
}

export interface SplitResult {
  success: boolean;
  originalOrderId: string;
  newOrderIds: string[];
  splitCount: number;
  shipments?: SplitShipment[];
  message?: string;
}

export interface SplitShipment {
  orderId: string;
  warehouse: string;
  estimatedShipDate: string;
}

export interface ReservationResult {
  success: boolean;
  reservationId: string;
  items: ReservedItem[];
  expiresAt: string;
  message?: string;
}

export interface ReservedItem {
  sku: string;
  reserved: number;
  available: number;
}

// Main adapter interface
export interface IFulfillmentAdapter {
  // Lifecycle methods
  initialize?(config: AdapterConfig): Promise<void>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  cleanup?(): Promise<void>;
  healthCheck(): Promise<HealthStatus>;
  checkHealth?(): Promise<HealthStatus>;
  getCapabilities?(): Promise<AdapterCapabilities>;
  updateConfig?(config: AdapterConfig): Promise<void>;

  // Order Actions
  captureOrder(params: OrderRequest): Promise<OrderResult>;
  cancelOrder(orderId: string, reason?: string): Promise<CancelResult>;
  updateOrder(orderId: string, updates: OrderUpdates): Promise<UpdateResult>;
  returnOrder(orderId: string, items: ReturnItem[]): Promise<ReturnResult>;
  exchangeOrder(params: ExchangeParams): Promise<ExchangeResult>;
  shipOrder(orderId: string, shipping: ShippingInfo): Promise<ShipmentResult>;

  // Management Operations
  holdOrder(orderId: string, holdParams: HoldParams): Promise<HoldResult>;
  splitOrder(orderId: string, splits: SplitParams[]): Promise<SplitResult>;
  reserveInventory(reservation: ReservationRequest): Promise<ReservationResult>;
  releaseReservation?(reservationId: string): Promise<void>;
  adjustInventory?(sku: string, adjustment: number, reason: string, locationId?: string): Promise<Inventory>;
  transferInventory?(sku: string, quantity: number, fromLocationId: string, toLocationId: string, reason?: string): Promise<{ from: Inventory; to: Inventory }>;

  // Query Operations
  getOrder(identifier: OrderIdentifier): Promise<Order>;
  getInventory(sku: string, locationId?: string): Promise<Inventory>;
  getProduct(identifier: ProductIdentifier): Promise<Product>;
  getCustomer(identifier: CustomerIdentifier): Promise<Customer>;
  getShipment(identifier: ShipmentIdentifier): Promise<Shipment>;
  getBuyer?(buyerId: string): Promise<Buyer>;
  searchOrders?(filters: OrderSearchFilters): Promise<{ orders: Order[]; total: number }>;
  searchProducts?(filters: ProductSearchFilters): Promise<{ products: Product[]; total: number }>;
  getCustomerOrders?(customerId: string, options?: { limit?: number; offset?: number }): Promise<{ orders: Order[]; total: number }>;
}

// Search filter types
export interface OrderSearchFilters {
  status?: string;
  customerId?: string;
  email?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

export interface ProductSearchFilters {
  category?: string;
  brand?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  searchTerm?: string;
  limit?: number;
  offset?: number;
}

// Adapter factory type
export type AdapterConstructor = new (config: AdapterConfig) => IFulfillmentAdapter;

// Additional types
export interface ReservationRequest {
  items: InventoryItem[];
  expiresInMinutes?: number;
}

export interface AdapterCapabilities {
  supportsOrderCapture: boolean;
  supportsInventoryReservation: boolean;
  supportsReturns: boolean;
  supportsExchanges: boolean;
  supportsShipping: boolean;
  supportsSplitOrders: boolean;
  supportsCustomFields: boolean;
  maxBatchSize?: number;
}

// Error types for adapters
export class AdapterError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AdapterError';
  }
}

export class OrderNotFoundError extends AdapterError {
  constructor(identifier: OrderIdentifier) {
    super(
      `Order not found: ${JSON.stringify(identifier)}`,
      'ORDER_NOT_FOUND',
      identifier
    );
  }
}

export class ProductNotFoundError extends AdapterError {
  constructor(identifier: ProductIdentifier) {
    super(
      `Product not found: ${JSON.stringify(identifier)}`,
      'PRODUCT_NOT_FOUND',
      identifier
    );
  }
}

export class CustomerNotFoundError extends AdapterError {
  constructor(identifier: CustomerIdentifier) {
    super(
      `Customer not found: ${JSON.stringify(identifier)}`,
      'CUSTOMER_NOT_FOUND',
      identifier
    );
  }
}

export class InsufficientInventoryError extends AdapterError {
  constructor(sku: string, requested: number, available: number) {
    super(
      `Insufficient inventory for SKU ${sku}: requested ${requested}, available ${available}`,
      'INSUFFICIENT_INVENTORY',
      { sku, requested, available }
    );
  }
}

export class InvalidOrderStateError extends AdapterError {
  constructor(orderId: string, currentStatus: string, operation: string) {
    super(
      `Cannot ${operation} order ${orderId} in status ${currentStatus}`,
      'INVALID_ORDER_STATE',
      { orderId, currentStatus, operation }
    );
  }
}
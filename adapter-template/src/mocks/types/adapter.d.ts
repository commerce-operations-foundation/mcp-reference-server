/**
 * Type definitions for the adapter interface
 * This file should be replaced with imports from the actual MCP server package when available
 * 
 * IMPORTANT: These types must match exactly with server/src/types/adapter.ts
 */

import type {
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
} from './fulfillment';

// Configuration types
export interface AdapterConfig {
  type: 'built-in' | 'npm' | 'local';
  name?: string;
  package?: string;
  path?: string;
  exportName?: string;
  options?: AdapterOptions;
}

export interface AdapterOptions {
  [key: string]: any;
}

// Health status type
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  timestamp?: string;
  checks?: HealthCheck[];
  version?: string;
  details?: any;
  checkedAt?: Date;
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message?: string;
  duration?: number;
  details?: any;
}

// Result types
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

// Request types
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
  searchOrders?(filters: any): Promise<{ orders: Order[]; total: number }>;
  searchProducts?(filters: any): Promise<{ products: Product[]; total: number }>;
  getCustomerOrders?(customerId: string, options?: { limit?: number; offset?: number }): Promise<{ orders: Order[]; total: number }>;
}

// Adapter factory type
export type AdapterConstructor = new (config: AdapterConfig) => IFulfillmentAdapter;

// Error types for adapters
export declare class AdapterError extends Error {
  code: string;
  details?: any;
  constructor(message: string, code: string, details?: any);
}

export declare class OrderNotFoundError extends AdapterError {
  constructor(identifier: OrderIdentifier);
}

export declare class ProductNotFoundError extends AdapterError {
  constructor(identifier: ProductIdentifier);
}

export declare class CustomerNotFoundError extends AdapterError {
  constructor(identifier: CustomerIdentifier);
}

export declare class InsufficientInventoryError extends AdapterError {
  constructor(sku: string, requested: number, available: number);
}

export declare class InvalidOrderStateError extends AdapterError {
  constructor(orderId: string, currentStatus: string, operation: string);
}
/**
 * Adapter interface and request/response type definitions
 */

import {
  CancelOrderInput,
  CreateReturnInput,
  CreateSalesOrderInput,
  Customer,
  Fulfillment,
  FulfillOrderInput,
  GetCustomersInput,
  GetFulfillmentsInput,
  GetInventoryInput,
  GetOrdersInput,
  GetProductsInput,
  GetProductVariantsInput,
  GetReturnsInput,
  InventoryItem,
  Order,
  Product,
  ProductVariant,
  Return,
  UpdateOrderInput,
} from '../schemas/index.js';

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

export type FulfillmentToolResult<T> =
  | ({
      success: true;
    } & T)
  | ({
      success: false;
      error: any;
    } & Record<string, unknown>);

export type OrderResult = FulfillmentToolResult<{ order: Order }>;
export type ReturnResult = FulfillmentToolResult<{ return: Return }>;

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
  createSalesOrder(input: CreateSalesOrderInput): Promise<OrderResult>;
  cancelOrder(input: CancelOrderInput): Promise<OrderResult>;
  updateOrder(input: UpdateOrderInput): Promise<OrderResult>;
  fulfillOrder(input: FulfillOrderInput): Promise<FulfillmentToolResult<{ fulfillment: Fulfillment }>>;
  createReturn(input: CreateReturnInput): Promise<ReturnResult>;

  // Query Operations
  getOrders(input: GetOrdersInput): Promise<FulfillmentToolResult<{ orders: Order[] }>>;
  getInventory(input: GetInventoryInput): Promise<FulfillmentToolResult<{ inventory: InventoryItem[] }>>;
  getProducts(input: GetProductsInput): Promise<FulfillmentToolResult<{ products: Product[] }>>;
  getProductVariants(
    input: GetProductVariantsInput
  ): Promise<FulfillmentToolResult<{ productVariants: ProductVariant[] }>>;
  getCustomers(input: GetCustomersInput): Promise<FulfillmentToolResult<{ customers: Customer[] }>>;
  getFulfillments(input: GetFulfillmentsInput): Promise<FulfillmentToolResult<{ fulfillments: Fulfillment[] }>>;
  getReturns(input: GetReturnsInput): Promise<FulfillmentToolResult<{ returns: Return[] }>>;
}

// Adapter factory type
export type AdapterConstructor = new (config: AdapterConfig) => IFulfillmentAdapter;

export interface AdapterCapabilities {
  supportsOrderCapture: boolean;
  supportsShipping: boolean;
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

export class InvalidInputError extends AdapterError {
  constructor(message: string, details?: any) {
    super(message, 'INVALID_INPUT', details);
  }
}

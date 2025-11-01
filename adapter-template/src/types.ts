/**
 * Custom types for YourFulfillment adapter
 * Define any Fulfillment-specific types that are not part of the standard onX types
 */

// Configuration options for the adapter
export interface AdapterOptions {
  apiUrl: string;
  apiKey: string;
  workspace?: string;
  timeout?: number;
  retryAttempts?: number;
  debugMode?: boolean;
}

// Example: Your Fulfillment API response format
export interface YourFulfillmentApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

// Example: Your Fulfillment-specific order format
export interface YourFulfillmentOrder {
  id: string;
  number: string;
  external_id: string;
  status: string;
  customer: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
  };
  items: YourFulfillmentOrderItem[];
  total: number;
  currency: string;
  created_at: string;
  updated_at: string;
  shipping_address?: YourFulfillmentAddress;
  billing_address?: YourFulfillmentAddress;
  metadata?: Record<string, any>;
}

export interface YourFulfillmentOrderItem {
  sku: string;
  name: string;
  quantity: number;
  price: number;
  discount?: number;
  tax?: number;
  subtotal: number;
}

export interface YourFulfillmentAddress {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
  email?: string;
  name?: string;
  company?: string;
}

// Example: Your Fulfillment-specific product format
export interface YourFulfillmentProduct {
  id: string;
  sku: string;
  name: string;
  description?: string;
  price: number;
  inventory: number;
  status: 'active' | 'inactive' | 'archived';
  created_at: string;
  updated_at: string;
  attributes?: Record<string, any>;
}

// Example: Your Fulfillment-specific inventory format
export interface YourFulfillmentInventory {
  sku: string;
  available: number;
  reserved: number;
  total: number;
  warehouse_locations?: {
    location_id: string;
    available: number;
    reserved: number;
  }[];
  updated_at: string;
}

// Example: Your Fulfillment-specific customer format
export interface YourFulfillmentCustomer {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  addresses?: YourFulfillmentAddress[];
  tags?: string[];
  metadata?: Record<string, any>;
}

// Example: Your Fulfillment-specific shipment format
export interface YourFulfillmentShipment {
  id: string;
  order_id: string;
  tracking_number: string;
  carrier: string;
  service: string;
  status: string;
  shipped_at?: string;
  delivered_at?: string;
  tracking_url?: string;
  items: {
    sku: string;
    quantity: number;
  }[];
  from_address?: YourFulfillmentAddress;
  to_address?: YourFulfillmentAddress;
}

// Status mapping configuration
export const STATUS_MAP: Record<string, string> = {
  new: 'pending',
  processing: 'processing',
  shipped: 'shipped',
  delivered: 'delivered',
  cancelled: 'cancelled',
  on_hold: 'on_hold',
  refunded: 'refunded',
  partially_shipped: 'partially_shipped',
  partially_delivered: 'partially_delivered',
};

// Error codes for consistent error handling
export enum ErrorCode {
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  INVALID_REQUEST = 'INVALID_REQUEST',
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND',
  CUSTOMER_NOT_FOUND = 'CUSTOMER_NOT_FOUND',
  INSUFFICIENT_INVENTORY = 'INSUFFICIENT_INVENTORY',
  INVALID_ORDER_STATE = 'INVALID_ORDER_STATE',
  API_ERROR = 'API_ERROR',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

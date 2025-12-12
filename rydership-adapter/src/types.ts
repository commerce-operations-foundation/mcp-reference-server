/**
 * Custom types for Rydership adapter
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
export interface RydershipApiResponse<T = any> {
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

export interface RydershipOrder {
  customer_id: string;
  id: string;
  order_orig?: string;
  status: number;
  order_items: RydershipOrderItem[];
  created_at: string;
  updated_at: string;
  first_name?: string; // the first name of the person the order is being shipped to
  last_name?: string; // the last name of the person the order is being shipped to
  full_name?: string; // the full name of the person the order is being shipped to
  shipping_name?: string; // the order shipping name
  shipping_company?: string; // the order shipping company
  shipping_address_1: string; // the order shipping street address 1
  shipping_address_2?: string; // the order shipping street address 2
  shipping_city: string; // the order shipping city
  shipping_state?: string; // the order shipping state
  shipping_zip?: string; // the order shipping zip
  shipping_country?: string; // the order shipping country
  shipping_country_iso2: string; // the order shipping country iso2 (US, GB, CA, etc)
  shipping_phone?: string; // the order shipping phone number
  metadata?: Record<string, any>;
  originator: RydershipOriginator;
}

export interface RydershipOrderItem {
  id: string;
  order_id: string;
  sku: string;
  name: string;
  quantity: number;
  price: number;
  discount?: number;
  tax?: number;
  subtotal: number;
}

export interface RydershipOriginator {
  id: number; // the originator id
  originated_id: number; // the id of the object created by the originator
  originated_type: string; // the type of object created by the originator
  shop_id?: number; // the originator shop id
  provider?: string; // the originator provider (shopify, magento, bandcamp, etc)
  original_id?: string; // the originator original id (from the provider)
  group_id?: string; // the originator group id
  misc?: string; // miscellaneous info for the originator
  active: boolean; // is the originator active?
  integration_id?: number; // the originator integration id
  created_at: string; // the originator creation date and time (ISO string)
  updated_at: string; // the originator last update date and time (ISO string)
  application_id?: number; // the id of the oauth application
}

export interface RydershipAddress {
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
export interface RydershipProduct {
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
export interface RydershipInventory {
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
export interface RydershipCustomer {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  addresses?: RydershipAddress[];
  tags?: string[];
  metadata?: Record<string, any>;
}

// Example: Your Fulfillment-specific shipment format
export interface RydershipShipment {
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
  from_address?: RydershipAddress;
  to_address?: RydershipAddress;
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

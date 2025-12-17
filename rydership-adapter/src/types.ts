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
  id: number;
  customer_id: number;
  order_batch_id?: number;
  quote_id?: number;
  warehouse_id?: number;
  return_warehouse_id?: number;
  shipping_method_id?: number;
  estimated_shipping_method_id?: number;
  humanize_id?: string;
  status: number;
  status_name?: string;
  previous_status?: number;
  order_orig?: string;
  package_label_reference?: string;
  level1_token?: string;
  level2_token?: string;
  workable_at?: string;
  skip_street_date?: boolean;
  due_at?: string;
  created_at: string;
  updated_at: string;
  meta_data?: Record<string, any>;
  customer_provided_label_carrier?: string;
  purchase_order?: string;
  order_type?: string;
  batch_priority?: boolean;
  email?: string;
  address_verified?: boolean;
  items_updateable?: boolean;
  address_message?: string;
  scac?: string;
  shop_warehouse_ids?: number[];
  shop_shipping_method_currency?: string;
  shop_created_at?: string;
  shop_updated_at?: string;
  shop_shipping_method_text?: string;
  shop_shipping_method_price?: string;
  billed?: boolean;
  billing_name?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  shipping_name?: string;
  shipping_company?: string;
  shipping_address_1: string;
  shipping_address_2?: string;
  shipping_city: string;
  shipping_state?: string;
  shipping_zip?: string;
  shipping_country?: string;
  shipping_country_iso2: string;
  shipping_phone?: string;
  requested_address?: string;
  residential?: boolean;
  expedited?: boolean;
  require_signature?: boolean;
  require_adult_signature?: boolean;
  saturday_delivery?: boolean;
  gift?: boolean;
  insure?: boolean;
  contains_alcohol?: boolean;
  customs_required?: boolean;
  incoterm?: string;
  shipping_carrier_facility?: string;
  shipping_hold_for_pickup?: boolean;
  ship_actual_cost?: string;
  shipped_on?: string;
  ship_notes?: string;
  shipping_confirmation_sent?: boolean;
  ship_3rdparty_cost?: string;
  ship_3rdparty_account?: string;
  ship_3rdparty_zip?: string;
  ship_3rdparty_country?: string;
  public_note?: string;
  days_in_transit?: number;
  days_in_transit_carrier_estimate?: number;
  req_insurance_value?: string;
  ship_method?: string;
  packingslip_pdf_url?: string;
  cf_packingslip_pdf_url?: string;
  customs_vat_number?: string;
  customs_eori_number?: string;
  customs_ioss_number?: string;
  customs_receiver_tax_id?: string;
  tracking?: any[];
  tracking_links?: any[];
  approximate_delivery_date?: string;
  global_e_ge_order?: boolean;
  calculated_time_limit?: number;
  within_return_time_limit?: boolean;
  return_address_verified?: boolean;
  return_time_limit?: string;
  is_workable?: boolean;
  is_gestating?: boolean;
  permissions_limited?: boolean;
  order_items?: RydershipOrderItem[];
  originator: RydershipOriginator;
  proto_originator_id?: number;
  // packages?: any[];
  shipping_method?: any;
  serial_numbers?: any[];
}

export interface RydershipOrderItem {
  id: number; // the order item id
  order_id: number; // the order item order id
  customer_id: number; // the order item customer id
  item_id: number; // the order item item id
  package_id?: number; // the order item package id
  quote_item_id?: number; // the order item quote item id
  sku: string; // the SKU of this item
  description?: string; // description for this order item
  quantity: number; // number of this item in Order
  price?: number; // price of this item
  created_at: string; // the order item creation date and time (ISO string)
  updated_at: string; // the order item last update date and time (ISO string)
  unshippable?: boolean; // is this item unshippable?
  available?: boolean; // is this item available?
  packed?: number; // number of items packed
  packaging?: boolean; // is this item packaging?
  wholesale_cost?: number; // wholesale cost of the item
  is_bundle?: boolean; // is this item a bundle?
  retail_fee?: number; // retail fee of this item
  promo?: boolean; // is this item a promo?
  returnable?: boolean; // is this item returnable?
  currency?: string; // currency code for this item
  wholesale_fee?: number; // wholesale fee of this item
  hazmat?: boolean; // (deprecated) is the order item hazmat?
  misc?: string; // miscellaneous information about the order item
  request_serial_number?: boolean; // does the item require a serial number when shipping?
  case_quantity?: number; // How many of this item to a case?
  carton_quantity?: number; // How many CASES to a carton?
  goh?: boolean; // Garment on hanger?
  originator?: RydershipOriginator; // nested originator object
  wholesale_item?: any; // nested wholesale item object, define interface if needed
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

export interface RydershipProductVariant {
  id: number; // the item id
  sku?: string; // the item SKU number
  title?: string; // the item title
  description?: string; // the item description
  full_description?: string; // the full item description
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  customer_id: number; // the id of the customer the item belongs to
  quantity?: number; // the available quantity of the item
  weight?: number; // the weight of the item (in pounds)
  available?: boolean; // is the item available?
  image_originator_url?: string; // the originator url for the item image
  vendor?: string; // the item vendor
  scancode?: string; // the item scancode
  price?: number; // the item price
  media_mail?: boolean; // is the item eligible for media mail?
  packaging?: boolean; // is the item packaging?
  length?: number; // the item length (in inches)
  width?: number; // the item width (in inches)
  height?: number; // the item height (in inches)
  active?: boolean; // is the item active?
  wholesale_cost?: number; // the wholesale cost of the item
  is_bundle?: boolean; // is the item a bundle?
  packaging_type?: string; // the item packaging type
  promo?: boolean; // is the item a promo?
  street_date?: string; // ISO date string
  category?: string; // the item category
  include_inbound_in_published?: boolean; // include inbound items in published?
  returnable?: boolean; // is the item returnable?
  return_sku_match?: string; // the item return SKU match
  return_price_restricted?: boolean; // is the item return price restricted?
  request_serial_number?: boolean; // does the item require a serial number when shipping?
  currency?: string; // the item currency
  tariff_number?: string; // the item harmonized tariff number
  notify_originator_inventory?: number; // notify originator inventory?
  name?: string; // the item name and description, formatted nicely
  nmfc_code?: string; // National Motor Freight Classification code
  nmfc_class?: string; // National Motor Freight Classification class code
  commodity_description?: string; // the item commodity description
  image_url?: string; // the item image url
  hazmat?: boolean; // (deprecated) is the item hazmat?
  hazmat_type?: string; // hazmat class
  misc?: string; // miscellaneous information about the item
  ean?: string; // the EAN number for the item
  lot_control?: boolean; // does this item require lot control?
  expiration_period?: number; // days from expiration not allowed to ship
  ship_strategy?: number; // which locations to pick first
  velocity?: number; // average number of units expected to sell in a day
  case_quantity?: number; // how many of this item to a case
  carton_quantity?: number; // how many cases to a carton
  origin_country?: string; // country of origin (iso2)
  alcohol?: boolean; // does this order contain alcohol?
  shippable_container?: boolean; // is this item a shippable container?
  goh?: boolean; // garment on hanger?
  label_format?: string; // label format
  replenishment_min?: number; // minimum days of stock to keep
  replenishment_target?: number; // target days of stock to replenish
  low_inventory_threshold?: number; // item quantity for low inventory
  published_quantity?: number; // item quantity, including inbound items
}

export type RydershipProduct = RydershipProductVariant;

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
// We don't store Customer objects in Ryderhip
// If used, this just maps to basic info from orders
export interface RydershipCustomer {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
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
export const STATUS_MAP: Record<number, string> = {
  30: "Shipped Externally",
  35: "Quote",
  40: "Cancelled",
  45: "Closed by Originator",
  50: "Unpaid",
  75: "Pending Return",
  77: "Return Verified",
  80: "Pre-Order",
  90: "Paused",
  95: "Insufficient Inventory",
  100: "Processing",
  120: "Printed",
  140: "Pending Pick Confirmation",
  150: "Picked",
  155: "Prepacking in Progress",
  160: "Packed",
  200: "Label Scheduled for Purchase",
  250: "Label Purchased",
  300: "Shipped",
  325: "Picked Up",
  350: "Delivered",
  375: "Return Expired",
  380: "Replacement Cancelled",
  400: "Returned Undeliverable",
  410: "Replacement Requested",
  430: "Exchanged",
  450: "Refund Requested"
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

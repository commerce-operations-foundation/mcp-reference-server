/**
 * Fulfillment Domain type definitions
 * These types match the JSON schemas in the schemas/ directory
 */

// Order types - based on schemas/order.json
export interface Order {
  orderId?: string;
  extOrderId: string; // required
  status?: string;
  additionalCharges?: object[];
  billingAddress?: OrderAddress;
  currency?: string;
  customFields?: CustomField[];
  customer?: OrderCustomer;
  customerPONumber?: string | null;
  disableShipmentsReuse?: boolean;
  discounts?: object[];
  disposition?: OrderDisposition[];
  dispositions?: OrderDispositionDetail[];
  exceptionCategories?: string[];
  exceptions?: string[];
  expectedDeliveryDate?: string; // date-time
  extOrderApiId?: string;
  extOrderCreatedAt?: string; // date-time
  extOrderUpdatedAt?: string; // date-time
  extOrderUrl?: string;
  fulfillmentStatus?: string;
  giftNote?: string;
  holdUntil?: string; // date-time
  incoterms?: string;
  integration?: string;
  internal?: object;
  isMultiAddress?: boolean;
  isMultiDestination?: boolean;
  lastRoutedAt?: string; // date-time
  lineItems?: OrderLineItem[];
  locationId?: string;
  orderDiscount?: number;
  orderNote?: string;
  orderSource?: string;
  orderSourceType?: string;
  orderTax?: number;
  paymentStatus?: string;
  paymentTerms?: object;
  payments?: object[];
  preferredLocationGroupId?: string[];
  privacyPolicy?: object[];
  refunds?: object[];
  replacementOrderId?: string;
  replacementReason?: object;
  requireShippingLabels?: boolean;
  respectLocationId?: boolean;
  routingStatus?: object;
  shipAfterDate?: string; // date-time
  shipByDate?: string; // date-time
  shipCancelByDate?: string; // date-time
  shippingAddress?: OrderAddress;
  shippingCarrier?: string;
  shippingClass?: string;
  shippingCode?: string;
  shippingDestinations?: object[];
  shippingNote?: string;
  shippingPrice?: number;
  sourceDoc?: object;
  subTotalPrice?: number;
  tags?: object;
  timestamp?: string; // date-time
  totalPrice?: number;
  createdAt?: string; // date-time, readOnly
  orgKey?: string; // readOnly
  updatedAt?: string; // date-time, readOnly
}

export type OrderDisposition = 
  | 'partiallyRouted'
  | 'routed'
  | 'partiallySent'
  | 'sent'
  | 'partiallyFulfilled'
  | 'fulfilled'
  | 'partiallyCanceled'
  | 'canceled'
  | 'partiallyFailed'
  | 'failed'
  | 'partiallyRejected'
  | 'rejected'
  | 'partiallyUnrouted'
  | 'unrouted'
  | 'partiallyUnsent'
  | 'unsent'
  | 'partiallyUnfulfilled'
  | 'unfulfilled';

export interface OrderDispositionDetail {
  uniqueId: string;
  values: {
    type: string;
    quantity: number;
  }[];
}

export interface OrderLineItem {
  lineItemId: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  name?: string;
  customFields?: CustomField[];
  canceled?: number;
  fulfillable?: number;
  fulfilled?: number;
  ordered?: number;
}

export interface OrderAddress {
  address1?: string;
  address2?: string;
  city?: string;
  company?: string;
  country?: string; // ISO 2 letter code only
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  stateOrProvince?: string; // If within the US, required 2 letter State Code
  zipCodeOrPostalCode?: string;
}

export interface OrderCustomer {
  company?: string;
  customerId?: string;
  extCompanyCustomerId?: string;
  extCustomerId?: string;
  extLocationCustomerId?: string;
  firstName?: string;
  lastName?: string;
  type?: 'individual' | 'company';
}

export interface CustomField {
  name: string;
  value: string;
}

// Customer types - based on schemas/customer.json
export interface Customer {
  customerId?: string;
  addresses?: CustomerAddress[];
  billingAddress?: CustomerAddress;
  catalogIds?: string[];
  checkoutSettings?: CustomerCheckoutSettings;
  company?: string;
  customFields?: CustomerCustomField[];
  displayName?: string;
  email?: string;
  exceptionCategories?: string[];
  exceptions?: string[];
  extCustomerId?: string;
  firstName?: string;
  internal?: object;
  lastName?: string;
  linkedCustomers?: LinkedCustomer[];
  notes?: string;
  paymentTerms?: CustomerPaymentTerms;
  phone?: string;
  shippingAddress?: CustomerAddress;
  sourceDoc?: object;
  status?: 'active' | 'inactive' | 'deleted';
  tags?: object;
  taxOptions?: object;
  type?: string;
  createdAt?: string; // date-time, readOnly
  orgKey?: string; // readOnly
  updatedAt?: string; // date-time, readOnly
}

export interface CustomerAddress {
  address1?: string;
  address2?: string;
  city?: string;
  country?: string;
  email?: string;
  phone?: string;
  stateOrProvince?: string;
  zipCodeOrPostalCode?: string;
  type?: 'billing' | 'shipping' | 'other';
}

export interface CustomerCheckoutSettings {
  checkoutToDraft?: boolean;
  editableShippingAddress?: boolean;
  payNowOnly?: boolean;
}

export interface CustomerCustomField {
  compliance?: 'none' | 'pii' | 'pci' | 'hippa';
  name?: string;
  value?: string;
}

export interface LinkedCustomer {
  customerId: string; // required
  roles: CustomerRole[]; // required
}

export type CustomerRole = 'main_contact' | 'allow_ordering' | 'admin' | 'assigned';

export interface CustomerPaymentTerms {
  term: 'net' | 'fixed' | 'fulfillment' | 'receipt' | 'unknown' | 'other'; // required
  depositPercentage?: number;
  dueInDays?: number;
  note?: string;
}

// Product types - based on schemas/product.json
export interface Product {
  productId?: string;
  sku: string; // required
  name: string; // required
  bundleItems?: BundleItem[];
  cost?: number;
  costCurrency?: string;
  countryOfOrigin?: string;
  customFields?: CustomField[];
  description?: string;
  dimensionsUnit?: 'cm' | 'in' | 'ft';
  exceptionCategories?: string[];
  exceptions?: string[];
  extProductApiId?: string;
  extProductCreatedAt?: string; // date-time
  extProductId?: string;
  extProductUpdatedAt?: string; // date-time
  harmonizedCode?: string;
  height?: number;
  hideInStore?: boolean;
  imageURLs?: string[];
  integration?: string;
  internal?: object;
  inventoryNotTracked?: boolean;
  length?: number;
  mappedProduct?: MappedProduct;
  parentExtProductId?: string;
  partId?: string;
  prices?: object[];
  published?: PublishedChannel[];
  sourceDoc?: object;
  status?: string;
  tags?: object;
  taxable?: boolean;
  types?: string[];
  upc?: string;
  variantOptions?: VariantOption[];
  vendor?: string;
  weight?: number;
  weightUnit?: 'lb' | 'oz' | 'kg' | 'g';
  width?: number;
  createdAt?: string; // date-time, readOnly
  orgKey?: string; // readOnly
  updatedAt?: string; // date-time, readOnly
}

export interface BundleItem {
  sku: string; // required
  quantity: number; // required
  updatedAt?: string; // date-time
  updatedBy?: string;
}

export interface MappedProduct {
  integrationId?: string;
  bufferInventory?: number; // int32
  customFields?: CustomField[];
  extProductId?: string;
  inventoryNotTracked?: boolean;
  name?: string;
  sku?: string;
  status?: 'tobepublished' | 'published' | 'tobeunpublished' | 'unpublished' | 'disabled';
  updatedAt?: string; // date-time
  updatedBy?: string;
}

export interface PublishedChannel {
  integrationId: string; // required
  bufferInventory?: number; // int32
  customFields?: CustomField[];
  extProductId?: string;
  inventoryNotTracked?: boolean;
  name?: string;
  sku?: string;
  status?: 'tobepublished' | 'published' | 'tobeunpublished' | 'unpublished' | 'disabled';
  updatedAt?: string; // date-time
  updatedBy?: string;
}

export interface VariantOption {
  name?: string;
  value?: string;
}


// Inventory types - based on schemas/inventory.json
export interface Inventory {
  inventoryId?: string;
  available?: number; // int32
  reserved?: number; // int32 - Added for compatibility with services
  availableToPromise?: number; // int32
  commitShip?: number; // int32
  commitXfer?: number; // int32
  committed?: number; // int32
  committedFuture?: number; // int32
  customFields?: CustomField[];
  damaged?: number; // int32
  entityId?: string;
  entityType?: string;
  event?: string;
  future?: number; // int32
  hold?: number; // int32
  incoming?: number; // int32
  integration?: string;
  internal?: object;
  inventoryNotTracked?: boolean;
  label?: string;
  locationId?: string;
  onHand?: number; // int32
  orderId?: string;
  orderType?: string;
  quantity?: number; // int32
  sku?: string;
  tags?: object;
  type?: 'virtual' | 'physical';
  unavailable?: number; // int32
  user?: string;
  vendorSKU?: string;
  createdAt?: string; // date-time, readOnly
  orgKey?: string; // readOnly
  updatedAt?: string; // date-time, readOnly
}


// Shipment types - based on schemas/shipment.json
export interface Shipment {
  shipmentId?: string;
  extOrderId: string; // required
  shippingAddress: OrderAddress; // required
  extOrderApiId?: string;
  extShipmentId?: string;
  extReferenceId?: string;
  extReferenceUrl?: string;
  canceledAt?: string; // date-time
  canceledBy?: string;
  canceledByType?: 'user' | 'integration' | 'apikey';
  cancellationStatus?: string;
  currency?: string;
  customFields?: CustomField[];
  excludeFromReuse?: boolean;
  exceptionCategories?: string[];
  exceptions?: string[];
  expectedDeliveryDate?: string; // date-time
  expectedShipDate?: string; // date-time
  fulfillmentIntegrationId?: string;
  giftNote?: string;
  holdUntil?: string; // date-time
  incoterms?: string;
  integration?: string;
  internal?: object;
  lineItems?: object[];
  locationId?: string;
  orderCreateTime?: string; // date-time
  orderId?: string;
  orderIntegration?: string;
  orderSource?: string;
  orderSourceType?: string;
  orderType?: string;
  overfulfillPolicy?: object;
  privacyPolicy?: object[];
  reused?: boolean;
  sentToFulfillmentAt?: string; // date-time
  shipAfterDate?: string; // date-time
  shipByDate?: string; // date-time
  shipCancelByDate?: string; // date-time
  shippingCarrier?: string;
  shippingClass?: string;
  shippingCode?: string;
  shippingLabels?: string[];
  shippingMethodMapping?: boolean;
  shippingNote?: string;
  shippingPrice?: number;
  skipLocation?: boolean;
  sourceDoc?: object;
  status?: string;
  tags?: object;
  timeline?: object[];
  trackingNumber?: string; // Added for compatibility with services
  version?: number;
  createdAt?: string; // date-time, readOnly
  orgKey?: string; // readOnly
  updatedAt?: string; // date-time, readOnly
}


// Buyer types - based on schemas/buyer.json (User entity schema)
export interface Buyer {
  userId?: string;
  name: string; // required
  email: string; // required
  roles: string[]; // required
  address?: BuyerAddress;
  blockedFeatures?: string[];
  description?: string;
  internal?: object;
  loginInfo?: BuyerLoginInfo;
  methods?: object;
  phone?: string;
  status?: 'pending' | 'active' | 'disabled';
  timeZone?: string;
  createdAt?: string; // date-time, readOnly
  orgKey?: string; // readOnly
  updatedAt?: string; // date-time, readOnly
}

export interface BuyerAddress {
  address1?: string;
  address2?: string;
  city?: string;
  company?: string;
  country?: string;
  firstName?: string;
  lastName?: string;
  stateOrProvince?: string;
  zipCodeOrPostalCode?: string;
}

export interface BuyerLoginInfo {
  lastIPAddress?: string;
  lastLogin?: string; // date-time
  loginsCount?: number;
}


// Identifier types for queries
export interface OrderIdentifier {
  orderId?: string;
  extOrderId?: string;
  orderNumber?: string;
}

export interface ProductIdentifier {
  productId?: string;
  sku?: string;
}

export interface CustomerIdentifier {
  customerId?: string;
  email?: string;
}

export interface ShipmentIdentifier {
  shipmentId?: string;
  orderId?: string;
  trackingNumber?: string;
}

// Tool parameter types
export interface HoldParams {
  reason: string;
  notes?: string;
  autoRelease?: boolean;
  releaseDate?: string;
}

// Alias for compatibility
export type HoldRequest = HoldParams;

export interface SplitParams {
  locationId?: string;
  items?: SplitItem[];
  reason?: string;
}

// Alias for compatibility
export type SplitRequest = SplitParams;

export interface SplitItem {
  lineItemId: string;
  quantity: number;
}

export interface InventoryItem {
  sku: string;
  quantity: number;
  locationId?: string;
}

export interface ReservationItem {
  sku: string;
  quantity: number;
  locationId?: string;
  reservationId?: string;
}

export interface ReturnItem {
  lineItemId: string;
  quantity: number;
  reason: string;
  condition?: 'new' | 'damaged' | 'defective' | 'opened';
}

export interface ExchangeParams {
  orderId: string;
  returnItems: ReturnItem[];
  newItems: OrderLineItem[];
  reason: string;
}

export interface OrderUpdates {
  customer?: Partial<OrderCustomer>;
  billingAddress?: OrderAddress;
  shippingAddress?: OrderAddress;
  lineItems?: OrderLineItem[];
  customFields?: CustomField[];
  status?: string;
  notes?: string;
}

export interface ShippingInfo {
  carrier: string;
  service: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  cost?: number;
}

// Request types for tool operations
export interface OrderRequest {
  extOrderId: string; // required per schema
  customer?: Partial<OrderCustomer>;
  lineItems?: OrderLineItem[]; // Changed from 'items' to match schema
  billingAddress?: OrderAddress;
  shippingAddress?: OrderAddress;
  currency?: string;
  customFields?: CustomField[];
  // Additional schema fields
  additionalCharges?: object[];
  customerPONumber?: string | null;
  disableShipmentsReuse?: boolean;
  discounts?: object[];
  expectedDeliveryDate?: string; // date-time
  fulfillmentStatus?: string;
  giftNote?: string;
  incoterms?: string;
  isMultiAddress?: boolean;
  isMultiDestination?: boolean;
  locationId?: string;
  orderDiscount?: number;
  orderNote?: string;
  orderSource?: string;
  orderSourceType?: string;
  orderTax?: number;
  paymentStatus?: string;
  paymentTerms?: object;
  payments?: object[];
  preferredLocationGroupId?: string[];
  privacyPolicy?: object[];
  refunds?: object[];
  shipAfterDate?: string; // date-time
  shipByDate?: string; // date-time
  shipCancelByDate?: string; // date-time
  shippingCarrier?: string;
  shippingClass?: string;
  shippingCode?: string;
  shippingNote?: string;
  shippingPrice?: number;
  subTotalPrice?: number;
  tags?: object;
  totalPrice?: number;
}

export interface CancelOrderRequest {
  orderId: string;
  reason?: string;
}

export interface UpdateOrderRequest {
  orderId: string;
  updates: OrderUpdates;
}

export interface ReturnOrderRequest {
  orderId: string;
  items: ReturnItem[];
}

export interface ShipOrderRequest {
  orderId: string;
  shipping: ShippingInfo;
}

export interface HoldOrderRequest {
  orderId: string;
  holdParams: HoldParams;
}

export interface SplitOrderRequest {
  orderId: string;
  splits: SplitParams[];
}

export interface ReserveInventoryRequest {
  items: InventoryItem[];
  duration?: number;
}
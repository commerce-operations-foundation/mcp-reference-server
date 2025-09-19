export interface Order {
    orderId?: string;
    extOrderId: string;
    status?: string;
    customer?: OrderCustomer;
    lineItems?: OrderLineItem[];
    shippingAddress?: OrderAddress;
    billingAddress?: OrderAddress;
    totalPrice?: number;
    currency?: string;
    orderNote?: string;
    orderSource?: string;
    createdAt?: string;
    updatedAt?: string;
    [key: string]: any;
}
export interface OrderRequest extends Order {
}
export interface OrderCustomer {
    customerId?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
}
export interface OrderLineItem {
    sku: string;
    name?: string;
    quantity: number;
    price: number;
    discount?: number;
    tax?: number;
    subtotal?: number;
}
export interface OrderAddress {
    firstName?: string;
    lastName?: string;
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    phone?: string;
    email?: string;
    company?: string;
}
export interface OrderUpdates {
    status?: string;
    shippingAddress?: OrderAddress;
    billingAddress?: OrderAddress;
    notes?: string;
    tags?: string[];
    [key: string]: any;
}
export interface Customer {
    customerId?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    addresses?: any[];
    tags?: string[];
    metadata?: Record<string, any>;
    createdAt?: string;
    updatedAt?: string;
}
export interface Product {
    productId?: string;
    sku?: string;
    name?: string;
    description?: string;
    price?: number;
    status?: string;
    inventory?: number;
    attributes?: Record<string, any>;
    createdAt?: string;
    updatedAt?: string;
}
export interface Inventory {
    sku: string;
    available: number;
    reserved: number;
    total: number;
    locations?: {
        locationId: string;
        available: number;
        reserved: number;
    }[];
    lastUpdated?: string;
}
export interface Shipment {
    shipmentId?: string;
    orderId?: string;
    trackingNumber?: string;
    carrier?: string;
    service?: string;
    status?: string;
    shippedAt?: string;
    deliveredAt?: string;
    trackingUrl?: string;
    items?: any[];
    fromAddress?: OrderAddress;
    toAddress?: OrderAddress;
}
export interface Buyer {
    buyerId: string;
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    type?: string;
    status?: string;
    metadata?: Record<string, any>;
    createdAt?: string;
    updatedAt?: string;
}
export interface OrderIdentifier {
    orderId?: string;
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
    trackingNumber?: string;
}
export interface HoldParams {
    reason: string;
    until?: string;
    autoRelease?: boolean;
    notes?: string;
}
export interface SplitParams {
    items: any[];
    warehouse?: string;
    shipDate?: string;
}
export interface InventoryItem {
    sku: string;
    quantity: number;
    locationId?: string;
}
export interface ReturnItem {
    sku: string;
    quantity: number;
    reason?: string;
    condition?: string;
}
export interface ExchangeParams {
    orderId: string;
    returnItems: any[];
    newItems: any[];
    reason?: string;
}
export interface ShippingInfo {
    carrier: string;
    service: string;
    trackingNumber?: string;
    items?: any[];
}
//# sourceMappingURL=fulfillment.d.ts.map
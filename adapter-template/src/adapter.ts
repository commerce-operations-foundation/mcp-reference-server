/**
 * YourFulfillment Adapter Implementation
 *
 * This is a template adapter that implements the IFulfillmentAdapter interface.
 * Customize this file to integrate with your specific Fulfillment system.
 */

// Import types from the MCP server package
// When developing locally, you may need to:
// 1. Use relative imports to the server's dist/types directory
// 2. Or copy the type definitions to your adapter project
// 3. Or wait for @cof-org/mcp to be published to NPM

// For NPM-published adapters:
// import type {
//   IFulfillmentAdapter,
//   AdapterConfig,
//   HealthStatus,
//   OrderResult,
//   // ... other types
// } from '@cof-org/mcp/dist/types/adapter';

// For local development, use relative imports or copy types:
import {
  IFulfillmentAdapter,
  HealthStatus,
  OrderResult,
  CancelResult,
  UpdateResult,
  ReturnResult,
  ExchangeResult,
  ShipmentResult,
  HoldResult,
  SplitResult,
  ReservationResult,
  ReservationRequest,
  AdapterError,
  OrderNotFoundError,
  ProductNotFoundError,
  CustomerNotFoundError,
  InsufficientInventoryError,
  InvalidOrderStateError,
  AdapterCapabilities,
  AdapterConfig,
} from './mocks/types/adapter.js';

import {
  Order,
  OrderRequest,
  OrderUpdates,
  Customer,
  Product,
  Inventory,
  Shipment,
  Buyer,
  OrderIdentifier,
  ProductIdentifier,
  CustomerIdentifier,
  ShipmentIdentifier,
  ShippingInfo,
  ExchangeParams,
  ReturnItem,
} from './mocks/types/fulfillment.js';

import { ApiClient } from './utils/api-client.js';
import {
  AdapterOptions,
  YourFulfillmentOrder,
  YourFulfillmentProduct,
  YourFulfillmentCustomer,
  YourFulfillmentInventory,
  YourFulfillmentShipment,
  STATUS_MAP,
  ErrorCode,
} from './types.js';
import { getErrorMessage } from './utils/type-guards.js';

export class YourFulfillmentAdapter implements IFulfillmentAdapter {
  private client: ApiClient;
  private connected: boolean = false;
  private options: AdapterOptions;

  constructor(config: any = {}) {
    // Extract options from AdapterConfig if present (matches mock adapter pattern)
    const options = config.options || config;

    // Ensure we have the required options with defaults
    this.options = {
      apiUrl: options.apiUrl || 'https://api.yourfulfillment.com',
      apiKey: options.apiKey || '',
      workspace: options.workspace,
      timeout: options.timeout || 30000,
      retryAttempts: options.retryAttempts || 3,
      debugMode: options.debugMode || false,
    };

    // Initialize API client
    this.client = new ApiClient({
      baseUrl: this.options.apiUrl,
      apiKey: this.options.apiKey,
      timeout: this.options.timeout,
      retryAttempts: this.options.retryAttempts || 3,
      debugMode: this.options.debugMode || false,
    });
  }
  initialize?(config: AdapterConfig): Promise<void> {
    throw new Error('Method not implemented.');
  }
  cleanup?(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  checkHealth?(): Promise<HealthStatus> {
    throw new Error('Method not implemented.');
  }
  getCapabilities?(): Promise<AdapterCapabilities> {
    throw new Error('Method not implemented.');
  }
  updateConfig?(config: AdapterConfig): Promise<void> {
    throw new Error('Method not implemented.');
  }
  returnOrder(orderId: string, items: ReturnItem[]): Promise<ReturnResult> {
    throw new Error('Method not implemented.');
  }
  exchangeOrder(params: ExchangeParams): Promise<ExchangeResult> {
    throw new Error('Method not implemented.');
  }
  releaseReservation?(reservationId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  adjustInventory?(sku: string, adjustment: number, reason: string, locationId?: string): Promise<Inventory> {
    throw new Error('Method not implemented.');
  }
  transferInventory?(
    sku: string,
    quantity: number,
    fromLocationId: string,
    toLocationId: string,
    reason?: string
  ): Promise<{ from: Inventory; to: Inventory }> {
    throw new Error('Method not implemented.');
  }
  searchOrders?(filters: any): Promise<{ orders: Order[]; total: number }> {
    throw new Error('Method not implemented.');
  }
  searchProducts?(filters: any): Promise<{ products: Product[]; total: number }> {
    throw new Error('Method not implemented.');
  }
  getCustomerOrders?(
    customerId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{ orders: Order[]; total: number }> {
    throw new Error('Method not implemented.');
  }

  // ==================== Lifecycle Methods ====================

  async connect(): Promise<void> {
    try {
      // Test connection to your Fulfillment API
      const response = await this.client.get('/health');

      if (!response.success) {
        throw new AdapterError('Failed to connect to YourFulfillment', ErrorCode.CONNECTION_FAILED, response);
      }

      this.connected = true;
      console.info('Successfully connected to YourFulfillment');
    } catch (error: unknown) {
      this.connected = false;
      throw new AdapterError(`Connection failed: ${getErrorMessage(error)}`, ErrorCode.CONNECTION_FAILED, error);
    }
  }

  async disconnect(): Promise<void> {
    try {
      // Perform any cleanup operations if needed
      // For example: close websocket connections, clear caches, etc.

      this.connected = false;
      console.info('Disconnected from YourFulfillment');
    } catch (error: unknown) {
      throw new AdapterError(`Disconnect failed: ${getErrorMessage(error)}`, ErrorCode.UNKNOWN_ERROR, error);
    }
  }

  async healthCheck(): Promise<HealthStatus> {
    try {
      const response = await this.client.get('/health');

      return {
        status: response.success ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: [
          {
            name: 'api_connection',
            status: response.success ? 'pass' : 'fail',
            message: response.success ? 'API is reachable' : 'API connection failed',
          },
          {
            name: 'authentication',
            status: this.connected ? 'pass' : 'fail',
            message: this.connected ? 'Authenticated' : 'Not authenticated',
          },
        ],
        version: '1.0.0',
      };
    } catch (error: unknown) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: [
          {
            name: 'api_connection',
            status: 'fail',
            message: `Health check failed: ${getErrorMessage(error)}`,
          },
        ],
      };
    }
  }

  // ==================== Order Actions ====================

  async captureOrder(params: OrderRequest): Promise<OrderResult> {
    try {
      // Transform UOIS order format to your Fulfillment format
      const fulfillmentOrder = this.transformToFulfillmentOrder(params);

      // Call your Fulfillment API to create the order
      const response = await this.client.post('/orders', fulfillmentOrder);

      if (!response.success) {
        throw new AdapterError('Failed to capture order', ErrorCode.API_ERROR, response.error);
      }

      // Transform response back to UOIS format
      return this.transformToOrderResult(response.data as YourFulfillmentOrder);
    } catch (error: unknown) {
      if (error instanceof AdapterError) {
        throw error;
      }
      throw new AdapterError(`Order capture failed: ${getErrorMessage(error)}`, ErrorCode.UNKNOWN_ERROR, error);
    }
  }

  async cancelOrder(orderId: string, reason?: string): Promise<CancelResult> {
    try {
      // First, get the order to check its current status
      const orderResponse = await this.client.get(`/orders/${orderId}`);

      if (!orderResponse.success) {
        throw new OrderNotFoundError({ orderId });
      }

      const order = orderResponse.data as YourFulfillmentOrder;

      // Check if order can be cancelled
      if (['delivered', 'cancelled'].includes(order.status)) {
        throw new InvalidOrderStateError(orderId, order.status, 'cancel');
      }

      // Cancel the order
      const response = await this.client.post(`/orders/${orderId}/cancel`, {
        reason: reason || 'Customer requested cancellation',
        cancelled_by: 'customer',
        cancelled_at: new Date().toISOString(),
      });

      if (!response.success) {
        throw new AdapterError('Failed to cancel order', ErrorCode.API_ERROR, response.error);
      }

      return {
        success: true,
        orderId,
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        refundInitiated: (response.data as any)?.refund_initiated || false,
        message: `Order ${orderId} cancelled successfully`,
      };
    } catch (error: unknown) {
      if (error instanceof AdapterError) {
        throw error;
      }
      throw new AdapterError(`Order cancellation failed: ${getErrorMessage(error)}`, ErrorCode.UNKNOWN_ERROR, error);
    }
  }

  async updateOrder(orderId: string, updates: OrderUpdates): Promise<UpdateResult> {
    try {
      // Transform updates to your Fulfillment format
      const fulfillmentUpdates = this.transformOrderUpdates(updates);

      // Update the order
      const response = await this.client.patch(`/orders/${orderId}`, fulfillmentUpdates);

      if (!response.success) {
        if (response.error?.code === 'ORDER_NOT_FOUND') {
          throw new OrderNotFoundError({ orderId });
        }
        throw new AdapterError('Failed to update order', ErrorCode.API_ERROR, response.error);
      }

      return {
        success: true,
        orderId,
        updatedFields: Object.keys(updates),
        version: (response.data as any)?.version,
        message: `Order ${orderId} updated successfully`,
      };
    } catch (error: unknown) {
      if (error instanceof AdapterError) {
        throw error;
      }
      throw new AdapterError(`Order update failed: ${getErrorMessage(error)}`, ErrorCode.UNKNOWN_ERROR, error);
    }
  }

  async shipOrder(orderId: string, shipping: ShippingInfo): Promise<ShipmentResult> {
    try {
      // Create shipment
      const response = await this.client.post(`/orders/${orderId}/shipments`, {
        carrier: shipping.carrier,
        service: shipping.service,
        tracking_number: shipping.trackingNumber,
        items: shipping.items,
        shipped_at: new Date().toISOString(),
      });

      if (!response.success) {
        throw new AdapterError('Failed to create shipment', ErrorCode.API_ERROR, response.error);
      }

      return {
        success: true,
        shipmentId: (response.data as any)?.shipment_id,
        trackingNumber: (response.data as any)?.tracking_number,
        carrier: (response.data as any)?.carrier,
        shippedAt: (response.data as any)?.shipped_at,
        trackingUrl: (response.data as any)?.tracking_url,
        estimatedDelivery: (response.data as any)?.estimated_delivery,
        message: `Shipment created for order ${orderId}`,
      };
    } catch (error: unknown) {
      if (error instanceof AdapterError) {
        throw error;
      }
      throw new AdapterError(`Shipment creation failed: ${getErrorMessage(error)}`, ErrorCode.UNKNOWN_ERROR, error);
    }
  }

  // ==================== Management Operations ====================

  async holdOrder(orderId: string, holdParams: HoldParams): Promise<HoldResult> {
    try {
      const response = await this.client.post(`/orders/${orderId}/hold`, {
        reason: holdParams.reason,
        until: holdParams.until,
        auto_release: holdParams.autoRelease,
        notes: holdParams.notes,
      });

      if (!response.success) {
        throw new AdapterError('Failed to hold order', ErrorCode.API_ERROR, response.error);
      }

      return {
        success: true,
        orderId,
        holdId: (response.data as any)?.hold_id,
        status: 'on_hold',
        reason: holdParams.reason,
        autoRelease: holdParams.autoRelease,
        message: `Order ${orderId} placed on hold`,
      };
    } catch (error: unknown) {
      if (error instanceof AdapterError) {
        throw error;
      }
      throw new AdapterError(`Hold order failed: ${getErrorMessage(error)}`, ErrorCode.UNKNOWN_ERROR, error);
    }
  }

  async splitOrder(orderId: string, splits: SplitParams[]): Promise<SplitResult> {
    try {
      const response = await this.client.post(`/orders/${orderId}/split`, {
        splits: splits.map((split) => ({
          items: split.items,
          warehouse: split.warehouse,
          ship_date: split.shipDate,
        })),
      });

      if (!response.success) {
        throw new AdapterError('Failed to split order', ErrorCode.API_ERROR, response.error);
      }

      return {
        success: true,
        originalOrderId: orderId,
        newOrderIds: (response.data as any)?.new_order_ids,
        splitCount: (response.data as any)?.split_count,
        shipments: (response.data as any)?.shipments?.map((s: any) => ({
          orderId: s.order_id,
          warehouse: s.warehouse,
          estimatedShipDate: s.estimated_ship_date,
        })),
        message: `Order ${orderId} split into ${(response.data as any)?.split_count} orders`,
      };
    } catch (error: unknown) {
      if (error instanceof AdapterError) {
        throw error;
      }
      throw new AdapterError(`Split order failed: ${getErrorMessage(error)}`, ErrorCode.UNKNOWN_ERROR, error);
    }
  }

  // ==================== Query Operations ====================

  async getOrder(identifier: OrderIdentifier): Promise<Order> {
    try {
      let response;

      if (identifier.orderId) {
        response = await this.client.get(`/orders/${identifier.orderId}`);
      } else if (identifier.orderNumber) {
        response = await this.client.get(`/orders/by-number/${identifier.orderNumber}`);
      } else {
        throw new AdapterError('Either orderId or orderNumber must be provided', ErrorCode.INVALID_REQUEST);
      }

      if (!response.success) {
        throw new OrderNotFoundError(identifier);
      }

      // Transform YourFulfillment order to UOIS Order format
      return this.transformToOrder(response.data as YourFulfillmentOrder);
    } catch (error: unknown) {
      if (error instanceof AdapterError) {
        throw error;
      }
      throw new AdapterError(`Failed to get order: ${getErrorMessage(error)}`, ErrorCode.UNKNOWN_ERROR, error);
    }
  }

  async getInventory(sku: string, locationId?: string): Promise<Inventory> {
    try {
      const params: any = { sku };
      if (locationId) {
        params.location_id = locationId;
      }

      const response = await this.client.get('/inventory', params);

      if (!response.success) {
        throw new AdapterError('Failed to get inventory', ErrorCode.API_ERROR, response.error);
      }

      // Transform to UOIS Inventory format
      return this.transformToInventory(response.data as YourFulfillmentInventory);
    } catch (error: unknown) {
      if (error instanceof AdapterError) {
        throw error;
      }
      throw new AdapterError(`Failed to get inventory: ${getErrorMessage(error)}`, ErrorCode.UNKNOWN_ERROR, error);
    }
  }

  async getProduct(identifier: ProductIdentifier): Promise<Product> {
    try {
      let response;

      if (identifier.productId) {
        response = await this.client.get(`/products/${identifier.productId}`);
      } else if (identifier.sku) {
        response = await this.client.get(`/products/by-sku/${identifier.sku}`);
      } else {
        throw new AdapterError('Either productId or sku must be provided', ErrorCode.INVALID_REQUEST);
      }

      if (!response.success) {
        throw new ProductNotFoundError(identifier);
      }

      // Transform to UOIS Product format
      return this.transformToProduct(response.data as YourFulfillmentProduct);
    } catch (error: unknown) {
      if (error instanceof AdapterError) {
        throw error;
      }
      throw new AdapterError(`Failed to get product: ${getErrorMessage(error)}`, ErrorCode.UNKNOWN_ERROR, error);
    }
  }

  async getCustomer(identifier: CustomerIdentifier): Promise<Customer> {
    try {
      let response;

      if (identifier.customerId) {
        response = await this.client.get(`/customers/${identifier.customerId}`);
      } else if (identifier.email) {
        response = await this.client.get(`/customers/by-email/${identifier.email}`);
      } else {
        throw new AdapterError('Either customerId or email must be provided', ErrorCode.INVALID_REQUEST);
      }

      if (!response.success) {
        throw new CustomerNotFoundError(identifier);
      }

      // Transform to UOIS Customer format
      return this.transformToCustomer(response.data as YourFulfillmentCustomer);
    } catch (error: unknown) {
      if (error instanceof AdapterError) {
        throw error;
      }
      throw new AdapterError(`Failed to get customer: ${getErrorMessage(error)}`, ErrorCode.UNKNOWN_ERROR, error);
    }
  }

  async getShipment(identifier: ShipmentIdentifier): Promise<Shipment> {
    try {
      let response;

      if (identifier.shipmentId) {
        response = await this.client.get(`/shipments/${identifier.shipmentId}`);
      } else if (identifier.trackingNumber) {
        response = await this.client.get(`/shipments/by-tracking/${identifier.trackingNumber}`);
      } else {
        throw new AdapterError('Either shipmentId or trackingNumber must be provided', ErrorCode.INVALID_REQUEST);
      }

      if (!response.success) {
        throw new AdapterError(`Shipment not found: ${JSON.stringify(identifier)}`, ErrorCode.API_ERROR, identifier);
      }

      // Transform to UOIS Shipment format
      return this.transformToShipment(response.data as YourFulfillmentShipment);
    } catch (error: unknown) {
      if (error instanceof AdapterError) {
        throw error;
      }
      throw new AdapterError(`Failed to get shipment: ${getErrorMessage(error)}`, ErrorCode.UNKNOWN_ERROR, error);
    }
  }

  async getBuyer(buyerId: string): Promise<Buyer> {
    try {
      const response = await this.client.get(`/buyers/${buyerId}`);

      if (!response.success) {
        throw new AdapterError(`Buyer not found: ${buyerId}`, ErrorCode.API_ERROR, { buyerId });
      }

      // Transform to UOIS Buyer format
      return this.transformToBuyer(response.data as any);
    } catch (error: unknown) {
      if (error instanceof AdapterError) {
        throw error;
      }
      throw new AdapterError(`Failed to get buyer: ${getErrorMessage(error)}`, ErrorCode.UNKNOWN_ERROR, error);
    }
  }

  // ==================== Private Helper Methods ====================

  private transformToFulfillmentOrder(params: OrderRequest): any {
    // Transform UOIS order format to your Fulfillment format
    // This is where you map UOIS fields to your Fulfillment-specific fields

    return {
      external_id: params.extOrderId,
      customer: {
        id: params.customer?.customerId,
        email: params.customer?.email,
        first_name: params.customer?.firstName,
        last_name: params.customer?.lastName,
        phone: params.customer?.phone,
      },
      items: params.lineItems?.map((item) => ({
        sku: item.sku,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount || 0,
        tax: item.tax || 0,
      })),
      shipping_address: params.shippingAddress
        ? {
            street1: params.shippingAddress.address1,
            street2: params.shippingAddress.address2,
            city: params.shippingAddress.city,
            state: params.shippingAddress.state,
            postal_code: params.shippingAddress.zip,
            country: params.shippingAddress.country,
            name: `${params.shippingAddress.firstName} ${params.shippingAddress.lastName}`,
            phone: params.shippingAddress.phone,
          }
        : undefined,
      billing_address: params.billingAddress
        ? {
            street1: params.billingAddress.address1,
            street2: params.billingAddress.address2,
            city: params.billingAddress.city,
            state: params.billingAddress.state,
            postal_code: params.billingAddress.zip,
            country: params.billingAddress.country,
            name: `${params.billingAddress.firstName} ${params.billingAddress.lastName}`,
            phone: params.billingAddress.phone,
          }
        : undefined,
      total: params.totalPrice,
      currency: params.currency || 'USD',
      notes: params.orderNote,
      metadata: {
        source: params.orderSource,
        workspace: this.options.workspace,
      },
    };
  }

  private transformOrderUpdates(updates: OrderUpdates): any {
    // Transform UOIS update format to your Fulfillment format
    const fulfillmentUpdates: any = {};

    if (updates.status) {
      // Reverse map UOIS status to your Fulfillment status
      const reverseStatusMap: Record<string, string> = {};
      for (const [fulfillmentStatus, uoisStatus] of Object.entries(STATUS_MAP)) {
        reverseStatusMap[uoisStatus] = fulfillmentStatus;
      }
      fulfillmentUpdates.status = reverseStatusMap[updates.status] || updates.status;
    }

    if (updates.shippingAddress) {
      fulfillmentUpdates.shipping_address = {
        street1: updates.shippingAddress.address1,
        street2: updates.shippingAddress.address2,
        city: updates.shippingAddress.city,
        state: updates.shippingAddress.state,
        postal_code: updates.shippingAddress.zip,
        country: updates.shippingAddress.country,
      };
    }

    if (updates.notes) {
      fulfillmentUpdates.notes = updates.notes;
    }

    if (updates.tags) {
      fulfillmentUpdates.tags = updates.tags;
    }

    return fulfillmentUpdates;
  }

  private transformToOrderResult(fulfillmentResponse: any): OrderResult {
    // Transform your Fulfillment response to UOIS format
    return {
      success: true,
      orderId: fulfillmentResponse.id,
      orderNumber: fulfillmentResponse.number,
      status: this.mapOrderStatus(fulfillmentResponse.status),
      createdAt: fulfillmentResponse.created_at,
      message: `Order ${fulfillmentResponse.number} created successfully`,
    };
  }

  private transformToOrder(fulfillmentOrder: YourFulfillmentOrder): Order {
    // Transform your Fulfillment order to UOIS Order format
    return {
      orderId: fulfillmentOrder.id,
      extOrderId: fulfillmentOrder.external_id,
      status: this.mapOrderStatus(fulfillmentOrder.status),
      customer: {
        customerId: fulfillmentOrder.customer.id,
        email: fulfillmentOrder.customer.email,
        firstName: fulfillmentOrder.customer.first_name,
        lastName: fulfillmentOrder.customer.last_name,
        phone: fulfillmentOrder.customer.phone,
      },
      lineItems: fulfillmentOrder.items.map((item) => ({
        lineItemId: `line_${item.sku}_${Date.now()}`, // Generate a unique line item ID
        sku: item.sku,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.subtotal,
        price: item.price,
        discount: item.discount,
        tax: item.tax,
        subtotal: item.subtotal,
      })),
      shippingAddress: fulfillmentOrder.shipping_address
        ? {
            firstName: fulfillmentOrder.shipping_address.name?.split(' ')[0],
            lastName: fulfillmentOrder.shipping_address.name?.split(' ').slice(1).join(' '),
            address1: fulfillmentOrder.shipping_address.street1,
            address2: fulfillmentOrder.shipping_address.street2,
            city: fulfillmentOrder.shipping_address.city,
            state: fulfillmentOrder.shipping_address.state,
            zip: fulfillmentOrder.shipping_address.postal_code,
            country: fulfillmentOrder.shipping_address.country,
            phone: fulfillmentOrder.shipping_address.phone,
          }
        : undefined,
      billingAddress: fulfillmentOrder.billing_address
        ? {
            firstName: fulfillmentOrder.billing_address.name?.split(' ')[0],
            lastName: fulfillmentOrder.billing_address.name?.split(' ').slice(1).join(' '),
            address1: fulfillmentOrder.billing_address.street1,
            address2: fulfillmentOrder.billing_address.street2,
            city: fulfillmentOrder.billing_address.city,
            state: fulfillmentOrder.billing_address.state,
            zip: fulfillmentOrder.billing_address.postal_code,
            country: fulfillmentOrder.billing_address.country,
            phone: fulfillmentOrder.billing_address.phone,
          }
        : undefined,
      totalPrice: fulfillmentOrder.total,
      currency: fulfillmentOrder.currency,
      createdAt: fulfillmentOrder.created_at,
      updatedAt: fulfillmentOrder.updated_at,
    };
  }

  private transformToInventory(fulfillmentInventory: YourFulfillmentInventory): Inventory {
    return {
      sku: fulfillmentInventory.sku,
      available: fulfillmentInventory.available,
      reserved: fulfillmentInventory.reserved,
      total: fulfillmentInventory.total,
      locations: fulfillmentInventory.warehouse_locations?.map((loc) => ({
        locationId: loc.location_id,
        available: loc.available,
        reserved: loc.reserved,
      })),
      lastUpdated: fulfillmentInventory.updated_at,
    };
  }

  private transformToProduct(fulfillmentProduct: YourFulfillmentProduct): Product {
    return {
      productId: fulfillmentProduct.id,
      sku: fulfillmentProduct.sku,
      name: fulfillmentProduct.name,
      description: fulfillmentProduct.description,
      price: fulfillmentProduct.price,
      status: fulfillmentProduct.status,
      inventory: fulfillmentProduct.inventory,
      attributes: fulfillmentProduct.attributes,
      createdAt: fulfillmentProduct.created_at,
      updatedAt: fulfillmentProduct.updated_at,
    };
  }

  private transformToCustomer(fulfillmentCustomer: YourFulfillmentCustomer): Customer {
    return {
      customerId: fulfillmentCustomer.id,
      email: fulfillmentCustomer.email,
      firstName: fulfillmentCustomer.first_name,
      lastName: fulfillmentCustomer.last_name,
      phone: fulfillmentCustomer.phone,
      addresses: fulfillmentCustomer.addresses?.map((addr) => ({
        type: 'shipping',
        firstName: addr.name?.split(' ')[0],
        lastName: addr.name?.split(' ').slice(1).join(' '),
        address1: addr.street1,
        address2: addr.street2,
        city: addr.city,
        state: addr.state,
        zip: addr.postal_code,
        country: addr.country,
        phone: addr.phone,
      })),
      tags: fulfillmentCustomer.tags,
      metadata: fulfillmentCustomer.metadata,
      createdAt: fulfillmentCustomer.created_at,
      updatedAt: fulfillmentCustomer.updated_at,
    };
  }

  private transformToShipment(fulfillmentShipment: YourFulfillmentShipment): Shipment {
    return {
      shipmentId: fulfillmentShipment.id,
      extOrderId: fulfillmentShipment.order_id, // Required field
      shippingAddress: fulfillmentShipment.to_address
        ? {
            // Required field
            firstName: fulfillmentShipment.to_address.name?.split(' ')[0],
            lastName: fulfillmentShipment.to_address.name?.split(' ').slice(1).join(' '),
            address1: fulfillmentShipment.to_address.street1,
            address2: fulfillmentShipment.to_address.street2,
            city: fulfillmentShipment.to_address.city,
            state: fulfillmentShipment.to_address.state,
            zip: fulfillmentShipment.to_address.postal_code,
            country: fulfillmentShipment.to_address.country,
            phone: fulfillmentShipment.to_address.phone,
          }
        : {},
      orderId: fulfillmentShipment.order_id,
      trackingNumber: fulfillmentShipment.tracking_number,
      carrier: fulfillmentShipment.carrier,
      service: fulfillmentShipment.service,
      status: fulfillmentShipment.status,
      shippedAt: fulfillmentShipment.shipped_at,
      deliveredAt: fulfillmentShipment.delivered_at,
      trackingUrl: fulfillmentShipment.tracking_url,
      items: fulfillmentShipment.items.map((item) => ({
        sku: item.sku,
        quantity: item.quantity,
      })),
      fromAddress: fulfillmentShipment.from_address
        ? {
            firstName: fulfillmentShipment.from_address.name?.split(' ')[0],
            lastName: fulfillmentShipment.from_address.name?.split(' ').slice(1).join(' '),
            address1: fulfillmentShipment.from_address.street1,
            address2: fulfillmentShipment.from_address.street2,
            city: fulfillmentShipment.from_address.city,
            state: fulfillmentShipment.from_address.state,
            zip: fulfillmentShipment.from_address.postal_code,
            country: fulfillmentShipment.from_address.country,
            phone: fulfillmentShipment.from_address.phone,
          }
        : undefined,
      toAddress: fulfillmentShipment.to_address
        ? {
            firstName: fulfillmentShipment.to_address.name?.split(' ')[0],
            lastName: fulfillmentShipment.to_address.name?.split(' ').slice(1).join(' '),
            address1: fulfillmentShipment.to_address.street1,
            address2: fulfillmentShipment.to_address.street2,
            city: fulfillmentShipment.to_address.city,
            state: fulfillmentShipment.to_address.state,
            zip: fulfillmentShipment.to_address.postal_code,
            country: fulfillmentShipment.to_address.country,
            phone: fulfillmentShipment.to_address.phone,
          }
        : undefined,
    };
  }

  private transformToBuyer(fulfillmentBuyer: any): Buyer {
    return {
      buyerId: fulfillmentBuyer.id,
      name: fulfillmentBuyer.name,
      email: fulfillmentBuyer.email,
      roles: fulfillmentBuyer.roles || [],
      phone: fulfillmentBuyer.phone,
      company: fulfillmentBuyer.company,
      type: fulfillmentBuyer.type || 'individual',
      status: fulfillmentBuyer.status || 'active',
      metadata: fulfillmentBuyer.metadata,
      createdAt: fulfillmentBuyer.created_at,
      updatedAt: fulfillmentBuyer.updated_at,
    };
  }

  private mapOrderStatus(fulfillmentStatus: string): string {
    // Map your Fulfillment status to UOIS standard status
    return STATUS_MAP[fulfillmentStatus] || fulfillmentStatus;
  }
}

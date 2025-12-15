/**
 * Rydership Adapter Implementation
 *
 * This template demonstrates how to wire an adapter to the MCP server types.
 * Replace the placeholder API calls and mappings with your fulfillment system's logic.
 */

import type {
  IFulfillmentAdapter,
  AdapterConfig,
  AdapterCapabilities,
  HealthStatus,
  OrderResult,
  ReturnResult,
  FulfillmentToolResult,
  Order,
  Fulfillment,
  Return,
  InventoryItem,
  Product,
  ProductVariant,
  Customer,
  CreateSalesOrderInput,
  CreateReturnInput,
  CancelOrderInput,
  UpdateOrderInput,
  FulfillOrderInput,
  GetOrdersInput,
  GetInventoryInput,
  GetProductsInput,
  GetProductVariantsInput,
  // GetCustomersInput,
  GetFulfillmentsInput,
  GetReturnsInput,
  Address,
  OrderLineItem,
  // CustomField,
} from '@cof-org/mcp';
import { AdapterError } from '@cof-org/mcp';
import { ApiClient } from './utils/api-client.js';
import type {
  AdapterOptions as TemplateAdapterOptions,
  RydershipApiResponse,
  RydershipOrder,
  RydershipProduct,
  // RydershipInventory,
  // RydershipShipment,
  RydershipOrderItem,
} from './types.js';
import { STATUS_MAP, ErrorCode } from './types.js';
import { getErrorMessage } from './utils/type-guards.js';

export class RydershipAdapter implements IFulfillmentAdapter {
  private client: ApiClient;
  private connected = false;
  private options: TemplateAdapterOptions;

  constructor(config: any = {}) {
    const options = config.options || config;

    this.options = {
      apiUrl: options.apiUrl || 'http://localhost:3000/api/v2',
      apiKey: options.apiKey || '',
      workspace: options.workspace,
      timeout: options.timeout || 30000,
      retryAttempts: options.retryAttempts || 3,
      debugMode: options.debugMode || false,
    };

    this.client = new ApiClient({
      baseUrl: this.options.apiUrl,
      apiKey: this.options.apiKey,
      timeout: this.options.timeout,
      retryAttempts: this.options.retryAttempts,
      debugMode: this.options.debugMode,
    });
  }

  async initialize?(config: AdapterConfig): Promise<void> {
    this.updateOptions(config.options ?? {});
  }

  async cleanup?(): Promise<void> {
    this.connected = false;
  }

  async connect(): Promise<void> {
    try {
      const response = await this.client.get('/public/status');

      if (!response.success) {
        throw new AdapterError('Failed to connect to Rydership', ErrorCode.CONNECTION_FAILED, response);
      }

      this.connected = true;
      console.info('Successfully connected to Rydership');
    } catch (error: unknown) {
      this.connected = false;
      throw new AdapterError(`Connection failed: ${getErrorMessage(error)}`, ErrorCode.CONNECTION_FAILED, error);
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    console.info('Disconnected from Rydership');
  }

  // TODO: Let's get this working next!
  async healthCheck(): Promise<HealthStatus> {
    try {
      const response = await this.client.get('/public/status');

      return {
        status: response.success ? 'healthy' : 'unhealthy',
        timestamp: this.now(),
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
        timestamp: this.now(),
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

  async checkHealth?(): Promise<HealthStatus> {
    return this.healthCheck();
  }

  async getCapabilities?(): Promise<AdapterCapabilities> {
    return {
      supportsOrderCapture: true,
      supportsShipping: true,
      supportsCustomFields: true,
      maxBatchSize: 50,
    };
  }

  async updateConfig?(config: AdapterConfig): Promise<void> {
    this.updateOptions(config.options ?? {});
  }

  async createSalesOrder(input: CreateSalesOrderInput): Promise<OrderResult> {
    try {
      const payload = this.transformCreateSalesOrderInput(input);
      const response = await this.client.post<RydershipOrder>('/orders', payload);

      if (!response.success || !response.data) {
        return this.failure<{ order: Order }>('Failed to create order', response.error ?? response);
      }

      return this.success<{ order: Order }>({ order: this.transformToOrder(response.data) });
    } catch (error: unknown) {
      return this.failure<{ order: Order }>(`Order creation failed: ${getErrorMessage(error)}`, error);
    }
  }

  async cancelOrder(input: CancelOrderInput): Promise<OrderResult> {
    if (!input.orderId) {
      return this.failure<{ order: Order }>('orderId is required to cancel an order');
    }

    try {
      const response = await this.client.post<RydershipOrder>(`/orders/${input.orderId}/call/cancel`, {
        reason: input.reason ?? 'Customer requested cancellation',
        notify_customer: input.notifyCustomer ?? false,
        notes: input.notes,
        cancelled_at: this.now(),
      });

      if (!response.success) {
        return this.failure<{ order: Order }>('Failed to cancel order', response.error ?? response);
      }

      const orderData = response.data ?? (await this.fetchOrderById(input.orderId)).data;

      if (!orderData) {
        return this.failure<{ order: Order }>('Order not found after cancellation', { orderId: input.orderId });
      }

      return this.success<{ order: Order }>({ order: this.transformToOrder(orderData) });
    } catch (error: unknown) {
      return this.failure<{ order: Order }>(`Order cancellation failed: ${getErrorMessage(error)}`, error);
    }
  }

  async updateOrder(input: UpdateOrderInput): Promise<OrderResult> {
    try {
      const response = await this.client.put<RydershipOrder>(
        `/orders/${input.id}`,
        this.transformOrderUpdates(input.updates)
      );

      if (!response.success) {
        return this.failure<{ order: Order }>('Failed to update order', response.error ?? response);
      }

      const orderData = response.data ?? (await this.fetchOrderById(input.id)).data;

      if (!orderData) {
        return this.failure<{ order: Order }>('Order not found after update', { orderId: input.id });
      }

      return this.success<{ order: Order }>({ order: this.transformToOrder(orderData) });
    } catch (error: unknown) {
      return this.failure<{ order: Order }>(`Order update failed: ${getErrorMessage(error)}`, error);
    }
  }

  // TODO
  async fulfillOrder(_input: FulfillOrderInput): Promise<FulfillmentToolResult<{ fulfillment: Fulfillment }>> {
    // Not supported in this adapter
    return this.failure<{ fulfillment: Fulfillment }>('fulfillOrder is not supported by this adapter');

    // if (!input.orderId) {
    //   return this.failure<{ fulfillment: Fulfillment }>('orderId is required to fulfill an order');
    // }

    // try {
    //   const response = await this.client.post<RydershipShipment>(
    //     `/orders/${input.orderId}/shipments`,
    //     this.transformFulfillOrderInput(input)
    //   );

    //   if (!response.success || !response.data) {
    //     return this.failure<{ fulfillment: Fulfillment }>('Failed to create fulfillment', response.error ?? response);
    //   }

    //   return this.success<{ fulfillment: Fulfillment }>({ fulfillment: this.transformToFulfillment(response.data) });
    // } catch (error: unknown) {
    //   return this.failure<{ fulfillment: Fulfillment }>(`Fulfillment failed: ${getErrorMessage(error)}`, error);
    // }
  }

  async createReturn(input: CreateReturnInput): Promise<ReturnResult> {
    try {
      // TODO: Implement return creation logic for your fulfillment system
      // This is a placeholder implementation
      const payload = {
        order_id: input.return.orderId,
        return_number: input.return.returnNumber,
        status: input.return.status,
        outcome: input.return.outcome,
        items: input.return.returnLineItems?.map((item) => ({
          sku: item.sku,
          quantity: item.quantityReturned,
          reason: item.returnReason,
          refund_amount: item.refundAmount,
        })),
      };

      const response = await this.client.post('/returns', payload);

      if (!response.success || !response.data) {
        return this.failure<{ return: Return }>('Failed to create return', response.error ?? response);
      }

      // TODO: Transform the response to Return type
      return this.failure<{ return: Return }>(
        'createReturn not yet implemented - please implement transformation logic'
      );
    } catch (error: unknown) {
      return this.failure<{ return: Return }>(`Return creation failed: ${getErrorMessage(error)}`, error);
    }
  }

  async getCustomers(): Promise<FulfillmentToolResult<{ customers: Customer[] }>> {
    // Not supported in this adapter
    return this.failure<{ customers: Customer[] }>('getCustomers is not supported by this adapter');
  }

  async getOrders(input: GetOrdersInput): Promise<FulfillmentToolResult<{ orders: Order[] }>> {
    try {
      const response = await this.client.get<RydershipOrder[] | RydershipOrder>(
        '/orders',
        this.mapOrderFilters(input)
      );

      if (!response.success) {
        return this.failure<{ orders: Order[] }>('Failed to fetch orders', response.error ?? response);
      }

      const orders = this.ensureArray(response.data).map((order) => this.transformToOrder(order));
      return this.success<{ orders: Order[] }>({ orders });
    } catch (error: unknown) {
      return this.failure<{ orders: Order[] }>(`Order lookup failed: ${getErrorMessage(error)}`, error);
    }
  }

  async getInventory(_input: GetInventoryInput): Promise<FulfillmentToolResult<{ inventory: InventoryItem[] }>> {
    // Not supported in this adapter
    return this.failure<{ inventory: InventoryItem[] }>('getInventory is not supported by this adapter');

    // try {
    //   const response = await this.client.get<RydershipInventory[] | RydershipInventory>(
    //     '/inventory',
    //     this.mapInventoryFilters(input)
    //   );

    //   if (!response.success) {
    //     return this.failure<{ inventory: InventoryItem[] }>('Failed to fetch inventory', response.error ?? response);
    //   }

    //   const inventory = this.ensureArray(response.data).flatMap((item) => this.transformToInventoryItems(item));
    //   return this.success<{ inventory: InventoryItem[] }>({ inventory });
    // } catch (error: unknown) {
    //   return this.failure<{ inventory: InventoryItem[] }>(`Inventory lookup failed: ${getErrorMessage(error)}`, error);
    // }
  }

  async getProducts(input: GetProductsInput): Promise<FulfillmentToolResult<{ products: Product[] }>> {
    try {
      const response = await this.client.get<RydershipProduct[] | RydershipProduct>(
        '/items',
        this.mapProductFilters(input)
      );

      if (!response.success) {
        return this.failure<{ products: Product[] }>('Failed to fetch products', response.error ?? response);
      }

      const products = this.ensureArray(response.data).map((product) => this.transformToProduct(product));
      return this.success<{ products: Product[] }>({ products });
    } catch (error: unknown) {
      return this.failure<{ products: Product[] }>(`Product lookup failed: ${getErrorMessage(error)}`, error);
    }
  }

  async getProductVariants(
    input: GetProductVariantsInput
  ): Promise<FulfillmentToolResult<{ productVariants: ProductVariant[] }>> {
    try {
      const response = await this.client.get<RydershipProduct[] | RydershipProduct>(
        '/items',
        this.mapProductVariantFilters(input)
      );

      if (!response.success) {
        return this.failure<{ productVariants: ProductVariant[] }>(
          'Failed to fetch product variants',
          response.error ?? response
        );
      }

      const productVariants = this.ensureArray(response.data).map((product) => this.transformToProductVariant(product));
      return this.success<{ productVariants: ProductVariant[] }>({ productVariants });
    } catch (error: unknown) {
      return this.failure<{ productVariants: ProductVariant[] }>(
        `Product variant lookup failed: ${getErrorMessage(error)}`,
        error
      );
    }
  }

  async getFulfillments(_input: GetFulfillmentsInput): Promise<FulfillmentToolResult<{ fulfillments: Fulfillment[] }>> {
        // Not supported in this adapter
    return this.failure<{ fulfillments: Fulfillment[] }>('getInventory is not supported by this adapter');

    // try {
    //   const response = await this.client.get<RydershipShipment[] | RydershipShipment>(
    //     '/shipments',
    //     this.mapFulfillmentFilters(input)
    //   );

    //   if (!response.success) {
    //     return this.failure<{ fulfillments: Fulfillment[] }>(
    //       'Failed to fetch fulfillments',
    //       response.error ?? response
    //     );
    //   }

    //   const fulfillments = this.ensureArray(response.data).map((shipment) => this.transformToFulfillment(shipment));
    //   return this.success<{ fulfillments: Fulfillment[] }>({ fulfillments });
    // } catch (error: unknown) {
    //   return this.failure<{ fulfillments: Fulfillment[] }>(
    //     `Fulfillment lookup failed: ${getErrorMessage(error)}`,
    //     error
    //   );
    // }
  }

  async getReturns(input: GetReturnsInput): Promise<FulfillmentToolResult<{ returns: Return[] }>> {
    try {
      // TODO: Implement return retrieval logic for your fulfillment system
      // This is a placeholder implementation
      const params = {
        ids: input.ids,
        order_ids: input.orderIds,
        return_numbers: input.returnNumbers,
        statuses: input.statuses,
        outcomes: input.outcomes,
        updated_at_min: input.updatedAtMin,
        updated_at_max: input.updatedAtMax,
        created_at_min: input.createdAtMin,
        created_at_max: input.createdAtMax,
        limit: input.pageSize,
        offset: input.skip,
      };

      const response = await this.client.get('/returns', params);

      if (!response.success) {
        return this.failure<{ returns: Return[] }>('Failed to fetch returns', response.error ?? response);
      }

      // TODO: Transform the response to Return[] type
      return this.failure<{ returns: Return[] }>('getReturns not yet implemented - please implement transformation logic');
    } catch (error: unknown) {
      return this.failure<{ returns: Return[] }>(`Return lookup failed: ${getErrorMessage(error)}`, error);
    }
  }

  private updateOptions(options: Partial<TemplateAdapterOptions>): void {
    if (!options) {
      return;
    }

    this.options = {
      ...this.options,
      ...options,
    };

    if (options.apiKey) {
      this.client.updateApiKey(options.apiKey);
    }

    if (typeof options.debugMode === 'boolean') {
      this.client.setDebugMode(options.debugMode);
    }
  }

  private success<T>(payload: T): FulfillmentToolResult<T> {
    return { success: true, ...payload } as FulfillmentToolResult<T>;
  }

  private failure<T>(message: string, error?: unknown): FulfillmentToolResult<T> {
    return {
      success: false,
      error: error ?? new AdapterError(message, ErrorCode.API_ERROR, { message }),
      message,
    } as FulfillmentToolResult<T>;
  }

  private ensureArray<T>(data: T | T[] | undefined | null): T[] {
    if (!data) {
      return [];
    }
    return Array.isArray(data) ? data : [data];
  }

  private transformCreateSalesOrderInput(input: CreateSalesOrderInput): Record<string, unknown> {
    const order = input.order;
    if (!order) {
      return {};
    }

    return {
      external_id: order.externalId ?? order.name,
      status: order.status,
      total: order.totalPrice,
      currency: order.currency ?? 'USD',
      customer: order.customer
        ? {
            id: order.customer.id ?? order.customer.externalId ?? order.customer.email,
            email: order.customer.email,
            first_name: order.customer.firstName,
            last_name: order.customer.lastName,
            phone: order.customer.phone,
          }
        : undefined,
      items: order.lineItems?.map((item) => ({
        sku: item.sku,
        name: item.name,
        quantity: item.quantity ?? 0,
        price: item.unitPrice ?? 0,
        subtotal: item.totalPrice ?? item.unitPrice ?? 0,
        discount: 0,
        tax: 0,
      })),
      shipping_address: this.mapOrderShippingAddress(order),
      notes: order.orderNote,
      metadata: {
        source: order.orderSource,
        workspace: this.options.workspace,
      },
    };
  }

  private mapOrderShippingAddress(orderOrPayload: any): Record<string, unknown> {
    return {
      street1: orderOrPayload.shipping_address_1 ?? '',
      street2: orderOrPayload.shipping_address_2,
      city: orderOrPayload.shipping_city ?? '',
      state: orderOrPayload.shipping_state ?? '',
      postal_code: orderOrPayload.shipping_zip ?? '',
      country: orderOrPayload.shipping_country_iso2 ?? '',
      phone: orderOrPayload.shipping_phone,
      email: orderOrPayload.email,
      name: this.composeShippingName(orderOrPayload),
      company: orderOrPayload.shipping_company,
    };
  }

  private transformOrderUpdates(updates: UpdateOrderInput['updates']): Record<string, unknown> {
    const payload: Record<string, unknown> = {};

    const status = this.valueOrUndefined((updates as { status?: string | null | undefined }).status);
    if (status) {
      payload.status = this.reverseMapStatus(status);
    }

    const shippingAddress = this.valueOrUndefined((updates as { shippingAddress?: Address | null }).shippingAddress);
    if (shippingAddress) {
      payload.shipping_address = this.mapOrderShippingAddress(payload);
    }

    const notes = this.valueOrUndefined((updates as { notes?: string | null }).notes);
    if (notes) {
      payload.notes = notes;
    }

    const tags = this.valueOrUndefined((updates as { tags?: string[] | null }).tags);
    if (Array.isArray(tags)) {
      payload.tags = tags;
    }

    return payload;
  }

  // TODO
  // private transformFulfillOrderInput(input: FulfillOrderInput): Record<string, unknown> {
  //   return {
  //     tracking_number: input.trackingNumbers?.[0] ?? undefined,
  //     carrier: input.shippingCarrier,
  //     service: input.shippingClass,
  //     location_id: input.locationId,
  //     shipped_at: input.shipByDate ?? this.now(),
  //     expected_delivery: input.expectedDeliveryDate,
  //     items: input.lineItems?.map((item) => ({
  //       sku: item.sku,
  //       quantity: item.quantity ?? 0,
  //     })),
  //     // shipping_address: this.mapOrderAddress(input.shippingAddress),
  //     incoterms: input.incoterms,
  //     notes: input.giftNote,
  //   };
  // }

  private transformToOrder(order: RydershipOrder): Order {
    return {
      id: String(order.id), // required
      createdAt: order.created_at, // required
      updatedAt: order.updated_at, // required
      tenantId: String(order.customer_id), // required
      name: order.order_orig,
      externalId: order.originator?.original_id,
      orderNote: order.public_note,
      orderSource: order.originator?.provider,
      status: this.mapOrderStatus(order.status),
      currency: order.order_items?.[0]?.currency,
      lineItems: order.order_items ? order.order_items.map((order_item) => this.transformToOrderLineItem(order_item)) : [],
      shippingAddress: this.mapOrderShippingAddress(order),
      customFields: this.transformMetadataToCustomFields(order),
    };
    // NOT IMPLEMENTED
    // totalPrice: order.total,
    //

    // WONT IMPLEMENT
    // customer: this.transformToCustomerFromOrder(order),
    // billingAddress: this.transformToAddress(order.billing_address),
  }

  private transformToOrderLineItem(
    item: RydershipOrderItem
  ): OrderLineItem {
    return {
      id: String(item.id),
      sku: String(item.sku),
      quantity: Number(item.quantity),
      unitPrice: Number(item.price),
      totalPrice: Number(item.price && item.quantity ? item.price * item.quantity : 0),
      name: item.description ?? item.sku,
    };
  }

  private transformMetadataToCustomFields(order: any): { name: string; value: string }[] | undefined {
    // Accepts the full Order object, returns customFields array if present, else undefined
    if (order && Array.isArray(order.customFields) && order.customFields.length > 0) {
      // Validate each entry is an object with name and value
      return order.customFields
        .filter((f: any) => f && typeof f.name === 'string' && typeof f.value === 'string')
        .map((f: any) => ({ name: f.name, value: f.value }));
    }
    return undefined;
  }

  // TODO
  // private transformToFulfillment(shipment: RydershipShipment): Fulfillment {
  //   return {
  //     id: shipment.id,
  //     externalId: shipment.tracking_number,
  //     orderId: shipment.order_id,
  //     trackingNumbers: shipment.tracking_number ? [shipment.tracking_number] : [],
  //     shippingCarrier: shipment.carrier,
  //     shippingClass: shipment.service,
  //     status: shipment.status,
  //     // shippingAddress: this.transformToAddress(shipment.to_address),
  //     lineItems: shipment.items.map((item, index) => ({
  //       id: `${shipment.id}-${item.sku}-${index}`,
  //       sku: item.sku,
  //       quantity: item.quantity,
  //     })),
  //     createdAt: shipment.shipped_at ?? this.now(),
  //     updatedAt: shipment.delivered_at ?? shipment.shipped_at ?? this.now(),
  //     // tenantId: this.getTenantId(), // NOT PROVIDED IN SHIPMENT
  //     expectedDeliveryDate: shipment.delivered_at,
  //     expectedShipDate: shipment.shipped_at,
  //     shippingNote: shipment.tracking_url,
  //   };
  // }

  // TODO
  // private transformToInventoryItems(inventory: RydershipInventory): InventoryItem[] {
  //   const tenantId = inventory.customer_id ? String(inventory.customer_id) : '';

  //   if (inventory.warehouse_locations?.length) {
  //     return inventory.warehouse_locations.map((location) => ({
  //       locationId: location.location_id,
  //       sku: inventory.sku,
  //       available: location.available,
  //       onHand: location.available + location.reserved,
  //       unavailable: location.reserved,
  //       tenantId,
  //     }));
  //   }

  //   return [
  //     {
  //       locationId: '',
  //       sku: inventory.sku,
  //       available: inventory.available,
  //       onHand: inventory.total,
  //       unavailable: inventory.total - inventory.available,
  //       tenantId,
  //     },
  //   ];
  // }

  private transformToProduct(product: RydershipProduct): Product {
    return {
      id: String(product.id),
      externalId: product.sku,
      name: product.title || '',
      description: product.description,
      status: this.mapProductStatus(product),
      options: [], // NOT IMPLEMENTED
      createdAt: product.created_at,
      updatedAt: product.updated_at,
      tenantId: String(product.customer_id),
      imageURLs: product.image_originator_url ? [product.image_originator_url] : undefined,
    };
    // NOT IMPLEMENTED
    // tags: product.attributes ? Object.keys(product.attributes) : undefined,
    
  }

  private transformToProductVariant(product: RydershipProduct): ProductVariant {
    return {
      id: String(product.id),
      productId: String(product.id),
      sku: product.sku || '',
      title: product.name,
      price: product.price,
      currency: product.currency || 'USD',
      //upc: product.upc || undefined,
      barcode: product.scancode || undefined,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
      tenantId: String(product.customer_id),
      weight: typeof product.weight === 'number'
        ? { value: product.weight, unit: 'lb' }
        : undefined,
      dimensions:  {
        length: product.length ?? 0,
        width: product.width ?? 0,
        height: product.height ?? 0,
        unit: 'in',
      },
      imageURLs: product.image_originator_url ? [product.image_originator_url] : undefined,
    };
  }

  private mapOrderFilters(input: GetOrdersInput): Record<string, unknown> {
    const search = {
      ids_in: input.ids,
      originator_original_id_in: input.externalIds,
      status_in: input.statuses,
      updated_at_gteq: input.updatedAtMin,
      updated_at_lteq: input.updatedAtMax,
      created_at_gteq: input.createdAtMin,
      created_at_lteq: input.createdAtMax
    };

    return {
      search: JSON.stringify(search),
      per_page: input.pageSize,
      page: input.skip,
    };
  }

  // TODO
  // private mapInventoryFilters(input: GetInventoryInput): Record<string, unknown> {
  //   return {
  //     skus: input.skus,
  //     location_ids: input.locationIds,
  //   };
  // }

  private mapProductFilters(input: GetProductsInput): Record<string, unknown> {
    const search = {
      ids_in: input.ids,
      updated_at_gteq: input.updatedAtMin,
      updated_at_lteq: input.updatedAtMax,
      created_at_gteq: input.createdAtMin,
      created_at_lteq: input.createdAtMax
    };

    return {
      search: JSON.stringify(search),
      per_page: input.pageSize,
      page: input.skip,
    };
  }

  private mapProductVariantFilters(input: GetProductVariantsInput): Record<string, unknown> {
    const search = {
      ids_in: input.ids,
      updated_at_gteq: input.updatedAtMin,
      updated_at_lteq: input.updatedAtMax,
      created_at_gteq: input.createdAtMin,
      created_at_lteq: input.createdAtMax
    };

    return {
      search: JSON.stringify(search),
      per_page: input.pageSize,
      page: input.skip,
    };
  }

  // TODO
  // private mapFulfillmentFilters(input: GetFulfillmentsInput): Record<string, unknown> {
  //   return {
  //     ids: input.ids,
  //     order_ids: input.orderIds,
  //     updated_at_min: input.updatedAtMin,
  //     updated_at_max: input.updatedAtMax,
  //     created_at_min: input.createdAtMin,
  //     created_at_max: input.createdAtMax,
  //     limit: input.pageSize,
  //     offset: input.skip,
  //   };
  // }

  private async fetchOrderById(orderId: string): Promise<RydershipApiResponse<RydershipOrder>> {
    return this.client.get<RydershipOrder>(`/orders/${orderId}`);
  }

  private reverseMapStatus(status: string): string {
    const reverse = Object.entries(STATUS_MAP).reduce<Record<string, string>>(
      (acc, [fulfillmentStatus, normalized]) => {
        acc[normalized] = fulfillmentStatus;
        return acc;
      },
      {}
    );

    return reverse[status] ?? status;
  }

  private mapOrderStatus(status: number): string {
    return STATUS_MAP[status] ?? String(status);
  }

  private mapProductStatus(product: RydershipProduct): string | undefined {
    if (product.active === false) {
      return 'inactive'; 
    } else if (product.available === false) {
      return 'unavailable';
    } else {
      return 'active';
    }
  }
  private composeShippingName(order: RydershipOrder): string | undefined {
    if (order.shipping_name && order.shipping_name.trim()) {
      return order.shipping_name.trim();
    }
    if (order.full_name && order.full_name.trim()) {
      return order.full_name.trim();
    }
    const parts = [order.first_name, order.last_name]
      .filter((value): value is string => Boolean(value && value.trim()))
      .map((value) => value.trim());

    return parts.length ? parts.join(' ') : undefined;
  }

  private valueOrUndefined<T>(value: T | null | undefined): T | undefined {
    return value ?? undefined;
  }

  private now(): string {
    return new Date().toISOString();
  }
}

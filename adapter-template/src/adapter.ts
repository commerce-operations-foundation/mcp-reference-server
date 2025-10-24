/**
 * YourFulfillment Adapter Implementation
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
  FulfillmentToolResult,
  Order,
  Fulfillment,
  InventoryItem,
  Product,
  ProductVariant,
  Customer,
  CreateSalesOrderInput,
  CancelOrderInput,
  UpdateOrderInput,
  FulfillOrderInput,
  GetOrdersInput,
  GetInventoryInput,
  GetProductsInput,
  GetProductVariantsInput,
  GetCustomersInput,
  GetFulfillmentsInput,
  Address,
  CustomerAddress,
  OrderLineItem,
  CustomField,
} from '@cof-org/mcp/adapter-template-types';
import { AdapterError } from '@cof-org/mcp/types/index.js';
import { ApiClient } from './utils/api-client.js';
import type {
  AdapterOptions as TemplateAdapterOptions,
  YourFulfillmentApiResponse,
  YourFulfillmentOrder,
  YourFulfillmentProduct,
  YourFulfillmentCustomer,
  YourFulfillmentInventory,
  YourFulfillmentShipment,
  YourFulfillmentAddress,
} from './types.js';
import { STATUS_MAP, ErrorCode } from './types.js';
import { getErrorMessage } from './utils/type-guards.js';

export class YourFulfillmentAdapter implements IFulfillmentAdapter {
  private client: ApiClient;
  private connected = false;
  private options: TemplateAdapterOptions;

  constructor(config: any = {}) {
    const options = config.options || config;

    this.options = {
      apiUrl: options.apiUrl || 'https://api.yourfulfillment.com',
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
    this.connected = false;
    console.info('Disconnected from YourFulfillment');
  }

  async healthCheck(): Promise<HealthStatus> {
    try {
      const response = await this.client.get('/health');

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
      const response = await this.client.post<YourFulfillmentOrder>('/orders', payload);

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
      const response = await this.client.post<YourFulfillmentOrder>(`/orders/${input.orderId}/cancel`, {
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
      const response = await this.client.patch<YourFulfillmentOrder>(
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

  async fulfillOrder(input: FulfillOrderInput): Promise<FulfillmentToolResult<{ fulfillment: Fulfillment }>> {
    if (!input.orderId) {
      return this.failure<{ fulfillment: Fulfillment }>('orderId is required to fulfill an order');
    }

    try {
      const response = await this.client.post<YourFulfillmentShipment>(
        `/orders/${input.orderId}/shipments`,
        this.transformFulfillOrderInput(input)
      );

      if (!response.success || !response.data) {
        return this.failure<{ fulfillment: Fulfillment }>('Failed to create fulfillment', response.error ?? response);
      }

      return this.success<{ fulfillment: Fulfillment }>({ fulfillment: this.transformToFulfillment(response.data) });
    } catch (error: unknown) {
      return this.failure<{ fulfillment: Fulfillment }>(`Fulfillment failed: ${getErrorMessage(error)}`, error);
    }
  }

  async getOrders(input: GetOrdersInput): Promise<FulfillmentToolResult<{ orders: Order[] }>> {
    try {
      const response = await this.client.get<YourFulfillmentOrder[] | YourFulfillmentOrder>(
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

  async getInventory(input: GetInventoryInput): Promise<FulfillmentToolResult<{ inventory: InventoryItem[] }>> {
    try {
      const response = await this.client.get<YourFulfillmentInventory[] | YourFulfillmentInventory>(
        '/inventory',
        this.mapInventoryFilters(input)
      );

      if (!response.success) {
        return this.failure<{ inventory: InventoryItem[] }>('Failed to fetch inventory', response.error ?? response);
      }

      const inventory = this.ensureArray(response.data).flatMap((item) => this.transformToInventoryItems(item));
      return this.success<{ inventory: InventoryItem[] }>({ inventory });
    } catch (error: unknown) {
      return this.failure<{ inventory: InventoryItem[] }>(`Inventory lookup failed: ${getErrorMessage(error)}`, error);
    }
  }

  async getProducts(input: GetProductsInput): Promise<FulfillmentToolResult<{ products: Product[] }>> {
    try {
      const response = await this.client.get<YourFulfillmentProduct[] | YourFulfillmentProduct>(
        '/products',
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
      const response = await this.client.get<YourFulfillmentProduct[] | YourFulfillmentProduct>(
        '/products',
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

  async getCustomers(input: GetCustomersInput): Promise<FulfillmentToolResult<{ customers: Customer[] }>> {
    try {
      const response = await this.client.get<YourFulfillmentCustomer[] | YourFulfillmentCustomer>(
        '/customers',
        this.mapCustomerFilters(input)
      );

      if (!response.success) {
        return this.failure<{ customers: Customer[] }>('Failed to fetch customers', response.error ?? response);
      }

      const customers = this.ensureArray(response.data).map((customer) => this.transformToCustomer(customer));
      return this.success<{ customers: Customer[] }>({ customers });
    } catch (error: unknown) {
      return this.failure<{ customers: Customer[] }>(`Customer lookup failed: ${getErrorMessage(error)}`, error);
    }
  }

  async getFulfillments(input: GetFulfillmentsInput): Promise<FulfillmentToolResult<{ fulfillments: Fulfillment[] }>> {
    try {
      const response = await this.client.get<YourFulfillmentShipment[] | YourFulfillmentShipment>(
        '/shipments',
        this.mapFulfillmentFilters(input)
      );

      if (!response.success) {
        return this.failure<{ fulfillments: Fulfillment[] }>(
          'Failed to fetch fulfillments',
          response.error ?? response
        );
      }

      const fulfillments = this.ensureArray(response.data).map((shipment) => this.transformToFulfillment(shipment));
      return this.success<{ fulfillments: Fulfillment[] }>({ fulfillments });
    } catch (error: unknown) {
      return this.failure<{ fulfillments: Fulfillment[] }>(
        `Fulfillment lookup failed: ${getErrorMessage(error)}`,
        error
      );
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
      shipping_address: this.mapOrderAddress(order.shippingAddress),
      billing_address: this.mapOrderAddress(order.billingAddress),
      notes: order.orderNote,
      metadata: {
        source: order.orderSource,
        workspace: this.options.workspace,
      },
    };
  }

  private mapOrderAddress(address?: Address): YourFulfillmentAddress | undefined {
    if (!address) {
      return undefined;
    }

    return {
      street1: address.address1 ?? '',
      street2: address.address2,
      city: address.city ?? '',
      state: address.stateOrProvince ?? '',
      postal_code: address.zipCodeOrPostalCode ?? '',
      country: address.country ?? '',
      phone: address.phone,
      email: address.email,
      name: this.composeName(address.firstName, address.lastName),
      company: address.company,
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
      payload.shipping_address = this.mapOrderAddress(shippingAddress);
    }

    const billingAddress = this.valueOrUndefined((updates as { billingAddress?: Address | null }).billingAddress);
    if (billingAddress) {
      payload.billing_address = this.mapOrderAddress(billingAddress);
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

  private transformFulfillOrderInput(input: FulfillOrderInput): Record<string, unknown> {
    return {
      tracking_number: input.trackingNumber ?? undefined,
      carrier: input.shippingCarrier,
      service: input.shippingClass,
      location_id: input.locationId,
      shipped_at: input.shipByDate ?? this.now(),
      expected_delivery: input.expectedDeliveryDate,
      items: input.lineItems?.map((item) => ({
        sku: item.sku,
        quantity: item.quantity ?? 0,
      })),
      shipping_address: this.mapOrderAddress(input.shippingAddress),
      incoterms: input.incoterms,
      notes: input.giftNote,
    };
  }

  private transformToOrder(order: YourFulfillmentOrder): Order {
    return {
      id: order.id,
      externalId: order.external_id,
      name: order.number,
      status: this.mapOrderStatus(order.status),
      totalPrice: order.total,
      currency: order.currency,
      customer: this.transformToCustomerFromOrder(order),
      shippingAddress: this.transformToAddress(order.shipping_address),
      billingAddress: this.transformToAddress(order.billing_address),
      lineItems: order.items.map((item, index) => this.transformToOrderLineItem(order.id, item, index)),
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      tenantId: this.getTenantId(),
      customFields: this.transformMetadataToCustomFields(order.metadata),
      orderSource: order.metadata?.source,
      orderNote: order.metadata?.note,
    };
  }

  private transformToCustomer(customer: YourFulfillmentCustomer): Customer {
    return {
      id: customer.id,
      email: customer.email,
      firstName: customer.first_name,
      lastName: customer.last_name,
      phone: customer.phone,
      addresses: this.transformToCustomerAddresses(customer.addresses),
      tags: customer.tags,
      createdAt: customer.created_at ?? this.now(),
      updatedAt: customer.updated_at ?? this.now(),
      tenantId: this.getTenantId(),
      status: 'active',
      type: 'customer',
    };
  }

  private transformToCustomerFromOrder(order: YourFulfillmentOrder): Customer {
    return this.transformToCustomer({
      id: order.customer.id,
      email: order.customer.email,
      first_name: order.customer.first_name,
      last_name: order.customer.last_name,
      phone: order.customer.phone,
      created_at: order.created_at,
      updated_at: order.updated_at,
      addresses: [order.shipping_address, order.billing_address].filter(Boolean) as YourFulfillmentAddress[],
      tags: [],
      metadata: order.metadata,
    });
  }

  private transformToCustomerAddresses(addresses?: YourFulfillmentAddress[]): CustomerAddress[] | undefined {
    if (!addresses?.length) {
      return undefined;
    }

    const mapped = addresses
      .map((addr) => {
        const address = this.transformToAddress(addr);
        if (!address) {
          return undefined;
        }
        return {
          name: addr.name ?? this.composeName(address.firstName, address.lastName),
          address,
        };
      })
      .filter(Boolean) as CustomerAddress[];

    return mapped.length ? mapped : undefined;
  }

  private transformToAddress(address?: YourFulfillmentAddress): Address | undefined {
    if (!address) {
      return undefined;
    }

    const { firstName, lastName } = this.splitName(address.name);

    return {
      address1: address.street1 ?? '',
      address2: address.street2,
      city: address.city ?? '',
      country: address.country ?? '',
      email: address.email,
      firstName,
      lastName,
      phone: address.phone,
      stateOrProvince: address.state ?? '',
      zipCodeOrPostalCode: address.postal_code ?? '',
      company: address.company,
    };
  }

  private transformToOrderLineItem(
    orderId: string,
    item: YourFulfillmentOrder['items'][number],
    index: number
  ): OrderLineItem {
    return {
      id: `${orderId}-${item.sku}-${index}`,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.price,
      totalPrice: item.subtotal ?? item.price * item.quantity,
      name: item.name,
    };
  }

  private transformMetadataToCustomFields(metadata?: Record<string, unknown>): CustomField[] | undefined {
    if (!metadata) {
      return undefined;
    }

    const entries = Object.entries(metadata)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([name, value]) => ({
        name,
        value: String(value),
      }));

    return entries.length ? entries : undefined;
  }

  private transformToFulfillment(shipment: YourFulfillmentShipment): Fulfillment {
    return {
      id: shipment.id,
      externalId: shipment.tracking_number,
      orderId: shipment.order_id,
      trackingNumber: shipment.tracking_number,
      shippingCarrier: shipment.carrier,
      shippingClass: shipment.service,
      status: shipment.status,
      shippingAddress: this.transformToAddress(shipment.to_address),
      lineItems: shipment.items.map((item, index) => ({
        id: `${shipment.id}-${item.sku}-${index}`,
        sku: item.sku,
        quantity: item.quantity,
      })),
      createdAt: shipment.shipped_at ?? this.now(),
      updatedAt: shipment.delivered_at ?? shipment.shipped_at ?? this.now(),
      tenantId: this.getTenantId(),
      expectedDeliveryDate: shipment.delivered_at,
      expectedShipDate: shipment.shipped_at,
      shippingLabels: shipment.tracking_url ? [shipment.tracking_url] : undefined,
      shippingNote: shipment.tracking_url,
    };
  }

  private transformToInventoryItems(inventory: YourFulfillmentInventory): InventoryItem[] {
    const tenantId = this.getTenantId();

    if (inventory.warehouse_locations?.length) {
      return inventory.warehouse_locations.map((location) => ({
        locationId: location.location_id,
        sku: inventory.sku,
        available: location.available,
        onHand: location.available + location.reserved,
        unavailable: location.reserved,
        tenantId,
      }));
    }

    return [
      {
        locationId: '',
        sku: inventory.sku,
        available: inventory.available,
        onHand: inventory.total,
        unavailable: inventory.total - inventory.available,
        tenantId,
      },
    ];
  }

  private transformToProduct(product: YourFulfillmentProduct): Product {
    return {
      id: product.id,
      externalId: product.sku,
      name: product.name,
      description: product.description,
      status: product.status,
      options: [],
      tags: product.attributes ? Object.keys(product.attributes) : undefined,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
      tenantId: this.getTenantId(),
    };
  }

  private transformToProductVariant(product: YourFulfillmentProduct): ProductVariant {
    return {
      id: `${product.id}-default`,
      productId: product.id,
      sku: product.sku,
      title: product.name,
      price: product.price,
      currency: 'USD',
      createdAt: product.created_at,
      updatedAt: product.updated_at,
      tenantId: this.getTenantId(),
    };
  }

  private mapOrderFilters(input: GetOrdersInput): Record<string, unknown> {
    return {
      ids: input.ids,
      external_ids: input.externalIds,
      statuses: input.statuses,
      updated_at_min: input.updatedAtMin,
      updated_at_max: input.updatedAtMax,
      created_at_min: input.createdAtMin,
      created_at_max: input.createdAtMax,
      limit: input.pageSize,
      offset: input.skip,
    };
  }

  private mapInventoryFilters(input: GetInventoryInput): Record<string, unknown> {
    return {
      skus: input.skus,
      location_ids: input.locationIds,
    };
  }

  private mapProductFilters(input: GetProductsInput): Record<string, unknown> {
    return {
      ids: input.ids,
      skus: input.skus,
      updated_at_min: input.updatedAtMin,
      updated_at_max: input.updatedAtMax,
      created_at_min: input.createdAtMin,
      created_at_max: input.createdAtMax,
      limit: input.pageSize,
      offset: input.skip,
    };
  }

  private mapProductVariantFilters(input: GetProductVariantsInput): Record<string, unknown> {
    return {
      ids: input.ids,
      skus: input.skus,
      product_ids: input.productIds,
      updated_at_min: input.updatedAtMin,
      updated_at_max: input.updatedAtMax,
      created_at_min: input.createdAtMin,
      created_at_max: input.createdAtMax,
      limit: input.pageSize,
      offset: input.skip,
    };
  }

  private mapCustomerFilters(input: GetCustomersInput): Record<string, unknown> {
    return {
      ids: input.ids,
      emails: input.emails,
      updated_at_min: input.updatedAtMin,
      updated_at_max: input.updatedAtMax,
      created_at_min: input.createdAtMin,
      created_at_max: input.createdAtMax,
      limit: input.pageSize,
      offset: input.skip,
    };
  }

  private mapFulfillmentFilters(input: GetFulfillmentsInput): Record<string, unknown> {
    return {
      ids: input.ids,
      order_ids: input.orderIds,
      updated_at_min: input.updatedAtMin,
      updated_at_max: input.updatedAtMax,
      created_at_min: input.createdAtMin,
      created_at_max: input.createdAtMax,
      limit: input.pageSize,
      offset: input.skip,
    };
  }

  private async fetchOrderById(orderId: string): Promise<YourFulfillmentApiResponse<YourFulfillmentOrder>> {
    return this.client.get<YourFulfillmentOrder>(`/orders/${orderId}`);
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

  private mapOrderStatus(status: string): string {
    return STATUS_MAP[status] ?? status;
  }

  private composeName(firstName?: string | null, lastName?: string | null): string | undefined {
    const parts = [firstName, lastName]
      .filter((value): value is string => Boolean(value && value.trim()))
      .map((value) => value.trim());

    return parts.length ? parts.join(' ') : undefined;
  }

  private splitName(name?: string | null): { firstName?: string; lastName?: string } {
    if (!name) {
      return {};
    }

    const parts = name.trim().split(/\s+/);
    if (!parts.length) {
      return {};
    }

    if (parts.length === 1) {
      return { firstName: parts[0] };
    }

    return {
      firstName: parts.shift(),
      lastName: parts.join(' '),
    };
  }

  private valueOrUndefined<T>(value: T | null | undefined): T | undefined {
    return value ?? undefined;
  }

  private getTenantId(): string {
    return this.options.workspace ?? 'default-workspace';
  }

  private now(): string {
    return new Date().toISOString();
  }
}

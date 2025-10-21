/**
 * Mock Adapter
 * Mock adapter that simulates Fulfillment behavior for testing and development
 */

import {
  IFulfillmentAdapter,
  HealthStatus,
  OrderResult,
  AdapterError,
  InvalidInputError,
  FulfillmentToolResult,
} from '../../types/adapter.js';
import { MockData } from './mock-data.js';
import { MockConfig } from './mock-config.js';
import { Logger } from '../../utils/logger.js';
import { IdGenerator, DateUtils } from '../../utils/index.js';
import {
  CreateSalesOrderInput,
  CreateSalesOrderInputSchema,
  CancelOrderInput,
  CancelOrderInputSchema,
  Fulfillment,
  FulfillOrderInput,
  FulfillOrderInputSchema,
  GetCustomersInput,
  GetCustomersInputSchema,
  GetFulfillmentsInput,
  GetFulfillmentsInputSchema,
  GetInventoryInput,
  GetInventoryInputSchema,
  GetOrdersInput,
  GetOrdersInputSchema,
  GetProductsInput,
  GetProductsInputSchema,
  GetProductVariantsInput,
  GetProductVariantsInputSchema,
  Inventory,
  Order,
  OrderLineItem,
  Product,
  ProductVariant,
  UpdateOrderInput,
  UpdateOrderInputSchema,
  Customer,
} from '../../schemas/index.js';

export class MockAdapter implements IFulfillmentAdapter {
  private mockData: MockData;
  private config: MockConfig;
  private connected: boolean = false;

  constructor(config: any = {}) {
    // Extract options from AdapterConfig if present
    const options = config.options || config;
    this.config = new MockConfig(options);
    this.mockData = new MockData();
    Logger.info('Mock adapter initialized', { config: this.config.getSummary() });
  }

  // Helper Methods
  private ensureConnected(): void {
    if (!this.connected) {
      throw new AdapterError('Adapter not connected', 'NOT_CONNECTED');
    }
  }

  // Lifecycle Methods
  async connect(): Promise<void> {
    await this.simulateLatency();

    if (this.shouldSimulateError('connect')) {
      throw new AdapterError('Mock error: Connection failed', 'CONNECTION_FAILED');
    }

    this.connected = true;
    Logger.info('Mock adapter connected');
  }

  async disconnect(): Promise<void> {
    await this.simulateLatency();
    this.connected = false;
    Logger.info('Mock adapter disconnected');
  }

  async healthCheck(): Promise<HealthStatus> {
    const dataSize = this.mockData.getSize();

    return {
      status: this.connected ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: [
        {
          name: 'connection',
          status: this.connected ? 'pass' : 'fail',
          message: this.connected ? 'Connected' : 'Not connected',
        },
        {
          name: 'data_store',
          status: 'pass',
          message: `${dataSize.orders} orders, ${dataSize.products} products, ${dataSize.productVariants} variants in memory`,
        },
        {
          name: 'configuration',
          status: 'pass',
          message: 'Mock configuration loaded',
          details: this.config.getSummary(),
        },
      ],
    };
  }

  // Order Actions
  async createSalesOrder(params: CreateSalesOrderInput): Promise<OrderResult> {
    await this.simulateLatency();
    this.ensureConnected();

    if (this.shouldSimulateError('captureOrder')) {
      throw new AdapterError('Mock error: Order capture failed', 'OPERATION_FAILED');
    }

    const parseResult = CreateSalesOrderInputSchema.safeParse(params);

    if (!parseResult.success) {
      throw new InvalidInputError(parseResult.error.message, parseResult.error.issues);
    }
    const { order } = parseResult.data;

    const orderId = IdGenerator.orderId();

    // Calculate totals
    const items: OrderLineItem[] = (order.lineItems || []).map((item, index) => {
      const quantity = item.quantity ?? 1;
      const unitPrice = item.unitPrice ?? 0;
      const totalPrice = item.totalPrice ?? unitPrice * quantity;
      const lineItemId = item.id ?? `LI-${IdGenerator.random(8)}`;

      return {
        ...item,
        id: lineItemId,
        sku: item.sku ?? `SKU-${index + 1}`,
        quantity,
        unitPrice,
        totalPrice,
        name: item.name ?? `Item ${index + 1}`,
        customFields: item.customFields ?? [],
      };
    });
    const subTotalPrice = this.calculateSubtotal(items);
    const orderTax = subTotalPrice * 0.08; // 8% tax
    const shippingPrice = subTotalPrice > 100 ? 0 : 10; // Free shipping over $100
    const totalPrice = subTotalPrice + orderTax + shippingPrice;

    // Store order in mock data
    const savedOrder = {
      ...order,
      status: 'confirmed',
      customer: this.buildCustomer(order.customer),
      lineItems: items,
      billingAddress: this.buildAddress(order.billingAddress),
      shippingAddress: this.buildAddress(order.shippingAddress),
      currency: order.currency ?? 'USD',
      subTotalPrice,
      orderTax,
      shippingPrice,
      totalPrice,
      createdAt: DateUtils.now(),
      updatedAt: DateUtils.now(),
      customFields: order.customFields || [],
      tenantId: (order as Partial<Order>).tenantId ?? 'mock-tenant',
      id: orderId,
    } as unknown as Order & { orderId: string };

    savedOrder.orderId = orderId;

    this.mockData.addOrder(savedOrder);

    Logger.info('Order captured', { orderId, totalPrice });

    return {
      success: true,
      order: savedOrder,
    };
  }

  async cancelOrder(input: CancelOrderInput): Promise<OrderResult> {
    await this.simulateLatency();
    this.ensureConnected();

    if (this.shouldSimulateError('cancelOrder')) {
      throw new AdapterError('Mock error: Order cancellation failed', 'OPERATION_FAILED');
    }

    const parseResult = CancelOrderInputSchema.safeParse(input);
    if (!parseResult.success) {
      throw new InvalidInputError(parseResult.error.message, parseResult.error.issues);
    }

    const {
      data: { orderId, reason, lineItems, notifyCustomer, notes },
    } = parseResult;

    const order = this.mockData.getOrder(orderId);
    if (!order) {
      throw new AdapterError(`Order not found: ${orderId}`, 'ORDER_NOT_FOUND', { orderId });
    }

    if (order.status === 'cancelled') {
      throw new AdapterError(`Cannot cancel order ${orderId} in status cancelled`, 'INVALID_ORDER_STATE', {
        orderId,
        currentStatus: 'cancelled',
        operation: 'cancel',
      });
    }

    if (['shipped', 'delivered'].includes(order.status as any)) {
      throw new AdapterError(`Cannot cancel order ${orderId} in status ${order.status}`, 'INVALID_ORDER_STATE', {
        orderId,
        currentStatus: order.status,
        operation: 'cancel',
      });
    }

    // Update order status
    order.status = 'cancelled';
    order.updatedAt = DateUtils.now();

    Logger.info('Order cancelled', {
      orderId,
      reason,
      lineItems,
      notifyCustomer,
      notes,
    });

    return {
      success: true,
      order,
    };
  }

  async updateOrder(input: UpdateOrderInput): Promise<OrderResult> {
    await this.simulateLatency();
    this.ensureConnected();

    if (this.shouldSimulateError('updateOrder')) {
      throw new AdapterError('Mock error: Order update failed', 'OPERATION_FAILED');
    }

    const parseResult = UpdateOrderInputSchema.safeParse(input);
    if (!parseResult.success) {
      throw new InvalidInputError(parseResult.error.message, parseResult.error.issues);
    }

    const {
      data: { id: orderId, updates },
    } = parseResult;

    const order = this.mockData.getOrder(orderId);
    if (!order) {
      throw new AdapterError(`Order not found: ${orderId}`, 'ORDER_NOT_FOUND', { orderId });
    }

    const updatedFields = Object.keys(updates);

    if (updates.lineItems) {
      order.lineItems = updates.lineItems.map((item) => {
        const quantity = item.quantity ?? 1;
        const unitPrice = item.unitPrice ?? 0;
        const totalPrice = item.totalPrice ?? unitPrice * quantity;
        const id = item.lineItemId ?? `LI-${IdGenerator.random(8)}`;

        return {
          ...item,
          id,
          totalPrice,
          sku: item.sku ?? `SKU-${IdGenerator.random(4)}`,
          quantity,
          unitPrice,
          name: item.name ?? `Item ${IdGenerator.random(4)}`,
          customFields: item.customFields ?? [],
        } as OrderLineItem;
      });
    }

    const updatesToApply = { ...updates } as Partial<Order>;
    if ('lineItems' in updatesToApply) {
      delete updatesToApply.lineItems;
    }
    if (updatesToApply.billingAddress) {
      updatesToApply.billingAddress = this.buildAddress(updatesToApply.billingAddress);
    }
    if (updatesToApply.shippingAddress) {
      updatesToApply.shippingAddress = this.buildAddress(updatesToApply.shippingAddress);
    }
    if (updatesToApply.customer) {
      updatesToApply.customer = this.buildCustomer(updatesToApply.customer);
    }

    // Apply updates
    Object.assign(order, updatesToApply);
    order.updatedAt = DateUtils.now();

    Logger.info('Order updated', { orderId, updatedFields });

    return {
      success: true,
      order,
    };
  }

  async fulfillOrder(input: FulfillOrderInput): Promise<
    | {
        success: true;
        fulfillment: Fulfillment;
      }
    | {
        success: false;
        error: AdapterError;
      }
  > {
    await this.simulateLatency();
    this.ensureConnected();

    const parseResult = FulfillOrderInputSchema.safeParse(input);
    if (!parseResult.success) {
      return {
        success: false,
        error: new InvalidInputError(parseResult.error.message, parseResult.error.issues),
      };
    }

    const {
      data: { orderId, shippingInfo, items, shippingAddress },
    } = parseResult;

    const order = this.mockData.getOrder(orderId);
    if (!order) {
      return {
        success: false,
        error: new AdapterError(`Order not found: ${orderId}`, 'ORDER_NOT_FOUND', { orderId }),
      };
    }

    if (this.shouldSimulateError('shipOrder')) {
      return {
        success: false,
        error: new AdapterError('Mock error: Shipment processing failed', 'OPERATION_FAILED'),
      };
    }

    if (order.status === 'cancelled') {
      return {
        success: false,
        error: new AdapterError(`Cannot ship order ${orderId} in status cancelled`, 'INVALID_ORDER_STATE', {
          orderId,
          currentStatus: 'cancelled',
          operation: 'ship',
        }),
      };
    }

    const fulfillmentId = IdGenerator.fulfillmentId();
    // Use provided tracking number or generate one
    const trackingNumber = shippingInfo.trackingNumber || `TRACK-${fulfillmentId}`;
    const shippedAt = DateUtils.now();
    const resolvedShippingAddress = this.buildAddress(shippingAddress ?? order.shippingAddress ?? order.billingAddress);
    const baseTenantId = (order as Partial<Order>).tenantId ?? 'mock-tenant';
    const internalOrderId = this.getOrderId(order);

    // Update order status
    order.status = 'shipped';
    order.updatedAt = shippedAt;

    const fulfillment: Fulfillment = {
      id: fulfillmentId,
      externalId: `FULFILL-${fulfillmentId}`,
      shippingAddress: resolvedShippingAddress!,
      trackingNumber,
      shippingCarrier: shippingInfo.carrier,
      status: 'shipped',
      expectedDeliveryDate: shippingInfo.estimatedDelivery,
      orderId: internalOrderId,
      createdAt: shippedAt,
      updatedAt: shippedAt,
      tenantId: baseTenantId,
      lineItems: order.lineItems.filter((orderLineItem) => items.some((item) => item.sku === orderLineItem.sku)),
    };

    Logger.info('Order shipped', { orderId, fulfillmentId, trackingNumber });

    return {
      success: true,
      fulfillment,
    };
  }

  // Query Operations
  async getOrders(input: GetOrdersInput): Promise<
    | {
        success: true;
        orders: Order[];
      }
    | {
        success: false;
        error: AdapterError;
      }
  > {
    await this.simulateLatency();
    this.ensureConnected();

    const parseResult = GetOrdersInputSchema.safeParse(input);
    if (!parseResult.success) {
      return {
        success: false,
        error: new InvalidInputError(parseResult.error.message, parseResult.error.issues),
      };
    }

    if (this.shouldSimulateError('getOrder')) {
      return {
        success: false,
        error: new AdapterError('Mock error: Order retrieval failed', 'OPERATION_FAILED'),
      };
    }

    const orders: Order[] = [];
    const seen = new Set<string>();
    const data = parseResult.data;

    const addOrder = (ord: any) => {
      if (!ord) {
        return;
      }
      const cleanOrder: Order = {
        ...ord,
        customer: this.buildCustomer(ord.customer),
        billingAddress: this.buildAddress(ord.billingAddress, false),
        shippingAddress: this.buildAddress(ord.shippingAddress, false),
      };
      const key = this.getOrderId(cleanOrder);
      if (!seen.has(key)) {
        orders.push(cleanOrder);
        seen.add(key);
      }
    };

    data.orderIds?.forEach((orderId) => addOrder(this.mockData.getOrder(orderId)));
    data.extOrderIds?.forEach((extOrderId) => addOrder(this.mockData.getOrderByExtOrderId(extOrderId)));
    data.orderNames?.forEach((orderNumber) => addOrder(this.mockData.getOrderByNumber(orderNumber)));

    if (orders.length === 0) {
      const identifier = (data.orderIds?.[0] && { orderId: data.orderIds[0] }) ||
        (data.extOrderIds?.[0] && { extOrderId: data.extOrderIds[0] }) ||
        (data.orderNames?.[0] && { orderNumber: data.orderNames[0] }) || { orderId: 'unknown' };
      return {
        success: false,
        error: new AdapterError(`Order not found: ${JSON.stringify(identifier)}`, 'ORDER_NOT_FOUND', identifier),
      };
    }

    return {
      success: true,
      orders,
    };
  }

  async getInventory(input: GetInventoryInput): Promise<
    | {
        success: true;
        inventory: Inventory[];
      }
    | {
        success: false;
        error: AdapterError;
      }
  > {
    await this.simulateLatency();
    this.ensureConnected();

    if (this.shouldSimulateError('getInventory')) {
      return {
        success: false,
        error: new AdapterError('Mock error: Inventory retrieval failed', 'OPERATION_FAILED'),
      };
    }

    const parseResult = GetInventoryInputSchema.safeParse(input);
    if (!parseResult.success) {
      return {
        success: false,
        error: new InvalidInputError(parseResult.error.message, parseResult.error.issues),
      };
    }

    const data = parseResult.data;
    const results: Inventory[] = [];

    for (const sku of data.skus) {
      if (data.locationIds && data.locationIds.length > 0) {
        for (const locationId of data.locationIds) {
          results.push(this.mockData.getInventory(sku, locationId));
        }
      } else {
        results.push(this.mockData.getInventory(sku));
      }
    }

    return {
      success: true,
      inventory: results,
    };
  }

  async getProducts(input: GetProductsInput): Promise<
    | {
        success: true;
        products: Product[];
      }
    | {
        success: false;
        error: AdapterError;
      }
  > {
    await this.simulateLatency();
    this.ensureConnected();

    const parseResult = GetProductsInputSchema.safeParse(input);
    if (!parseResult.success) {
      return {
        success: false,
        error: new InvalidInputError(parseResult.error.message, parseResult.error.issues),
      };
    }

    if (this.shouldSimulateError('getProduct')) {
      return {
        success: false,
        error: new AdapterError('Mock error: Product retrieval failed', 'OPERATION_FAILED'),
      };
    }

    const data = parseResult.data;
    const products: Product[] = [];
    const seen = new Set<string>();

    const addProduct = (identifier?: string) => {
      if (!identifier) {
        return;
      }
      const product = this.mockData.getProduct(identifier);
      const key = product.id ?? product.externalId ?? identifier;
      if (!seen.has(key)) {
        products.push(product);
        seen.add(key);
        if (product.id) {
          seen.add(product.id);
        }
        if (product.externalId) {
          seen.add(product.externalId);
        }
        if (product.externalProductId) {
          seen.add(product.externalProductId);
        }
      }
    };

    data.ids?.forEach((id) => addProduct(id));
    data.skus?.forEach((sku) => addProduct(sku));

    if (products.length === 0) {
      const identifier = (data.ids?.[0] && { productId: data.ids[0] }) ||
        (data.skus?.[0] && { sku: data.skus[0] }) || { productId: 'unknown' };
      return {
        success: false,
        error: new AdapterError(`Product not found: ${JSON.stringify(identifier)}`, 'PRODUCT_NOT_FOUND', identifier),
      };
    }

    return {
      success: true,
      products,
    };
  }

  async getProductVariants(input: GetProductVariantsInput): Promise<
    | {
        success: true;
        productVariants: ProductVariant[];
      }
    | {
        success: false;
        error: AdapterError;
      }
  > {
    await this.simulateLatency();
    this.ensureConnected();

    const parseResult = GetProductVariantsInputSchema.safeParse(input);
    if (!parseResult.success) {
      return {
        success: false,
        error: new InvalidInputError(parseResult.error.message, parseResult.error.issues),
      };
    }

    if (this.shouldSimulateError('getProductVariants')) {
      return {
        success: false,
        error: new AdapterError('Mock error: Product variant retrieval failed', 'OPERATION_FAILED'),
      };
    }

    const data = parseResult.data;
    const variants: ProductVariant[] = [];
    const seen = new Set<string>();

    const addVariant = (identifier?: string) => {
      if (!identifier) {
        return;
      }

      const variant = this.mockData.getProductVariant(identifier);
      const key = variant.id ?? variant.sku ?? identifier;
      if (!seen.has(key)) {
        variants.push(variant);
        seen.add(key);
        if (variant.id) {
          seen.add(variant.id);
        }
        if (variant.sku) {
          seen.add(variant.sku);
        }
      }
    };

    data.variantIds?.forEach((variantId) => addVariant(variantId));
    data.skus?.forEach((sku) => addVariant(sku));

    data.productIds?.forEach((productId) => {
      const productVariants = this.mockData.getProductVariantsByProductId(productId);
      productVariants.forEach((variant) => addVariant(variant.id));
    });

    if (variants.length === 0) {
      const identifier = (data.variantIds?.[0] && { variantId: data.variantIds[0] }) ||
        (data.skus?.[0] && { sku: data.skus[0] }) ||
        (data.productIds?.[0] && { productId: data.productIds[0] }) || { variantId: 'unknown' };
      return {
        success: false,
        error: new AdapterError(
          `Product variant not found: ${JSON.stringify(identifier)}`,
          'PRODUCT_VARIANT_NOT_FOUND',
          identifier
        ),
      };
    }

    return {
      success: true,
      productVariants: variants,
    };
  }

  async getCustomers(input: GetCustomersInput): Promise<FulfillmentToolResult<{ customers: Customer[] }>> {
    await this.simulateLatency();
    this.ensureConnected();

    const parseResult = GetCustomersInputSchema.safeParse(input);
    if (!parseResult.success) {
      return {
        success: false,
        error: new InvalidInputError(parseResult.error.message, parseResult.error.issues),
      };
    }

    if (this.shouldSimulateError('getCustomer')) {
      return {
        success: false,
        error: new AdapterError('Mock error: Customer retrieval failed', 'OPERATION_FAILED'),
      };
    }

    const customers: Customer[] = [];
    const seen = new Set<string>();

    const addCustomer = (identifier?: string) => {
      if (!identifier) {
        return;
      }
      const customer = this.mockData.getCustomer(identifier);
      const key = customer.id ?? customer.email ?? identifier;
      if (!seen.has(key)) {
        customers.push(customer);
        seen.add(key);
      }
    };

    const data = parseResult.data;
    data.ids?.forEach((id) => addCustomer(id));
    data.emails?.forEach((email) => addCustomer(email));

    if (customers.length === 0) {
      const identifier = (data.ids?.[0] && { customerId: data.ids[0] }) ||
        (data.emails?.[0] && { email: data.emails[0] }) || {
          customerId: 'unknown',
        };
      return {
        success: false,
        error: new AdapterError(`Customer not found: ${JSON.stringify(identifier)}`, 'CUSTOMER_NOT_FOUND', identifier),
      };
    }

    return {
      success: true,
      customers,
    };
  }

  async getFulfillments(input: GetFulfillmentsInput): Promise<
    | {
        success: true;
        fulfillments: Fulfillment[];
      }
    | {
        success: false;
        error: AdapterError;
      }
  > {
    await this.simulateLatency();
    this.ensureConnected();

    const parseResult = GetFulfillmentsInputSchema.safeParse(input);
    if (!parseResult.success) {
      return {
        success: false,
        error: new InvalidInputError(parseResult.error.message, parseResult.error.issues),
      };
    }

    if (this.shouldSimulateError('getShipment')) {
      return {
        success: false,
        error: new AdapterError('Mock error: Shipment retrieval failed', 'OPERATION_FAILED'),
      };
    }

    const data = parseResult.data;
    const fulfillments: Fulfillment[] = [];

    const now = DateUtils.now();
    const targetIds = data.ids?.length ? data.ids : [IdGenerator.fulfillmentId()];

    for (const fulfillmentId of targetIds) {
      const requestedOrderId = data.orderIds?.[0] ?? `order_${IdGenerator.random(6)}`;
      const order = this.mockData.getOrder(requestedOrderId);
      const address = this.buildAddress(order?.shippingAddress ?? order?.billingAddress, true)!;
      const resolvedOrderId = order ? this.getOrderId(order) : requestedOrderId;

      fulfillments.push({
        id: fulfillmentId,
        externalId: `FULFILL-${fulfillmentId}`,
        shippingAddress: address,
        lineItems: order?.lineItems ?? [],
        orderId: resolvedOrderId,
        trackingNumber: `TRACK-${fulfillmentId}`,
        shippingCarrier: 'USPS',
        status: 'shipped',
        createdAt: now,
        updatedAt: now,
        tenantId: (order as Partial<Order>)?.tenantId ?? 'mock-tenant',
        tags: [],
      });
    }

    return {
      success: true,
      fulfillments,
    };
  }

  // Helper Methods
  private async simulateLatency(): Promise<void> {
    const delay = this.config.getLatency();
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  private shouldSimulateError(operation: string): boolean {
    return this.config.shouldSimulateError(operation);
  }

  private buildAddress(
    address?: Partial<Order['shippingAddress']>,
    fallback: boolean = true
  ): Order['shippingAddress'] | undefined {
    if (!address && !fallback) {
      return undefined;
    }

    const base = address ?? {};
    return {
      address1: base.address1 ?? '123 Mock St',
      address2: base.address2,
      city: base.city ?? 'Sample City',
      company: base.company ?? 'Mock Company',
      country: base.country ?? 'US',
      email: base.email ?? 'mock.customer@example.com',
      firstName: base.firstName ?? 'Mock',
      lastName: base.lastName ?? 'Customer',
      phone: base.phone ?? '555-0100',
      stateOrProvince: base.stateOrProvince ?? 'CA',
      zipCodeOrPostalCode: base.zipCodeOrPostalCode ?? '90210',
    };
  }

  private buildCustomer(customer?: Partial<Order['customer']>): Order['customer'] | undefined {
    if (!customer) {
      return undefined;
    }

    return {
      ...customer,
      id: customer.id ?? `CUST-${IdGenerator.random(6)}`,
      externalId: customer.externalId ?? `CUST-${IdGenerator.random(6)}`,
      firstName: customer.firstName ?? 'Mock',
      lastName: customer.lastName ?? 'Customer',
      type: customer.type ?? 'individual',
      createdAt: DateUtils.now(),
      updatedAt: DateUtils.now(),
      tenantId: (customer as Partial<Customer>).tenantId ?? 'mock-tenant',
      addresses: customer.addresses ?? [],
      customFields: customer.customFields ?? [],
      tags: customer.tags ?? [],
    };
  }

  private getOrderId(order: Partial<Order> & { orderId?: string; extOrderId?: string }): string {
    return (
      (order as any).orderId ??
      order.id ??
      (order as any).extOrderId ??
      order.externalId ??
      `order-${IdGenerator.random(6)}`
    );
  }

  private cleanObject(obj: any): any {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== null && value !== undefined) {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  private calculateSubtotal(items: OrderLineItem[]): number {
    return items.reduce((sum, item) => {
      // Use totalPrice if available, otherwise calculate from quantity * unitPrice
      if (item.totalPrice) {
        return sum + item.totalPrice;
      }
      const quantity = item.quantity || 1;
      const price = item.unitPrice || 50.0; // Default price for mock calculation
      return sum + quantity * price;
    }, 0);
  }
}

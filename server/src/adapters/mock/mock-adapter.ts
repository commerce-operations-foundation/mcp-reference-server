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
  InventoryItem,
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
      status: 'new',
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

    this.mockData.orders.set(orderId, savedOrder);

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

    const order = this.mockData.orders.get(orderId);
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

    const order = this.mockData.orders.get(orderId);
    if (!order) {
      throw new AdapterError(`Order not found: ${orderId}`, 'ORDER_NOT_FOUND', { orderId });
    }

    const updatedFields = Object.keys(updates);

    if (updates.lineItems) {
      order.lineItems = updates.lineItems.map((item) => {
        const quantity = item.quantity ?? 1;
        const unitPrice = item.unitPrice ?? 0;
        const totalPrice = item.totalPrice ?? unitPrice * quantity;

        return {
          ...item,
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
      data: { orderId, trackingNumber, lineItems, shippingAddress, shippingCarrier, expectedDeliveryDate },
    } = parseResult;

    const order = this.mockData.orders.get(orderId);

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
      shippingCarrier,
      status: 'shipped',
      expectedDeliveryDate,
      orderId: internalOrderId,
      createdAt: shippedAt,
      updatedAt: shippedAt,
      tenantId: baseTenantId,
      lineItems: order.lineItems.filter((orderLineItem) =>
        lineItems.some((item: { sku: string }) => item.sku === orderLineItem.sku)
      ),
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

    let orders: Order[] = Array.from(this.mockData.orders.values());
    const data = parseResult.data;

    if (data.ids) {
      orders = orders.filter((order) => data.ids!.includes(order.id));
    }
    if (data.externalIds) {
      orders = orders.filter((order) => data.externalIds!.includes(order.externalId!));
    }
    if (data.names) {
      orders = orders.filter((order) => data.names!.includes(order.name!));
    }

    return {
      success: true,
      orders,
    };
  }

  async getInventory(input: GetInventoryInput): Promise<
    | {
        success: true;
        inventory: InventoryItem[];
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
    const results: InventoryItem[] = [];

    for (const sku of data.skus) {
      if (data.locationIds && data.locationIds.length > 0) {
        for (const locationId of data.locationIds) {
          results.push(this.getInventoryItem(sku, locationId));
        }
      } else {
        results.push(this.getInventoryItem(sku));
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
      const product = this.resolveProduct(identifier);
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

      const variant = this.resolveProductVariant(identifier);
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

    data.ids?.forEach((id) => addVariant(id));
    data.skus?.forEach((sku) => addVariant(sku));
    data.productIds?.forEach((productId) => {
      const productVariants = this.getProductVariantsByProductId(productId);
      productVariants.forEach((variant) => addVariant(variant.id));
    });

    if (variants.length === 0) {
      const identifier = (data.ids?.[0] && { id: data.ids[0] }) ||
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
      const customer = this.resolveCustomer(identifier);
      const key = customer.id ?? customer.email ?? identifier;
      if (!seen.has(key)) {
        customers.push(customer);
        seen.add(key);
      }
    };

    const filter = parseResult.data;
    filter.ids?.forEach((id) => addCustomer(id));
    filter.emails?.forEach((email) => addCustomer(email));

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
      const order = this.mockData.orders.get(requestedOrderId);
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

  private resolveProductId(identifier: string): string | undefined {
    if (this.mockData.products.has(identifier)) {
      return identifier;
    }

    const alias = this.mockData.productAliases.get(identifier);
    if (alias) {
      return alias;
    }

    const variant = this.findVariant(identifier);
    if (variant) {
      return variant.productId;
    }

    return undefined;
  }

  private findVariant(identifier: string): ProductVariant | undefined {
    // Check if identifier is a direct ID
    if (this.mockData.productVariants.has(identifier)) {
      return this.mockData.productVariants.get(identifier);
    }

    // Search through all variants for matching sku, externalId, or externalProductId
    for (const variant of this.mockData.productVariants.values()) {
      if (variant.sku === identifier || variant.externalId === identifier) {
        return variant;
      }
    }

    return undefined;
  }

  private resolveProduct(identifier: string | undefined): Product {
    if (!identifier) {
      throw new Error('Product identifier is required');
    }

    const resolvedProductId = this.resolveProductId(identifier);
    if (resolvedProductId) {
      const product = this.mockData.products.get(resolvedProductId);
      if (product) {
        return product;
      }
    }

    return this.createDynamicProductAndVariant(identifier).product;
  }

  private resolveProductVariant(identifier: string | undefined): ProductVariant {
    if (!identifier) {
      throw new Error('Product variant identifier is required');
    }

    const variant = this.findVariant(identifier);
    if (variant) {
      return variant;
    }

    // If identifier refers to a product, return the first known variant or create one dynamically
    const productId = this.resolveProductId(identifier);
    if (productId) {
      const variants = this.getProductVariantsByProductId(productId);
      if (variants.length > 0) {
        return variants[0];
      }

      return this.createAdHocVariant(identifier, productId);
    }

    // Fall back to dynamically generating both product and variant for unknown identifiers
    return this.createDynamicProductAndVariant(identifier).variant;
  }

  private getProductVariantsByProductId(productId: string): ProductVariant[] {
    return Array.from(this.mockData.productVariants.values()).filter((variant) => variant.productId === productId);
  }

  private createDynamicProductAndVariant(identifier: string): { product: Product; variant: ProductVariant } {
    const productId = `prod_${identifier}`;
    const variantId = `variant_${identifier}`;

    const product: Product = {
      id: productId,
      externalId: productId,
      externalProductId: productId,
      name: `Dynamic Product ${identifier}`,
      description: `Auto-generated product for ${identifier}`,
      status: 'active',
      tags: ['generated'],
      vendor: 'DynamicVendor',
      categories: ['Generated'],
      options: [],
      imageURLs: [],
      customFields: [
        { name: 'generated', value: 'true' },
        { name: 'timestamp', value: DateUtils.now() },
      ],
      createdAt: DateUtils.now(),
      updatedAt: DateUtils.now(),
      tenantId: 'tenant_dynamic',
    };

    const variant: ProductVariant = {
      id: variantId,
      productId,
      externalId: variantId,
      externalProductId: productId,
      sku: identifier,
      title: `Dynamic Variant ${identifier}`,
      barcode: identifier,
      price: 0,
      currency: 'USD',
      cost: 0,
      costCurrency: 'USD',
      weight: { value: 0.5, unit: 'lb' },
      imageURLs: [],
      selectedOptions: [],
      inventoryNotTracked: true,
      taxable: false,
      customFields: [{ name: 'generated', value: 'true' }],
      createdAt: DateUtils.now(),
      updatedAt: DateUtils.now(),
      tenantId: 'tenant_dynamic',
    };

    this.mockData.products.set(productId, product);
    this.mockData.productAliases.set(productId, productId);

    this.mockData.productVariants.set(variantId, variant);
    this.mockData.productAliases.set(identifier, productId);

    return { product, variant };
  }

  private createAdHocVariant(identifier: string, productId: string): ProductVariant {
    const variantId = `variant_${productId}_${Date.now()}`;
    const externalVariantId = `ext_variant_${productId}_${Date.now()}`;
    const variant: ProductVariant = {
      id: variantId,
      externalId: externalVariantId,
      externalProductId: productId,
      productId,
      sku: identifier,
      title: `Generated Variant ${identifier}`,
      createdAt: DateUtils.now(),
      updatedAt: DateUtils.now(),
      tenantId: 'tenant_dynamic',
    };

    this.mockData.productVariants.set(variantId, variant);
    this.mockData.productAliases.set(identifier, productId);

    return variant;
  }

  private resolveCustomer(identifier: string | undefined): Customer {
    if (!identifier) {
      throw new Error('Customer identifier is required');
    }

    const customer = this.mockData.customers.get(identifier);

    if (!customer) {
      // Generate a dynamic customer if not found
      return {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tenantId: 'tenant_001',
        id: `cust_${identifier}`,
        firstName: 'Generated',
        lastName: 'Customer',
        email: identifier.includes('@') ? identifier : `${identifier}@example.com`,
        phone: '555-0100',
        type: 'individual',
        addresses: [
          {
            name: 'home',
            address: {
              address1: '123 Generic St',
              city: 'Sample City',
              stateOrProvince: 'CA',
              zipCodeOrPostalCode: '90210',
              country: 'US',
              company: 'N/A',
              email: identifier.includes('@') ? identifier : `${identifier}@example.com`,
              firstName: 'Generated',
              lastName: 'Customer',
            },
          },
        ],
        customFields: [
          { name: 'generated', value: 'true' },
          { name: 'timestamp', value: DateUtils.now() },
        ],
      };
    }

    return customer;
  }

  private getInventoryItem(sku: string, locationId: string = 'WH001'): InventoryItem {
    const key = `${sku}_${locationId}`;
    const inventory = this.mockData.inventory.get(key);

    if (!inventory) {
      const unavailable = Math.floor(Math.random() * 20);
      const onHand = unavailable + Math.floor(Math.random() * 100) + 10;
      const available = onHand - unavailable;

      return {
        sku,
        locationId,
        onHand,
        unavailable,
        available,
        tenantId: 'tenant_001',
      };
    }

    return inventory;
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

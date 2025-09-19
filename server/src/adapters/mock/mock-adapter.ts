/**
 * Mock Adapter
 * Mock adapter that simulates Fulfillment behavior for testing and development
 */

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
  ReservationRequest,
  ReservationResult,
  AdapterError,
  OrderNotFoundError,
  InvalidOrderStateError
} from '../../types/adapter.js';
import {
  Order,
  Customer,
  Product,
  Inventory,
  Shipment,
  Buyer,
  OrderIdentifier,
  ProductIdentifier,
  CustomerIdentifier,
  ShipmentIdentifier,
  HoldParams,
  SplitParams,
  ReturnItem,
  ExchangeParams,
  OrderUpdates,
  ShippingInfo,
  OrderLineItem,
  OrderRequest
} from '../../types/fulfillment.js';
import { MockData } from './mock-data.js';
import { MockConfig } from './mock-config.js';
import { Logger } from '../../utils/logger.js';
import { IdGenerator, DateUtils } from '../../utils/index.js';

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
          message: this.connected ? 'Connected' : 'Not connected'
        },
        {
          name: 'data_store',
          status: 'pass',
          message: `${dataSize.orders} orders, ${dataSize.products} products in memory`
        },
        {
          name: 'configuration',
          status: 'pass',
          message: 'Mock configuration loaded',
          details: this.config.getSummary()
        }
      ]
    };
  }

  // Order Actions
  async captureOrder(order: OrderRequest): Promise<OrderResult> {
    await this.simulateLatency();
    this.ensureConnected();

    if (this.shouldSimulateError('captureOrder')) {
      throw new AdapterError('Mock error: Order capture failed', 'OPERATION_FAILED');
    }

    if (!order.extOrderId) {
      throw new AdapterError('Order ID is required (extOrderId)', 'VALIDATION_ERROR');
    }

    // Validate required fields
    if (!order.customer) {
      throw new AdapterError('Customer is required', 'VALIDATION_ERROR');
    }

    if (!order.lineItems || order.lineItems.length === 0) {
      throw new AdapterError('At least one line item is required', 'VALIDATION_ERROR');
    }

    const orderId = IdGenerator.orderId();
    // orderNumber not in schema - removed

    // Calculate totals
    const items = order.lineItems || [];
    const subTotalPrice = this.calculateSubtotal(items);
    const orderTax = subTotalPrice * 0.08; // 8% tax
    const shippingPrice = subTotalPrice > 100 ? 0 : 10; // Free shipping over $100
    const totalPrice = subTotalPrice + orderTax + shippingPrice;

    // Store order in mock data
    const savedOrder = {
      orderId,
      // orderNumber not in schema
      extOrderId: order.extOrderId,
      status: 'confirmed',
      customer: order.customer,
      lineItems: items,
      billingAddress: order.billingAddress,
      shippingAddress: order.shippingAddress,
      currency: order.currency || 'USD',
      subTotalPrice,
      orderTax,
      shippingPrice,
      totalPrice,
      createdAt: DateUtils.now(),
      updatedAt: DateUtils.now(),
      customFields: order.customFields || []
    };

    this.mockData.addOrder(savedOrder);

    Logger.info('Order captured', { orderId, totalPrice });

    return {
      success: true,
      orderId,
      status: 'confirmed',
      createdAt: savedOrder.createdAt
    };
  }

  async cancelOrder(
    orderId: string,
    reason?: string
  ): Promise<CancelResult> {
    await this.simulateLatency();
    this.ensureConnected();

    if (this.shouldSimulateError('cancelOrder')) {
      throw new AdapterError('Mock error: Order cancellation failed', 'OPERATION_FAILED');
    }

    const order = this.mockData.getOrder(orderId);
    if (!order) {
      throw new OrderNotFoundError({ orderId });
    }

    if (order.status === 'cancelled') {
      throw new InvalidOrderStateError(orderId, 'cancelled', 'cancel');
    }

    if (['shipped', 'delivered'].includes(order.status)) {
      throw new InvalidOrderStateError(orderId, order.status, 'cancel');
    }

    // Update order status
    order.status = 'cancelled';
    order.cancelledAt = DateUtils.now();
    order.cancelReason = reason;
    order.updatedAt = DateUtils.now();

    Logger.info('Order cancelled', { orderId, reason });

    return {
      success: true,
      orderId,
      status: 'cancelled',
      cancelledAt: order.cancelledAt,
      refundInitiated: true
    };
  }

  async updateOrder(orderId: string, updates: OrderUpdates): Promise<UpdateResult> {
    await this.simulateLatency();
    this.ensureConnected();

    if (this.shouldSimulateError('updateOrder')) {
      throw new AdapterError('Mock error: Order update failed', 'OPERATION_FAILED');
    }

    const order = this.mockData.getOrder(orderId);
    if (!order) {
      throw new OrderNotFoundError({ orderId });
    }

    const updatedFields = Object.keys(updates);

    // Apply updates
    Object.assign(order, updates, {
      updatedAt: DateUtils.now()
    });

    Logger.info('Order updated', { orderId, updatedFields });

    return {
      success: true,
      orderId,
      updatedFields
    };
  }

  async returnOrder(
    orderId: string,
    items: ReturnItem[]
  ): Promise<ReturnResult> {
    await this.simulateLatency();
    this.ensureConnected();

    if (this.shouldSimulateError('returnOrder')) {
      throw new AdapterError('Mock error: Return processing failed', 'OPERATION_FAILED');
    }

    const order = this.mockData.getOrder(orderId);
    if (!order) {
      throw new OrderNotFoundError({ orderId });
    }

    const returnId = IdGenerator.returnId();
    const rmaNumber = IdGenerator.rmaNumber();
    const refundAmount = items.reduce((sum, item) => sum + (50.00 * item.quantity), 0); // Fixed price for mock

    Logger.info('Return processed', { orderId, returnId, refundAmount });

    return {
      success: true,
      returnId,
      rmaNumber,
      status: 'pending',
      refundAmount
    };
  }

  async exchangeOrder(
    params: ExchangeParams
  ): Promise<ExchangeResult> {
    await this.simulateLatency();
    this.ensureConnected();

    if (this.shouldSimulateError('exchangeOrder')) {
      throw new AdapterError('Mock error: Exchange processing failed', 'OPERATION_FAILED');
    }

    const order = this.mockData.getOrder(params.orderId);
    if (!order) {
      throw new OrderNotFoundError({ orderId: params.orderId });
    }

    const exchangeId = IdGenerator.exchangeId();
    const newOrderId = IdGenerator.orderId();
    // orderNumber not in schema - removed
    const priceDifference = 0; // Calculate from params if needed

    // Create the new order with exchanged items
    if (params.newItems && params.newItems.length > 0) {
      const newOrder: Order = {
        ...order,
        orderId: newOrderId,
        // orderNumber not in schema
        extOrderId: `EXCHANGE-${order.extOrderId}`,
        lineItems: params.newItems.map(item => ({
          ...item,
          lineItemId: `LI-${IdGenerator.random(8)}`,
          ordered: item.quantity
        })),
        status: 'processing',
        createdAt: DateUtils.now(),
        updatedAt: DateUtils.now(),
        customFields: [
          { name: 'exchangeFrom', value: params.orderId },
          { name: 'exchangeId', value: exchangeId }
        ]
      };

      // Add the new order to mock data
      this.mockData.addOrder(newOrder);
    }

    Logger.info('Exchange processed', { orderId: params.orderId, exchangeId, newOrderId });

    return {
      success: true,
      exchangeId,
      originalOrderId: params.orderId,
      newOrderId,
      priceDifference,
      rmaNumber: `RMA-${Date.now()}-${IdGenerator.random(4)}`
    };
  }

  async shipOrder(orderId: string, shipping: ShippingInfo): Promise<ShipmentResult> {
    await this.simulateLatency();
    this.ensureConnected();

    if (this.shouldSimulateError('shipOrder')) {
      throw new AdapterError('Mock error: Shipment processing failed', 'OPERATION_FAILED');
    }

    const order = this.mockData.getOrder(orderId);
    if (!order) {
      throw new OrderNotFoundError({ orderId });
    }

    if (order.status === 'cancelled') {
      throw new InvalidOrderStateError(orderId, 'cancelled', 'ship');
    }

    const shipmentId = IdGenerator.shipmentId();
    // Use provided tracking number or generate one
    const trackingNumber = shipping.trackingNumber || `TRACK-${shipmentId}`;

    // Update order status
    order.status = 'shipped';
    order.shippedAt = DateUtils.now();
    order.updatedAt = DateUtils.now();

    Logger.info('Order shipped', { orderId, shipmentId, trackingNumber });

    return {
      success: true,
      shipmentId,
      trackingNumber,
      carrier: shipping.carrier,
      shippedAt: order.shippedAt,
      estimatedDelivery: shipping.estimatedDelivery
    };
  }

  // Management Operations
  async holdOrder(orderId: string, holdParams: HoldParams): Promise<HoldResult> {
    await this.simulateLatency();
    this.ensureConnected();

    if (this.shouldSimulateError('holdOrder')) {
      throw new AdapterError('Mock error: Hold processing failed', 'OPERATION_FAILED');
    }

    const order = this.mockData.getOrder(orderId);
    if (!order) {
      throw new OrderNotFoundError({ orderId });
    }

    const holdId = IdGenerator.holdId();

    order.status = 'on_hold';
    order.holdId = holdId;
    order.holdReason = holdParams.reason;
    order.holdUntil = holdParams.releaseDate;
    order.updatedAt = DateUtils.now();

    Logger.info('Order placed on hold', { orderId, holdId, reason: holdParams.reason });

    return {
      success: true,
      orderId,
      holdId,
      status: 'on_hold',
      reason: holdParams.reason
    };
  }

  async splitOrder(orderId: string, splits: SplitParams[]): Promise<SplitResult> {
    await this.simulateLatency();
    this.ensureConnected();

    if (this.shouldSimulateError('splitOrder')) {
      throw new AdapterError('Mock error: Split processing failed', 'OPERATION_FAILED');
    }

    const order = this.mockData.getOrder(orderId);
    if (!order) {
      throw new OrderNotFoundError({ orderId });
    }

    const newOrderIds: string[] = [];

    // Create new orders for each split
    for (const split of splits) {
      const newOrderId = IdGenerator.orderId();
      // orderNumber not in schema - using orderId for identification

      const newOrder: Order = {
        ...order,
        orderId: newOrderId,
        // orderNumber not in schema
        extOrderId: `SPLIT-${order.extOrderId}-${newOrderIds.length + 1}`,
        lineItems: split.items ? split.items.map(item => {
          // Find the original line item to get details
          const origItem = order.lineItems.find((li: any) =>
            li.lineItemId === item.lineItemId
          );

          return {
            lineItemId: `LI-${IdGenerator.random(8)}`,
            sku: origItem?.sku || 'UNKNOWN',
            name: origItem?.name || 'Unknown Product',
            ordered: item.quantity,
            unitPrice: origItem?.unitPrice || 0,
            totalPrice: (origItem?.unitPrice || 0) * item.quantity
          };
        }) : order.lineItems,  // If no items specified, use all items from original order
        status: 'processing',
        shippingAddress: order.shippingAddress,
        billingAddress: order.billingAddress,
        customer: order.customer,
        // buyer not in schema - removed
        // Using schema-compliant date fields
        extOrderCreatedAt: new Date().toISOString(),
        shipByDate: order.shipByDate,
        expectedDeliveryDate: order.expectedDeliveryDate,
        shipAfterDate: order.shipAfterDate,
        shippingCarrier: order.shippingCarrier,
        locationId: split.locationId || order.locationId
      };

      this.mockData.addOrder(newOrder);
      newOrderIds.push(newOrderId);

      // Verify the order was added
      const verifyOrder = this.mockData.getOrder(newOrderId);
      if (!verifyOrder) {
        Logger.error('Failed to add split order to mock data', { newOrderId });
      } else {
        Logger.info('Split order added successfully', { newOrderId, orderId: newOrder.orderId });
      }
    }

    const splitCount = splits.length;

    Logger.info('Order split', { orderId, newOrderIds, splitCount });

    return {
      success: true,
      originalOrderId: orderId,
      newOrderIds,
      splitCount
    };
  }

  async reserveInventory(
    reservation: ReservationRequest
  ): Promise<ReservationResult> {
    await this.simulateLatency();
    this.ensureConnected();

    if (this.shouldSimulateError('reserveInventory')) {
      throw new AdapterError('Mock error: Inventory reservation failed', 'OPERATION_FAILED');
    }

    const { items, expiresInMinutes = 15 } = reservation;
    const reservationId = IdGenerator.reservationId();
    const expiresAt = DateUtils.addMinutes(expiresInMinutes);

    const reservedItems = items.map(item => {
      const inventory = this.mockData.getInventory(item.sku, item.locationId);
      const availableQty = inventory.available || inventory.onHand || 100; // Fallback to default
      const availableQuantity = Math.max(0, availableQty - item.quantity);

      return {
        sku: item.sku,
        reserved: Math.min(item.quantity, availableQty),
        available: availableQuantity
      };
    });

    Logger.info('Inventory reserved', { reservationId, itemCount: items.length, expiresInMinutes });

    return {
      success: true,
      reservationId,
      items: reservedItems,
      expiresAt: expiresAt.toISOString()
    };
  }

  // Query Operations
  async getOrder(identifier: OrderIdentifier): Promise<Order> {
    await this.simulateLatency();
    this.ensureConnected();

    if (this.shouldSimulateError('getOrder')) {
      throw new AdapterError('Mock error: Order retrieval failed', 'OPERATION_FAILED');
    }

    let order;
    if (identifier.orderId) {
      order = this.mockData.getOrder(identifier.orderId);
    } else if (identifier.orderNumber) {
      // Since Order schema doesn't have orderNumber field,
      // search by orderId first, then extOrderId
      order = this.mockData.getOrder(identifier.orderNumber);
      if (!order) {
        // Try as extOrderId
        order = this.mockData.getOrderByExtOrderId(identifier.orderNumber);
      }
    } else if (identifier.extOrderId) {
      // Search by external order ID
      order = this.mockData.getOrderByExtOrderId(identifier.extOrderId);
    }

    if (!order) {
      throw new OrderNotFoundError(identifier);
    }

    // Clean up the order to remove null values that would fail validation
    // Make sure to preserve all original fields including status
    const cleanOrder = {
      ...order,
      customer: order.customer ? this.cleanObject(order.customer) : undefined,
      billingAddress: order.billingAddress ? this.cleanObject(order.billingAddress) : undefined,
      shippingAddress: order.shippingAddress ? this.cleanObject(order.shippingAddress) : undefined,
      status: order.status // Make sure status is preserved
    };

    return cleanOrder;
  }

  async getInventory(sku: string, locationId?: string): Promise<Inventory> {
    await this.simulateLatency();
    this.ensureConnected();

    if (this.shouldSimulateError('getInventory')) {
      throw new AdapterError('Mock error: Inventory retrieval failed', 'OPERATION_FAILED');
    }

    return this.mockData.getInventory(sku, locationId || 'WH001');
  }

  async getProduct(identifier: ProductIdentifier): Promise<Product> {
    await this.simulateLatency();
    this.ensureConnected();

    if (this.shouldSimulateError('getProduct')) {
      throw new AdapterError('Mock error: Product retrieval failed', 'OPERATION_FAILED');
    }

    const id = identifier.productId || identifier.sku;
    return this.mockData.getProduct(id);
  }

  async getCustomer(identifier: CustomerIdentifier): Promise<Customer> {
    await this.simulateLatency();
    this.ensureConnected();

    if (this.shouldSimulateError('getCustomer')) {
      throw new AdapterError('Mock error: Customer retrieval failed', 'OPERATION_FAILED');
    }

    const id = identifier.customerId || identifier.email;
    return this.mockData.getCustomer(id);
  }

  async getShipment(identifier: ShipmentIdentifier): Promise<Shipment> {
    await this.simulateLatency();
    this.ensureConnected();

    if (this.shouldSimulateError('getShipment')) {
      throw new AdapterError('Mock error: Shipment retrieval failed', 'OPERATION_FAILED');
    }

    const shipmentId = identifier.shipmentId || IdGenerator.shipmentId();

    return {
      shipmentId,
      orderId: identifier.orderId || 'order_' + IdGenerator.random(6),
      extOrderId: 'ext_' + IdGenerator.random(6),
      status: 'shipped',
      shippingAddress: {
        address1: '123 Sample St',
        city: 'Sample City',
        stateOrProvince: 'CA',
        zipCodeOrPostalCode: '90210',
        country: 'US'
      },
      customFields: [
        { name: 'carrier', value: 'USPS' },
        { name: 'service_level', value: 'Ground' }
      ]
    };
  }

  async getBuyer(buyerId: string): Promise<Buyer> {
    await this.simulateLatency();
    this.ensureConnected();

    if (this.shouldSimulateError('getBuyer')) {
      throw new AdapterError('Mock error: Buyer retrieval failed', 'OPERATION_FAILED');
    }

    return {
      userId: buyerId,
      name: `Sample Buyer ${buyerId}`,
      email: `buyer_${buyerId}@example.com`,
      roles: ['purchaser']
    };
  }

  // Helper Methods
  private async simulateLatency(): Promise<void> {
    const delay = this.config.getLatency();
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  private shouldSimulateError(operation: string): boolean {
    return this.config.shouldSimulateError(operation);
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
      const quantity = item.quantity || item.ordered || 1;
      const price = item.unitPrice || 50.00; // Default price for mock calculation
      return sum + (quantity * price);
    }, 0);
  }
}

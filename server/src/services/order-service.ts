/**
 * Order Service
 * Handles all order-related operations
 */

import { 
  IFulfillmentAdapter, 
  OrderRequest,
  OrderResult,
  CancelResult,
  UpdateResult,
  ReturnResult,
  ExchangeResult,
  ShipmentResult,
  HoldResult,
  SplitResult,
  ReturnItem,
  ExchangeParams,
  OrderUpdates,
  ShippingInfo,
  HoldParams,
  SplitParams
} from '../types/index.js';
import { Logger } from '../utils/logger.js';
import { ValidationError } from '../utils/errors.js';
import { Sanitizer } from '../utils/index.js';
import { TimeoutHandler } from '../utils/timeout.js';
import { Transformer } from './transformer.js';
import { ErrorHandler } from './error-handler.js';

export class OrderService {
  constructor(
    private adapter: IFulfillmentAdapter,
    private transformer: Transformer,
    private errorHandler: ErrorHandler
  ) {
    Logger.debug('OrderService initialized');
  }

  /**
   * Capture/Create a new order
   */
  async captureOrder(params: OrderRequest): Promise<OrderResult> {
    return this.errorHandler.executeOperation('captureOrder', async () => {
      // Transform to adapter format
      const adapterParams = this.transformer.toAdapterFormat('order', params);
      
      Logger.info('Capturing order', { extOrderId: adapterParams.extOrderId });
      
      // Execute with adapter using timeout
      const result = await TimeoutHandler.withTimeout(
        () => this.adapter.captureOrder(adapterParams),
        'adapter'
      );
      
      Logger.info('Order captured successfully', { 
        orderId: result.orderId, 
        status: result.status 
      });
      
      // Transform response back to MCP format
      return this.transformer.toMCPFormat('orderResult', result);
    });
  }

  /**
   * Cancel an existing order
   */
  async cancelOrder(orderId: string, reason?: string): Promise<CancelResult> {
    return this.errorHandler.executeOperation('cancelOrder', async () => {
      const sanitizedOrderId = Sanitizer.string(orderId);
      const sanitizedReason = reason ? Sanitizer.string(reason) : undefined;
      
      if (!sanitizedOrderId) {
        throw new ValidationError('orderId', 'Order ID is required');
      }

      Logger.info('Cancelling order', { orderId: sanitizedOrderId, reason: sanitizedReason });
      
      const result = await TimeoutHandler.withTimeout(
        () => this.adapter.cancelOrder(sanitizedOrderId, sanitizedReason),
        'adapter'
      );
      
      Logger.info('Order cancelled successfully', { 
        orderId: result.orderId, 
        cancelledAt: result.cancelledAt 
      });
      
      return result;
    });
  }

  /**
   * Update an existing order
   */
  async updateOrder(orderId: string, updates: OrderUpdates): Promise<UpdateResult> {
    return this.errorHandler.executeOperation('updateOrder', async () => {
      const sanitizedOrderId = Sanitizer.string(orderId);
      if (!sanitizedOrderId) {
        throw new ValidationError('orderId', 'Order ID is required');
      }

      // Sanitize updates
      const sanitizedUpdates = this.sanitizeOrderUpdates(updates);

      Logger.info('Updating order', { orderId: sanitizedOrderId });
      
      const result = await TimeoutHandler.withTimeout(
        () => this.adapter.updateOrder(sanitizedOrderId, sanitizedUpdates),
        'adapter'
      );
      
      Logger.info('Order updated successfully', { 
        orderId: result.orderId, 
        updatedFields: result.updatedFields 
      });
      
      return result;
    });
  }

  /**
   * Process order return
   */
  async returnOrder(orderId: string, items: ReturnItem[]): Promise<ReturnResult> {
    return this.errorHandler.executeOperation('returnOrder', async () => {
      const sanitizedOrderId = Sanitizer.string(orderId);
      if (!sanitizedOrderId) {
        throw new ValidationError('orderId', 'Order ID is required');
      }

      if (!items || items.length === 0) {
        throw new ValidationError('items', 'Return items are required');
      }

      Logger.info('Processing order return', { 
        orderId: sanitizedOrderId, 
        itemCount: items.length 
      });
      
      const result = await TimeoutHandler.withTimeout(
        () => this.adapter.returnOrder(sanitizedOrderId, items),
        'adapter'
      );
      
      Logger.info('Order return processed successfully', { 
        returnId: result.returnId, 
        rmaNumber: result.rmaNumber 
      });
      
      return result;
    });
  }

  /**
   * Process order exchange
   */
  async exchangeOrder(params: ExchangeParams): Promise<ExchangeResult> {
    return this.errorHandler.executeOperation('exchangeOrder', async () => {
      if (!params.orderId || !params.returnItems || !params.newItems || !params.reason) {
        throw new ValidationError('exchangeParams', 'Order ID, return items, new items, and reason are required');
      }

      Logger.info('Processing order exchange', { orderId: params.orderId });
      
      const result = await TimeoutHandler.withTimeout(
        () => this.adapter.exchangeOrder(params),
        'adapter'
      );
      
      Logger.info('Order exchange processed successfully', { 
        exchangeId: result.exchangeId, 
        newOrderId: result.newOrderId 
      });
      
      return result;
    });
  }

  /**
   * Ship an order
   */
  async shipOrder(orderId: string, shipping: ShippingInfo): Promise<ShipmentResult> {
    return this.errorHandler.executeOperation('shipOrder', async () => {
      const sanitizedOrderId = Sanitizer.string(orderId);
      if (!sanitizedOrderId) {
        throw new ValidationError('orderId', 'Order ID is required');
      }

      if (!shipping.carrier || !shipping.service) {
        throw new ValidationError('shipping', 'Carrier and service are required');
      }

      Logger.info('Shipping order', { 
        orderId: sanitizedOrderId, 
        carrier: shipping.carrier 
      });
      
      const result = await TimeoutHandler.withTimeout(
        () => this.adapter.shipOrder(sanitizedOrderId, shipping),
        'adapter'
      );
      
      Logger.info('Order shipped successfully', { 
        shipmentId: result.shipmentId, 
        trackingNumber: result.trackingNumber 
      });
      
      return result;
    });
  }

  /**
   * Hold an order
   */
  async holdOrder(orderId: string, holdParams: HoldParams): Promise<HoldResult> {
    return this.errorHandler.executeOperation('holdOrder', async () => {
      const sanitizedOrderId = Sanitizer.string(orderId);
      if (!sanitizedOrderId) {
        throw new ValidationError('orderId', 'Order ID is required');
      }

      if (!holdParams.reason) {
        throw new ValidationError('holdParams', 'Hold reason is required');
      }

      Logger.info('Holding order', { orderId: sanitizedOrderId, reason: holdParams.reason });
      
      const result = await TimeoutHandler.withTimeout(
        () => this.adapter.holdOrder(sanitizedOrderId, holdParams),
        'adapter'
      );
      
      Logger.info('Order held successfully', { 
        orderId: result.orderId, 
        holdId: result.holdId 
      });
      
      return result;
    });
  }

  /**
   * Split an order
   */
  async splitOrder(orderId: string, splits: SplitParams[]): Promise<SplitResult> {
    return this.errorHandler.executeOperation('splitOrder', async () => {
      const sanitizedOrderId = Sanitizer.string(orderId);
      if (!sanitizedOrderId) {
        throw new ValidationError('orderId', 'Order ID is required');
      }

      if (!splits || splits.length === 0) {
        throw new ValidationError('splits', 'Split parameters are required');
      }

      Logger.info('Splitting order', { 
        orderId: sanitizedOrderId, 
        splitCount: splits.length 
      });
      
      const result = await TimeoutHandler.withTimeout(
        () => this.adapter.splitOrder(sanitizedOrderId, splits),
        'adapter'
      );
      
      Logger.info('Order split successfully', { 
        originalOrderId: result.originalOrderId, 
        newOrderIds: result.newOrderIds 
      });
      
      return result;
    });
  }

  /**
   * Sanitize order updates
   */
  private sanitizeOrderUpdates(updates: OrderUpdates): OrderUpdates {
    const sanitized: OrderUpdates = {};

    if (updates.customer) {
      sanitized.customer = {
        ...updates.customer,
        firstName: updates.customer.firstName ? Sanitizer.string(updates.customer.firstName) : undefined,
        lastName: updates.customer.lastName ? Sanitizer.string(updates.customer.lastName) : undefined,
        company: updates.customer.company ? Sanitizer.string(updates.customer.company) : undefined
      };
    }

    if (updates.customFields) {
      sanitized.customFields = updates.customFields.map(field => ({
        name: Sanitizer.string(field.name),
        value: Sanitizer.string(field.value)
      }));
    }

    if (updates.billingAddress) {
      sanitized.billingAddress = updates.billingAddress;
    }

    if (updates.shippingAddress) {
      sanitized.shippingAddress = updates.shippingAddress;
    }

    if (updates.lineItems) {
      sanitized.lineItems = updates.lineItems;
    }

    return sanitized;
  }
}
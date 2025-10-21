/**
 * Order Service
 * Handles all order-related operations
 */

import { IFulfillmentAdapter, OrderResult } from '../types/index.js';
import { Logger } from '../utils/logger.js';
import { TimeoutHandler } from '../utils/timeout.js';
import { ErrorHandler } from './error-handler.js';
import {
  CancelOrderInput,
  CreateSalesOrderInput,
  Fulfillment,
  FulfillOrderInput,
  UpdateOrderInput,
} from '../schemas/index.js';
import { FulfillmentToolResult } from '../types/adapter.js';

export class OrderService
  implements Pick<IFulfillmentAdapter, 'createSalesOrder' | 'cancelOrder' | 'updateOrder' | 'fulfillOrder'>
{
  constructor(
    private adapter: IFulfillmentAdapter,
    private errorHandler: ErrorHandler
  ) {
    Logger.debug('OrderService initialized');
  }

  /**
   * Capture/Create a new order
   */
  async createSalesOrder(params: CreateSalesOrderInput): Promise<OrderResult> {
    return this.errorHandler.executeOperation('captureOrder', async () => {
      Logger.info('Capturing order', { externalId: params.order.externalId });

      const result = await TimeoutHandler.withTimeout(() => this.adapter.createSalesOrder(params), 'adapter');

      if (result.success) {
        Logger.info('Order captured successfully', {
          orderId: result.order.id,
          status: result.order.status,
        });
      } else {
        Logger.error('Order capture failed', { error: result.error });
      }

      return result;
    });
  }

  /**
   * Cancel an existing order
   */
  async cancelOrder(input: CancelOrderInput): Promise<OrderResult> {
    return this.errorHandler.executeOperation('cancelOrder', async () => {
      Logger.info('Cancelling order', { orderId: input.orderId });

      const result = await TimeoutHandler.withTimeout(() => this.adapter.cancelOrder(input), 'adapter');

      if (result.success) {
        Logger.info('Order cancelled successfully', {
          orderId: result.order.id,
        });
      } else {
        Logger.error('Order cancellation failed', { error: result.error });
      }

      return result;
    });
  }

  /**
   * Update an existing order
   */
  async updateOrder(input: UpdateOrderInput): Promise<OrderResult> {
    return this.errorHandler.executeOperation('updateOrder', async () => {
      Logger.info('Updating order', { orderId: input.id });

      const result = await TimeoutHandler.withTimeout(() => this.adapter.updateOrder(input), 'adapter');

      if (result.success) {
        Logger.info('Order updated successfully', {
          orderId: result.order.id,
        });
      } else {
        Logger.error('Order update failed', { error: result.error });
      }

      return result;
    });
  }

  /**
   * Ship an order
   */
  async fulfillOrder(input: FulfillOrderInput): Promise<FulfillmentToolResult<{ fulfillment: Fulfillment }>> {
    return this.errorHandler.executeOperation('fulfillOrder', async () => {
      const { orderId } = input;
      Logger.info('Shipping order', { orderId });

      const result = await TimeoutHandler.withTimeout(() => this.adapter.fulfillOrder(input), 'adapter');

      if (result.success) {
        Logger.info('Order fulfilled successfully', {
          orderId,
          fulfillmentId: result.fulfillment.id,
        });
      } else {
        Logger.error('Order fulfillment failed', { error: result.error });
      }

      return result;
    });
  }
}

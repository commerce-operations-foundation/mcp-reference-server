/**
 * Query Service
 * Handles all read-only query operations
 */

import { IFulfillmentAdapter } from '../types/index.js';
import { Logger } from '../utils/logger.js';
import { TimeoutHandler } from '../utils/timeout.js';
import { ErrorHandler } from './error-handler.js';
import type {
  GetOrdersInput,
  GetProductsInput,
  GetProductVariantsInput,
  GetCustomersInput,
  GetFulfillmentsInput,
} from '../schemas/tool-inputs/index.js';
import { Customer, Fulfillment, Order, Product, ProductVariant } from '../schemas/index.js';
import { FulfillmentToolResult } from '../types/adapter.js';

export class QueryService {
  constructor(
    private adapter: IFulfillmentAdapter,
    private errorHandler: ErrorHandler
  ) {
    Logger.debug('QueryService initialized');
  }

  /**
   * Retrieve orders matching the provided identifiers.
   */
  async getOrders(input: GetOrdersInput): Promise<FulfillmentToolResult<{ orders: Order[] }>> {
    return this.errorHandler.executeOperation('getOrders', async () => {
      Logger.debug('Fetching orders', { filters: input });

      const result = await TimeoutHandler.withTimeout(() => this.adapter.getOrders(input), 'adapter');

      if (result.success) {
        Logger.debug('Orders retrieved', { count: result.orders.length });
        return result;
      } else {
        Logger.error('Failed to retrieve orders', { error: result.error });
        throw result.error;
      }
    });
  }

  /**
   * Retrieve products matching provided identifiers.
   */
  async getProducts(input: GetProductsInput): Promise<FulfillmentToolResult<{ products: Product[] }>> {
    return this.errorHandler.executeOperation('getProducts', async () => {
      const result = await TimeoutHandler.withTimeout(() => this.adapter.getProducts(input), 'adapter');

      if (result.success) {
        Logger.debug('Products retrieved', { count: result.products.length });
        return result;
      } else {
        Logger.error('Failed to retrieve products', { error: result.error });
        throw result.error;
      }
    });
  }

  /**
   * Retrieve SKU-level product variants.
   */
  async getProductVariants(
    input: GetProductVariantsInput
  ): Promise<FulfillmentToolResult<{ productVariants: ProductVariant[] }>> {
    return this.errorHandler.executeOperation('getProductVariants', async () => {
      const result = await TimeoutHandler.withTimeout(() => this.adapter.getProductVariants(input), 'adapter');

      if (result.success) {
        Logger.debug('Product variants retrieved', { count: result.productVariants.length });
        return result;
      } else {
        Logger.error('Failed to retrieve product variants', { error: result.error });
        throw result.error;
      }
    });
  }

  /**
   * Retrieve customers by ids or emails.
   */
  async getCustomers(input: GetCustomersInput): Promise<FulfillmentToolResult<{ customers: Customer[] }>> {
    return this.errorHandler.executeOperation('getCustomers', async () => {
      const result = await TimeoutHandler.withTimeout(() => this.adapter.getCustomers(input), 'adapter');

      if (result.success) {
        Logger.debug('Customers retrieved', { count: result.customers.length });
        return result;
      } else {
        Logger.error('Failed to retrieve customers', { error: result.error });
        throw result.error;
      }
    });
  }

  /**
   * Retrieve shipments/fulfillments.
   */
  async getFulfillments(input: GetFulfillmentsInput): Promise<FulfillmentToolResult<{ fulfillments: Fulfillment[] }>> {
    return this.errorHandler.executeOperation('getFulfillments', async () => {
      const result = await TimeoutHandler.withTimeout(() => this.adapter.getFulfillments(input), 'adapter');

      if (result.success) {
        Logger.debug('Fulfillments retrieved', { count: result.fulfillments.length });
        return result;
      } else {
        Logger.error('Failed to retrieve fulfillments', { error: result.error });
        throw result.error;
      }
    });
  }
}

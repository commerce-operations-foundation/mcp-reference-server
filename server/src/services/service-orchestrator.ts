/**
 * Service Orchestrator
 * Main facade that coordinates all service components and maintains backward compatibility
 */

import { Logger } from '../utils/logger.js';

// Import all service components
import { AdapterManager } from './adapter-manager.js';
import { HealthMonitor } from './health-monitor.js';
import { ErrorHandler } from './error-handler.js';
import { TimeoutHandler } from '../utils/timeout.js';

import type {
  CreateSalesOrderInput,
  CancelOrderInput,
  UpdateOrderInput,
  FulfillOrderInput,
  CreateReturnInput,
  GetOrdersInput,
  GetCustomersInput,
  GetProductsInput,
  GetProductVariantsInput,
  GetInventoryInput,
  GetFulfillmentsInput,
  GetReturnsInput,
} from '../schemas/tool-inputs/index.js';
import { AdapterConfig, HealthStatus, OrderResult, ReturnResult, FulfillmentToolResult } from '../types/adapter.js';
import { Customer, Fulfillment, InventoryItem, Order, Product, ProductVariant, Return } from '../schemas/index.js';

/**
 * ServiceOrchestrator provides a unified interface to all Fulfillment operations
 */
export class ServiceOrchestrator {
  // Service components
  private adapterManager: AdapterManager;
  private healthMonitor: HealthMonitor;
  private errorHandler: ErrorHandler;

  constructor() {
    // Initialize infrastructure components
    this.adapterManager = new AdapterManager();
    this.healthMonitor = new HealthMonitor();
    this.errorHandler = new ErrorHandler();

    Logger.info('ServiceOrchestrator initialized');
  }

  /**
   * Initialize the service with adapter configuration
   */
  async initialize(config: AdapterConfig): Promise<void> {
    const startTime = Date.now();

    try {
      Logger.info('Initializing ServiceOrchestrator', { adapterType: config.type });

      // Initialize adapter
      await this.adapterManager.initialize(config);
      this.adapterManager.getAdapter();

      // Record initialization metrics
      const duration = Date.now() - startTime;
      this.healthMonitor.recordOperation('ServiceOrchestrator', 'initialize', duration, true);

      Logger.info('ServiceOrchestrator initialized successfully', {
        duration,
        adapterType: config.type,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this.healthMonitor.recordOperation('ServiceOrchestrator', 'initialize', duration, false);

      Logger.error('Failed to initialize ServiceOrchestrator', { error });
      throw error;
    }
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.adapterManager.isReady();
  }

  /**
   * Update adapter configuration
   */
  async updateAdapterConfig(config: AdapterConfig): Promise<void> {
    await this.initialize(config); // Reinitialize with new config
  }

  // ==========================================
  // Order Operations (adapter-backed)
  // ==========================================

  async createSalesOrder(input: CreateSalesOrderInput): Promise<OrderResult> {
    this.ensureInitialized();
    const startTime = Date.now();

    try {
      const adapter = this.adapterManager.getAdapter();
      const result = await this.errorHandler.executeOperation('captureOrder', async () => {
        Logger.info('Capturing order', { externalId: input.order.externalId });

        const outcome = await TimeoutHandler.withTimeout(() => adapter.createSalesOrder(input), 'adapter');

        if (outcome.success) {
          Logger.info('Order captured successfully', {
            orderId: outcome.order.id,
            status: outcome.order.status,
          });
        } else {
          Logger.error('Order capture failed', { error: outcome.error });
        }

        return outcome;
      });
      this.recordSuccess('createSalesOrder', startTime);
      return result;
    } catch (error) {
      this.recordFailure('createSalesOrder', startTime);
      throw error;
    }
  }

  async cancelOrder(input: CancelOrderInput): Promise<OrderResult> {
    this.ensureInitialized();
    const startTime = Date.now();

    try {
      const adapter = this.adapterManager.getAdapter();
      const result = await this.errorHandler.executeOperation('cancelOrder', async () => {
        Logger.info('Cancelling order', { orderId: input.orderId });

        const outcome = await TimeoutHandler.withTimeout(() => adapter.cancelOrder(input), 'adapter');

        if (outcome.success) {
          Logger.info('Order cancelled successfully', {
            orderId: outcome.order.id,
          });
        } else {
          Logger.error('Order cancellation failed', { error: outcome.error });
        }

        return outcome;
      });
      this.recordSuccess('cancelOrder', startTime);
      return result;
    } catch (error) {
      this.recordFailure('cancelOrder', startTime);
      throw error;
    }
  }

  async updateOrder(input: UpdateOrderInput): Promise<OrderResult> {
    this.ensureInitialized();
    const startTime = Date.now();

    try {
      const adapter = this.adapterManager.getAdapter();
      const result = await this.errorHandler.executeOperation('updateOrder', async () => {
        Logger.info('Updating order', { orderId: input.id });

        const outcome = await TimeoutHandler.withTimeout(() => adapter.updateOrder(input), 'adapter');

        if (outcome.success) {
          Logger.info('Order updated successfully', {
            orderId: outcome.order.id,
          });
        } else {
          Logger.error('Order update failed', { error: outcome.error });
        }

        return outcome;
      });
      this.recordSuccess('updateOrder', startTime);
      return result;
    } catch (error) {
      this.recordFailure('updateOrder', startTime);
      throw error;
    }
  }

  async fulfillOrder(input: FulfillOrderInput): Promise<FulfillmentToolResult<{ fulfillment: Fulfillment }>> {
    this.ensureInitialized();
    const startTime = Date.now();

    try {
      const adapter = this.adapterManager.getAdapter();
      const result = await this.errorHandler.executeOperation('fulfillOrder', async () => {
        const { orderId } = input;
        Logger.info('Shipping order', { orderId });

        const outcome = await TimeoutHandler.withTimeout(() => adapter.fulfillOrder(input), 'adapter');

        if (outcome.success) {
          Logger.info('Order fulfilled successfully', {
            orderId,
            fulfillmentId: outcome.fulfillment.id,
          });
        } else {
          Logger.error('Order fulfillment failed', { error: outcome.error });
        }

        return outcome;
      });
      this.recordSuccess('fulfillOrder', startTime);
      return result;
    } catch (error) {
      this.recordFailure('fulfillOrder', startTime);
      throw error;
    }
  }

  async createReturn(input: CreateReturnInput): Promise<ReturnResult> {
    this.ensureInitialized();
    const startTime = Date.now();

    try {
      const adapter = this.adapterManager.getAdapter();
      const result = await this.errorHandler.executeOperation('createReturn', async () => {
        Logger.info('Creating return', { orderId: input.return.orderId });

        const outcome = await TimeoutHandler.withTimeout(() => adapter.createReturn(input), 'adapter');

        if (outcome.success) {
          Logger.info('Return created successfully', {
            returnId: outcome.return.id,
            orderId: outcome.return.orderId,
          });
        } else {
          Logger.error('Return creation failed', { error: outcome.error });
        }

        return outcome;
      });
      this.recordSuccess('createReturn', startTime);
      return result;
    } catch (error) {
      this.recordFailure('createReturn', startTime);
      throw error;
    }
  }

  // ==========================================
  // Inventory Operations (adapter-backed)
  // ==========================================

  async getInventory(input: GetInventoryInput): Promise<FulfillmentToolResult<{ inventory: InventoryItem[] }>> {
    this.ensureInitialized();
    const startTime = Date.now();

    try {
      const adapter = this.adapterManager.getAdapter();
      const result = await this.errorHandler.executeOperation('getInventory', async () => {
        Logger.debug('Fetching inventory', { filters: input });

        const outcome = await TimeoutHandler.withTimeout(() => adapter.getInventory(input), 'adapter');

        if (outcome.success) {
          Logger.debug('Inventory retrieved successfully', { count: outcome.inventory.length });
          return outcome;
        } else {
          Logger.error('Failed to retrieve inventory', { error: outcome.error });
          throw outcome.error;
        }
      });
      this.recordSuccess('getInventory', startTime);
      return result;
    } catch (error) {
      this.recordFailure('getInventory', startTime);
      throw error;
    }
  }

  // ==========================================
  // Query Operations (adapter-backed)
  // ==========================================

  async getOrders(input: GetOrdersInput): Promise<FulfillmentToolResult<{ orders: Order[] }>> {
    this.ensureInitialized();
    const startTime = Date.now();

    try {
      const adapter = this.adapterManager.getAdapter();
      const result = await this.errorHandler.executeOperation('getOrders', async () => {
        Logger.debug('Fetching orders', { filters: input });

        const outcome = await TimeoutHandler.withTimeout(() => adapter.getOrders(input), 'adapter');

        if (outcome.success) {
          Logger.debug('Orders retrieved', { count: outcome.orders.length });
          return outcome;
        } else {
          Logger.error('Failed to retrieve orders', { error: outcome.error });
          throw outcome.error;
        }
      });
      this.recordSuccess('getOrders', startTime);
      return result;
    } catch (error) {
      this.recordFailure('getOrders', startTime);
      throw error;
    }
  }

  async getProducts(input: GetProductsInput): Promise<FulfillmentToolResult<{ products: Product[] }>> {
    this.ensureInitialized();
    const startTime = Date.now();

    try {
      const adapter = this.adapterManager.getAdapter();
      const result = await this.errorHandler.executeOperation('getProducts', async () => {
        const outcome = await TimeoutHandler.withTimeout(() => adapter.getProducts(input), 'adapter');

        if (outcome.success) {
          Logger.debug('Products retrieved', { count: outcome.products.length });
          return outcome;
        } else {
          Logger.error('Failed to retrieve products', { error: outcome.error });
          throw outcome.error;
        }
      });
      this.recordSuccess('getProducts', startTime);
      return result;
    } catch (error) {
      this.recordFailure('getProducts', startTime);
      throw error;
    }
  }

  async getProductVariants(
    input: GetProductVariantsInput
  ): Promise<FulfillmentToolResult<{ productVariants: ProductVariant[] }>> {
    this.ensureInitialized();
    const startTime = Date.now();

    try {
      const adapter = this.adapterManager.getAdapter();
      const result = await this.errorHandler.executeOperation('getProductVariants', async () => {
        const outcome = await TimeoutHandler.withTimeout(() => adapter.getProductVariants(input), 'adapter');

        if (outcome.success) {
          Logger.debug('Product variants retrieved', { count: outcome.productVariants.length });
          return outcome;
        } else {
          Logger.error('Failed to retrieve product variants', { error: outcome.error });
          throw outcome.error;
        }
      });
      this.recordSuccess('getProductVariants', startTime);
      return result;
    } catch (error) {
      this.recordFailure('getProductVariants', startTime);
      throw error;
    }
  }

  async getCustomers(input: GetCustomersInput): Promise<FulfillmentToolResult<{ customers: Customer[] }>> {
    this.ensureInitialized();
    const startTime = Date.now();

    try {
      const adapter = this.adapterManager.getAdapter();
      const result = await this.errorHandler.executeOperation('getCustomers', async () => {
        const outcome = await TimeoutHandler.withTimeout(() => adapter.getCustomers(input), 'adapter');

        if (outcome.success) {
          Logger.debug('Customers retrieved', { count: outcome.customers.length });
          return outcome;
        } else {
          Logger.error('Failed to retrieve customers', { error: outcome.error });
          throw outcome.error;
        }
      });
      this.recordSuccess('getCustomers', startTime);
      return result;
    } catch (error) {
      this.recordFailure('getCustomers', startTime);
      throw error;
    }
  }

  async getFulfillments(input: GetFulfillmentsInput): Promise<FulfillmentToolResult<{ fulfillments: Fulfillment[] }>> {
    this.ensureInitialized();
    const startTime = Date.now();

    try {
      const adapter = this.adapterManager.getAdapter();
      const result = await this.errorHandler.executeOperation('getFulfillments', async () => {
        const outcome = await TimeoutHandler.withTimeout(() => adapter.getFulfillments(input), 'adapter');

        if (outcome.success) {
          Logger.debug('Fulfillments retrieved', { count: outcome.fulfillments.length });
          return outcome;
        } else {
          Logger.error('Failed to retrieve fulfillments', { error: outcome.error });
          throw outcome.error;
        }
      });
      this.recordSuccess('getFulfillments', startTime);
      return result;
    } catch (error) {
      this.recordFailure('getFulfillments', startTime);
      throw error;
    }
  }

  async getReturns(input: GetReturnsInput): Promise<FulfillmentToolResult<{ returns: Return[] }>> {
    this.ensureInitialized();
    const startTime = Date.now();

    try {
      const adapter = this.adapterManager.getAdapter();
      const result = await this.errorHandler.executeOperation('getReturns', async () => {
        Logger.debug('Fetching returns', { filters: input });

        const outcome = await TimeoutHandler.withTimeout(() => adapter.getReturns(input), 'adapter');

        if (outcome.success) {
          Logger.debug('Returns retrieved', { count: outcome.returns.length });
          return outcome;
        } else {
          Logger.error('Failed to retrieve returns', { error: outcome.error });
          throw outcome.error;
        }
      });
      this.recordSuccess('getReturns', startTime);
      return result;
    } catch (error) {
      this.recordFailure('getReturns', startTime);
      throw error;
    }
  }

  // ==========================================
  // Health and Monitoring
  // ==========================================

  async checkHealth(): Promise<HealthStatus> {
    // Check adapter health
    const adapterHealth = await this.adapterManager.checkHealth();
    this.healthMonitor.recordHealthCheck('adapter', adapterHealth);

    // Get overall system health
    return this.healthMonitor.getSystemHealth();
  }

  getMetrics(): object {
    return this.healthMonitor.exportMetrics();
  }

  // ==========================================
  // Helper Methods
  // ==========================================

  private ensureInitialized(): void {
    if (!this.isInitialized()) {
      throw new Error('ServiceOrchestrator not initialized. Call initialize() first.');
    }
  }

  private recordSuccess(operation: string, startTime: number): void {
    const duration = Date.now() - startTime;
    this.healthMonitor.recordOperation('ServiceOrchestrator', operation, duration, true);
  }

  private recordFailure(operation: string, startTime: number): void {
    const duration = Date.now() - startTime;
    this.healthMonitor.recordOperation('ServiceOrchestrator', operation, duration, false);
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    Logger.info('Cleaning up ServiceOrchestrator');

    try {
      await this.adapterManager.cleanup();
    } catch (error) {
      Logger.error('Error during ServiceOrchestrator cleanup', { error });
    }

    // Stop health monitor to prevent timer leaks
    this.healthMonitor.stop();

    Logger.info('ServiceOrchestrator cleanup completed');
  }
}

/**
 * Service Orchestrator
 * Main facade that coordinates all service components and maintains backward compatibility
 */

import { Logger } from '../utils/logger.js';

// Import all service components
import { OrderService } from './order-service.js';
import { InventoryService } from './inventory-service.js';
import { QueryService } from './query-service.js';
import { AdapterManager } from './adapter-manager.js';
import { HealthMonitor } from './health-monitor.js';
import { ErrorHandler } from './error-handler.js';

import type {
  CreateSalesOrderInput,
  CancelOrderInput,
  UpdateOrderInput,
  FulfillOrderInput,
  GetOrdersInput,
  GetCustomersInput,
  GetProductsInput,
  GetProductVariantsInput,
  GetInventoryInput,
  GetFulfillmentsInput,
} from '../schemas/tool-inputs/index.js';
import { AdapterConfig, HealthStatus, OrderResult, FulfillmentToolResult } from '../types/adapter.js';
import { Customer, Fulfillment, Inventory, Order, Product, ProductVariant } from '../schemas/index.js';

/**
 * ServiceOrchestrator provides a unified interface to all Fulfillment operations
 */
export class ServiceOrchestrator {
  // Service components
  private orderService: OrderService | null = null;
  private inventoryService: InventoryService | null = null;
  private queryService: QueryService | null = null;
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
      const adapter = this.adapterManager.getAdapter();

      // Initialize domain services with adapter
      this.orderService = new OrderService(adapter, this.errorHandler);
      this.inventoryService = new InventoryService(adapter, this.errorHandler);
      this.queryService = new QueryService(adapter, this.errorHandler);

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
    return (
      this.adapterManager.isReady() &&
      this.orderService !== null &&
      this.inventoryService !== null &&
      this.queryService !== null
    );
  }

  /**
   * Update adapter configuration
   */
  async updateAdapterConfig(config: AdapterConfig): Promise<void> {
    await this.initialize(config); // Reinitialize with new config
  }

  // ==========================================
  // Order Operations (delegated to OrderService)
  // ==========================================

  async createSalesOrder(input: CreateSalesOrderInput): Promise<OrderResult> {
    this.ensureInitialized();
    const startTime = Date.now();

    try {
      const { orderService } = this.getServices();
      const result = await orderService.createSalesOrder(input);
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
      const { orderService } = this.getServices();
      const result = await orderService.cancelOrder(input);
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
      const { orderService } = this.getServices();
      const result = await orderService.updateOrder(input);
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
      const { orderService } = this.getServices();
      const result = await orderService.fulfillOrder(input);
      this.recordSuccess('fulfillOrder', startTime);
      return result;
    } catch (error) {
      this.recordFailure('fulfillOrder', startTime);
      throw error;
    }
  }

  // ==========================================
  // Inventory Operations (delegated to InventoryService)
  // ==========================================

  async getInventory(input: GetInventoryInput): Promise<FulfillmentToolResult<{ inventory: Inventory[] }>> {
    this.ensureInitialized();
    const startTime = Date.now();

    try {
      const { inventoryService } = this.getServices();
      const result = await inventoryService.getInventory(input);
      this.recordSuccess('getInventory', startTime);
      return result;
    } catch (error) {
      this.recordFailure('getInventory', startTime);
      throw error;
    }
  }

  // ==========================================
  // Query Operations (delegated to QueryService)
  // ==========================================

  async getOrders(input: GetOrdersInput): Promise<FulfillmentToolResult<{ orders: Order[] }>> {
    this.ensureInitialized();
    const startTime = Date.now();

    try {
      const { queryService } = this.getServices();
      const result = await queryService.getOrders(input);
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
      const { queryService } = this.getServices();
      const result = await queryService.getProducts(input);
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
      const { queryService } = this.getServices();
      const result = await queryService.getProductVariants(input);
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
      const { queryService } = this.getServices();
      const result = await queryService.getCustomers(input);
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
      const { queryService } = this.getServices();
      const result = await queryService.getFulfillments(input);
      this.recordSuccess('getFulfillments', startTime);
      return result;
    } catch (error) {
      this.recordFailure('getFulfillments', startTime);
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

  /**
   * Safely retrieve initialized services with non-null types
   */
  private getServices(): {
    orderService: OrderService;
    inventoryService: InventoryService;
    queryService: QueryService;
  } {
    if (!this.orderService || !this.inventoryService || !this.queryService) {
      throw new Error('ServiceOrchestrator not initialized. Call initialize() first.');
    }
    return {
      orderService: this.orderService,
      inventoryService: this.inventoryService,
      queryService: this.queryService,
    };
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

    this.orderService = null;
    this.inventoryService = null;
    this.queryService = null;

    Logger.info('ServiceOrchestrator cleanup completed');
  }
}

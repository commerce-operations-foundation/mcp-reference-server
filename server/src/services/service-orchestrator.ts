/**
 * Service Orchestrator
 * Main facade that coordinates all service components and maintains backward compatibility
 */

import { 
  AdapterConfig,
  OrderRequest,
  OrderResult,
  CancelResult,
  UpdateResult,
  ReturnResult,
  ExchangeResult,
  HoldResult,
  SplitResult,
  ReturnItem,
  ExchangeParams,
  OrderUpdates,
  ShippingInfo,
  HoldParams,
  SplitParams,
  ReservationRequest,
  ReservationResult,
  Inventory,
  Order,
  OrderIdentifier,
  Product,
  ProductIdentifier,
  Customer,
  CustomerIdentifier,
  Shipment,
  ShipmentIdentifier,
  Buyer,
  HealthStatus
} from '../types/index.js';

import { Logger } from '../utils/logger.js';
import { Transformer } from './transformer.js';

// Import all service components
import { OrderService } from './order-service.js';
import { InventoryService } from './inventory-service.js';
import { QueryService } from './query-service.js';
import { AdapterManager } from './adapter-manager.js';
import { HealthMonitor } from './health-monitor.js';
import { ErrorHandler } from './error-handler.js';

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
  private transformer: Transformer;

  constructor() {
    // Initialize infrastructure components
    this.adapterManager = new AdapterManager();
    this.healthMonitor = new HealthMonitor();
    this.errorHandler = new ErrorHandler();
    this.transformer = new Transformer();
    
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
      this.orderService = new OrderService(
        adapter,
        this.transformer,
        this.errorHandler
      );
      
      this.inventoryService = new InventoryService(
        adapter,
        this.errorHandler
      );
      
      this.queryService = new QueryService(
        adapter,
        this.errorHandler
      );
      
      // Record initialization metrics
      const duration = Date.now() - startTime;
      this.healthMonitor.recordOperation('ServiceOrchestrator', 'initialize', duration, true);
      
      Logger.info('ServiceOrchestrator initialized successfully', { 
        duration,
        adapterType: config.type 
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
    return this.adapterManager.isReady() && 
           this.orderService !== null && 
           this.inventoryService !== null && 
           this.queryService !== null;
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

  async captureOrder(params: OrderRequest): Promise<OrderResult> {
    this.ensureInitialized();
    const startTime = Date.now();
    
    try {
      const { orderService } = this.getServices();
      const result = await orderService.captureOrder(params);
      this.recordSuccess('captureOrder', startTime);
      return result;
    } catch (error) {
      this.recordFailure('captureOrder', startTime);
      throw error;
    }
  }

  async cancelOrder(orderId: string, reason?: string): Promise<CancelResult> {
    this.ensureInitialized();
    const startTime = Date.now();
    
    try {
      const { orderService } = this.getServices();
      const result = await orderService.cancelOrder(orderId, reason);
      this.recordSuccess('cancelOrder', startTime);
      return result;
    } catch (error) {
      this.recordFailure('cancelOrder', startTime);
      throw error;
    }
  }

  async updateOrder(orderId: string, updates: OrderUpdates): Promise<UpdateResult> {
    this.ensureInitialized();
    const startTime = Date.now();
    
    try {
      const { orderService } = this.getServices();
      const result = await orderService.updateOrder(orderId, updates);
      this.recordSuccess('updateOrder', startTime);
      return result;
    } catch (error) {
      this.recordFailure('updateOrder', startTime);
      throw error;
    }
  }

  async returnOrder(orderId: string, items: ReturnItem[]): Promise<ReturnResult> {
    this.ensureInitialized();
    const startTime = Date.now();
    
    try {
      const { orderService } = this.getServices();
      const result = await orderService.returnOrder(orderId, items);
      this.recordSuccess('returnOrder', startTime);
      return result;
    } catch (error) {
      this.recordFailure('returnOrder', startTime);
      throw error;
    }
  }

  async exchangeOrder(params: ExchangeParams): Promise<ExchangeResult> {
    this.ensureInitialized();
    const startTime = Date.now();
    
    try {
      const { orderService } = this.getServices();
      const result = await orderService.exchangeOrder(params);
      this.recordSuccess('exchangeOrder', startTime);
      return result;
    } catch (error) {
      this.recordFailure('exchangeOrder', startTime);
      throw error;
    }
  }

  async shipOrder(orderId: string, shipping: ShippingInfo): Promise<any> {
    this.ensureInitialized();
    const startTime = Date.now();
    
    try {
      const { orderService } = this.getServices();
      const result = await orderService.shipOrder(orderId, shipping);
      this.recordSuccess('shipOrder', startTime);
      // Add orderId to the result for MCP tool compatibility
      return {
        ...result,
        orderId
      };
    } catch (error) {
      this.recordFailure('shipOrder', startTime);
      throw error;
    }
  }

  async holdOrder(orderId: string, holdParams: HoldParams): Promise<HoldResult> {
    this.ensureInitialized();
    const startTime = Date.now();
    
    try {
      const { orderService } = this.getServices();
      const result = await orderService.holdOrder(orderId, holdParams);
      this.recordSuccess('holdOrder', startTime);
      return result;
    } catch (error) {
      this.recordFailure('holdOrder', startTime);
      throw error;
    }
  }

  async splitOrder(orderId: string, splits: SplitParams[]): Promise<SplitResult> {
    this.ensureInitialized();
    const startTime = Date.now();
    
    try {
      const { orderService } = this.getServices();
      const result = await orderService.splitOrder(orderId, splits);
      this.recordSuccess('splitOrder', startTime);
      return result;
    } catch (error) {
      this.recordFailure('splitOrder', startTime);
      throw error;
    }
  }

  // ==========================================
  // Inventory Operations (delegated to InventoryService)
  // ==========================================

  async getInventory(sku: string, locationId?: string): Promise<Inventory> {
    this.ensureInitialized();
    const startTime = Date.now();
    
    try {
      const { inventoryService } = this.getServices();
      const result = await inventoryService.getInventory(sku, locationId);
      this.recordSuccess('getInventory', startTime);
      return result;
    } catch (error) {
      this.recordFailure('getInventory', startTime);
      throw error;
    }
  }

  async reserveInventory(reservation: ReservationRequest): Promise<ReservationResult> {
    this.ensureInitialized();
    const startTime = Date.now();
    
    try {
      const { inventoryService } = this.getServices();
      const result = await inventoryService.reserveInventory(reservation);
      this.recordSuccess('reserveInventory', startTime);
      return result;
    } catch (error) {
      this.recordFailure('reserveInventory', startTime);
      throw error;
    }
  }

  // ==========================================
  // Query Operations (delegated to QueryService)
  // ==========================================

  async getOrder(identifier: OrderIdentifier): Promise<Order> {
    this.ensureInitialized();
    const startTime = Date.now();
    
    try {
      const { queryService } = this.getServices();
      const result = await queryService.getOrder(identifier);
      this.recordSuccess('getOrder', startTime);
      return result;
    } catch (error) {
      this.recordFailure('getOrder', startTime);
      throw error;
    }
  }

  async getProduct(identifier: ProductIdentifier): Promise<Product> {
    this.ensureInitialized();
    const startTime = Date.now();
    
    try {
      const { queryService } = this.getServices();
      const result = await queryService.getProduct(identifier);
      this.recordSuccess('getProduct', startTime);
      return result;
    } catch (error) {
      this.recordFailure('getProduct', startTime);
      throw error;
    }
  }

  async getCustomer(identifier: CustomerIdentifier): Promise<Customer> {
    this.ensureInitialized();
    const startTime = Date.now();
    
    try {
      const { queryService } = this.getServices();
      const result = await queryService.getCustomer(identifier);
      this.recordSuccess('getCustomer', startTime);
      return result;
    } catch (error) {
      this.recordFailure('getCustomer', startTime);
      throw error;
    }
  }

  async getShipment(identifier: ShipmentIdentifier): Promise<Shipment> {
    this.ensureInitialized();
    const startTime = Date.now();
    
    try {
      const { queryService } = this.getServices();
      const result = await queryService.getShipment(identifier);
      this.recordSuccess('getShipment', startTime);
      return result;
    } catch (error) {
      this.recordFailure('getShipment', startTime);
      throw error;
    }
  }

  async getBuyer(buyerId: string): Promise<Buyer> {
    this.ensureInitialized();
    const startTime = Date.now();
    
    try {
      // Directly call adapter since QueryService doesn't have getBuyer
      const adapter = this.adapterManager.getAdapter();
      if (!adapter.getBuyer) {
        throw new Error('getBuyer not supported by current adapter');
      }
      const result = await adapter.getBuyer(buyerId);
      this.recordSuccess('getBuyer', startTime);
      return result;
    } catch (error) {
      this.recordFailure('getBuyer', startTime);
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

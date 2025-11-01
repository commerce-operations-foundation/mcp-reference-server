/**
 * Adapter Manager
 * Manages Fulfillment adapter lifecycle including initialization, health checks, and cleanup
 */

import { 
  IFulfillmentAdapter,
  AdapterConfig,
  HealthStatus,
  AdapterCapabilities
} from '../types/index.js';
import { Logger } from '../utils/logger.js';
import { AdapterNotInitializedError } from '../utils/errors.js';
import { AdapterFactory } from '../adapters/adapter-factory.js';

export class AdapterManager {
  private adapter: IFulfillmentAdapter | null = null;
  private config: AdapterConfig | null = null;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private lastHealthCheck: Date | null = null;
  private lastHealthStatus: HealthStatus | null = null;

  constructor(
    private healthCheckIntervalMs: number = 60000 // Default: 1 minute
  ) {
    Logger.debug('AdapterManager initialized');
  }

  /**
   * Initialize adapter with configuration
   */
  async initialize(config: AdapterConfig): Promise<void> {
    // Prevent multiple simultaneous initializations
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.doInitialize(config);
    
    try {
      await this.initializationPromise;
    } finally {
      this.initializationPromise = null;
    }
  }

  private async doInitialize(config: AdapterConfig): Promise<void> {
    Logger.info('Initializing adapter', { type: config.type });
    
    // Clean up existing adapter if any
    if (this.adapter) {
      await this.cleanup();
    }

    try {
      // Load adapter using factory
      this.adapter = await AdapterFactory.createAdapter(config);
      this.config = config;
      
      // Initialize adapter if it has an initialize method
      if (this.adapter.initialize) {
        await this.adapter.initialize(config);
      }
      
      // Connect to the adapter
      await this.adapter.connect();
      
      this.isInitialized = true;
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      Logger.info('Adapter initialized successfully', { 
        type: config.type,
        capabilities: await this.getCapabilities()
      });
    } catch (error) {
      Logger.error('Failed to initialize adapter', { 
        type: config.type, 
        error 
      });
      this.adapter = null;
      this.config = null;
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Get current adapter instance
   */
  getAdapter(): IFulfillmentAdapter {
    if (!this.adapter || !this.isInitialized) {
      throw new AdapterNotInitializedError();
    }
    return this.adapter;
  }

  /**
   * Check if adapter is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.adapter !== null;
  }

  /**
   * Get adapter capabilities
   */
  async getCapabilities(): Promise<AdapterCapabilities | null> {
    if (!this.adapter) {
      return null;
    }
    
    try {
      if (this.adapter.getCapabilities) {
        return await this.adapter.getCapabilities();
      }
      return null;
    } catch (error) {
      Logger.error('Failed to get adapter capabilities', { error });
      return null;
    }
  }

  /**
   * Check adapter health
   */
  async checkHealth(): Promise<HealthStatus> {
    if (!this.adapter) {
      return {
        status: 'unhealthy',
        message: 'Adapter not initialized',
        details: {}
      };
    }

    try {
      // Try checkHealth first, then fallback to healthCheck
      let health: HealthStatus;
      if (this.adapter.checkHealth) {
        health = await this.adapter.checkHealth();
      } else {
        health = await this.adapter.healthCheck();
      }
      this.lastHealthCheck = new Date();
      this.lastHealthStatus = health;
      
      if (health.status === 'unhealthy') {
        Logger.warn('Adapter health check failed', { health });
      }
      
      return health;
    } catch (error) {
      const errorHealth: HealthStatus = {
        status: 'unhealthy',
        message: 'Health check failed',
        details: { error: error instanceof Error ? error.message : String(error) }
      };
      
      this.lastHealthCheck = new Date();
      this.lastHealthStatus = errorHealth;
      
      Logger.error('Adapter health check error', { error });
      return errorHealth;
    }
  }

  /**
   * Get last health status
   */
  getLastHealthStatus(): { 
    status: HealthStatus | null; 
    checkedAt: Date | null 
  } {
    return {
      status: this.lastHealthStatus,
      checkedAt: this.lastHealthCheck
    };
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Initial health check
    this.checkHealth().catch(error => {
      Logger.error('Initial health check failed', { error });
    });

    // Schedule periodic health checks
    this.healthCheckInterval = setInterval(() => {
      this.checkHealth().catch(error => {
        Logger.error('Periodic health check failed', { error });
      });
    }, this.healthCheckIntervalMs);

    Logger.debug('Health monitoring started', { 
      intervalMs: this.healthCheckIntervalMs 
    });
  }

  /**
   * Stop health monitoring
   */
  private stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      Logger.debug('Health monitoring stopped');
    }
  }

  /**
   * Update adapter configuration
   */
  async updateConfig(config: AdapterConfig): Promise<void> {
    Logger.info('Updating adapter configuration', { type: config.type });
    
    // If it's a different adapter type, reinitialize
    if (this.config?.type !== config.type) {
      await this.initialize(config);
      return;
    }

    // Update existing adapter configuration
    if (this.adapter && this.adapter.updateConfig) {
      try {
        await this.adapter.updateConfig(config);
        this.config = config;
        Logger.info('Adapter configuration updated successfully');
      } catch (error) {
        Logger.error('Failed to update adapter configuration', { error });
        throw error;
      }
    } else {
      // Adapter doesn't support hot config updates, reinitialize
      await this.initialize(config);
    }
  }

  /**
   * Clean up adapter resources
   */
  async cleanup(): Promise<void> {
    Logger.info('Cleaning up adapter');
    
    // Stop health monitoring
    this.stopHealthMonitoring();
    
    // Clean up adapter
    if (this.adapter) {
      try {
        if (this.adapter.cleanup) {
          await this.adapter.cleanup();
        }
      } catch (error) {
        Logger.error('Error during adapter cleanup', { error });
      }
    }
    
    // Reset state
    this.adapter = null;
    this.config = null;
    this.isInitialized = false;
    this.lastHealthCheck = null;
    this.lastHealthStatus = null;
    
    Logger.info('Adapter cleanup completed');
  }

  /**
   * Get adapter information (sync version - capabilities not included)
   */
  getInfo(): {
    type: string | null;
    initialized: boolean;
    lastHealthCheck: Date | null;
    lastHealthStatus: string | null;
  } {
    return {
      type: this.config?.type || null,
      initialized: this.isInitialized,
      lastHealthCheck: this.lastHealthCheck,
      lastHealthStatus: this.lastHealthStatus?.status || null
    };
  }
  
  /**
   * Get adapter information with capabilities (async version)
   */
  async getInfoWithCapabilities(): Promise<{
    type: string | null;
    initialized: boolean;
    lastHealthCheck: Date | null;
    lastHealthStatus: string | null;
    capabilities: AdapterCapabilities | null;
  }> {
    return {
      type: this.config?.type || null,
      initialized: this.isInitialized,
      lastHealthCheck: this.lastHealthCheck,
      lastHealthStatus: this.lastHealthStatus?.status || null,
      capabilities: await this.getCapabilities()
    };
  }
}
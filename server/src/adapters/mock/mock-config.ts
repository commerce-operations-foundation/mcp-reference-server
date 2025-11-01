/**
 * Mock Configuration
 * Configuration for mock adapter behavior
 */

interface MockConfigOptions {
  // Latency simulation
  minLatency?: number;
  maxLatency?: number;
  fixedLatency?: number;

  // Error simulation
  errorRate?: number;
  operationErrors?: Record<string, number>;

  // Data behavior
  persistData?: boolean;
  dataSize?: number;

  // Response behavior
  realTimeUpdates?: boolean;
  randomizeData?: boolean;
}

export class MockConfig {
  private options: MockConfigOptions;

  constructor(options: MockConfigOptions = {}) {
    // Disable error simulation in test environment
    const isTestEnvironment = process.env.NODE_ENV === 'test' ||
      process.env.NODE_ENV === 'development';

    this.options = {
      minLatency: 50,
      maxLatency: 200,
      fixedLatency: undefined,
      errorRate: isTestEnvironment ? 0 : 0.01, // Disable errors in test/dev
      operationErrors: {},
      persistData: true,
      dataSize: 1000,
      realTimeUpdates: false,
      randomizeData: true,
      ...options
    };
  }

  /**
   * Get simulated latency in milliseconds
   */
  getLatency(): number {
    if (this.options.fixedLatency !== undefined) {
      return this.options.fixedLatency;
    }

    const min = this.options.minLatency || 0;
    const max = this.options.maxLatency || 0;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Check if operation should simulate an error
   */
  shouldSimulateError(operation: string): boolean {
    // Check operation-specific error rate first
    const operationRate = this.options.operationErrors?.[operation];
    if (operationRate !== undefined) {
      return Math.random() < operationRate;
    }

    // Fall back to global error rate
    return Math.random() < (this.options.errorRate || 0);
  }

  /**
   * Get configuration summary for health checks
   */
  getSummary(): Record<string, any> {
    return {
      latency: this.options.fixedLatency !== undefined
        ? `fixed ${this.options.fixedLatency}ms`
        : `${this.options.minLatency}-${this.options.maxLatency}ms`,
      errorRate: `${(this.options.errorRate || 0) * 100}%`,
      dataSize: this.options.dataSize,
      persistData: this.options.persistData,
      realTimeUpdates: this.options.realTimeUpdates
    };
  }

  /**
   * Get data size configuration
   */
  getDataSize(): number {
    return this.options.dataSize || 1000;
  }

  /**
   * Check if data should be persisted
   */
  shouldPersistData(): boolean {
    return this.options.persistData !== false;
  }

  /**
   * Check if data should be randomized
   */
  shouldRandomizeData(): boolean {
    return this.options.randomizeData !== false;
  }

  /**
   * Check if real-time updates are enabled
   */
  hasRealTimeUpdates(): boolean {
    return this.options.realTimeUpdates === true;
  }

  /**
   * Set error rate for specific operation
   */
  setOperationErrorRate(operation: string, rate: number): void {
    if (!this.options.operationErrors) {
      this.options.operationErrors = {};
    }
    this.options.operationErrors[operation] = rate;
  }

  /**
   * Update configuration options
   */
  updateOptions(newOptions: Partial<MockConfigOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }
}

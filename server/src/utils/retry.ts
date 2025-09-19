import { FulfillmentError } from './errors.js';
import { Logger } from './logger.js';
import { ServerConfig } from '../types/config.js';

/**
 * Configuration options for retry behavior
 */
export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Initial delay in milliseconds before first retry */
  initialDelay: number;
  /** Maximum delay in milliseconds between retries */
  maxDelay: number;
  /** Multiplier for exponential backoff */
  backoffMultiplier: number;
  /** Function to determine if an error is retryable */
  retryableErrors?: (error: any) => boolean;
}

/**
 * Retry handler with exponential backoff for operations that may fail temporarily
 */
export class RetryHandler {
  private static config: ServerConfig['resilience']['retry'] | null = null;
  
  private static defaultOptions: RetryOptions = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryableErrors: (error) => {
      if (error instanceof FulfillmentError) {
        return error.retryable;
      }
      // Also retry on network-related errors
      if (error?.code === 'ECONNRESET' || error?.code === 'ENOTFOUND' || error?.code === 'ETIMEDOUT') {
        return true;
      }
      return false;
    }
  };
  
  /**
   * Set the retry configuration from server config
   */
  static setConfig(retryConfig: ServerConfig['resilience']['retry']): void {
    this.config = retryConfig;
  }
  
  /**
   * Execute an operation with retry logic
   * @param operation - The async operation to execute
   * @param options - Retry configuration options
   * @returns Promise resolving to the operation result
   */
  static async execute<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    // Check if retry is disabled in config
    if (this.config && !this.config.enabled) {
      return operation();
    }
    
    // Merge config values into options
    const configOptions: Partial<RetryOptions> = {};
    if (this.config) {
      configOptions.maxRetries = this.config.maxAttempts;
      configOptions.initialDelay = this.config.initialDelay;
    }
    
    const opts = { ...this.defaultOptions, ...configOptions, ...options };
    let lastError: any;
    let delay = opts.initialDelay;
    
    const isRetryable = (opts.retryableErrors ?? RetryHandler.defaultOptions.retryableErrors) as (error: any) => boolean;
    for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Don't retry on the last attempt or for non-retryable errors
        if (attempt === opts.maxRetries || !isRetryable(error)) {
          Logger.warn('Operation failed, not retrying', { 
            attempt: attempt + 1,
            retryable: isRetryable(error),
            error: error instanceof Error ? error.message : String(error)
          });
          throw error;
        }
        
        Logger.warn(`Operation failed, retrying in ${delay}ms`, { 
          attempt: attempt + 1,
          maxRetries: opts.maxRetries,
          delay,
          error: error instanceof Error ? error.message : String(error)
        });
        
        await this.sleep(delay);
        
        // Calculate next delay with exponential backoff
        delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelay);
      }
    }
    
    // This should never be reached due to the loop logic, but TypeScript requires it
    throw lastError;
  }
  
  /**
   * Execute multiple operations with retry logic in parallel
   * @param operations - Array of async operations to execute
   * @param options - Retry configuration options
   * @returns Promise resolving to array of operation results
   */
  static async executeAll<T>(
    operations: (() => Promise<T>)[],
    options: Partial<RetryOptions> = {}
  ): Promise<T[]> {
    const promises = operations.map(op => this.execute(op, options));
    return Promise.all(promises);
  }
  
  /**
   * Execute multiple operations with retry logic, allowing some to fail
   * @param operations - Array of async operations to execute
   * @param options - Retry configuration options
   * @returns Promise resolving to array of settled results
   */
  static async executeAllSettled<T>(
    operations: (() => Promise<T>)[],
    options: Partial<RetryOptions> = {}
  ): Promise<PromiseSettledResult<T>[]> {
    const promises = operations.map(op => this.execute(op, options));
    return Promise.allSettled(promises);
  }
  
  /**
   * Sleep for the specified number of milliseconds
   * @param ms - Milliseconds to sleep
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

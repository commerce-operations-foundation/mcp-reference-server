/**
 * Error Handler
 * Centralized error handling and operation execution with metrics
 */

import { 
  FulfillmentError, 
  FulfillmentErrorCode, 
  BackendUnavailableError
} from '../utils/errors.js';
import { AdapterError } from '../types/adapter.js';
import { RetryHandler } from '../utils/retry.js';
import { Logger } from '../utils/logger.js';

interface ServiceMetrics {
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
  lastOperation: string | null;
}

export class ErrorHandler {
  private metrics: ServiceMetrics = {
    requestCount: 0,
    errorCount: 0,
    averageResponseTime: 0,
    lastOperation: null
  };

  /**
   * Execute operation with error handling, retry, and metrics
   */
  async executeOperation<T>(
    operationName: string, 
    operation: () => Promise<T>,
    retryOptions = { maxRetries: 2, initialDelay: 500 }
  ): Promise<T> {
    const startTime = Date.now();
    this.metrics.requestCount++;
    this.metrics.lastOperation = operationName;

    try {
      Logger.debug(`Executing operation: ${operationName}`);
      
      const result = await RetryHandler.execute(operation, {
        ...retryOptions,
        retryableErrors: (error: any) => {
          // Only retry on specific retryable errors
          return error instanceof BackendUnavailableError ||
                 (error instanceof FulfillmentError && error.retryable);
        }
      });

      // Update metrics
      const duration = Date.now() - startTime;
      this.updateResponseTime(duration);

      Logger.debug(`Operation completed: ${operationName}`, { duration });
      return result;

    } catch (error) {
      this.metrics.errorCount++;
      const duration = Date.now() - startTime;
      
      Logger.error(`Operation failed: ${operationName}`, { 
        error, 
        duration,
        errorCount: this.metrics.errorCount 
      });

      // Convert adapter errors to Fulfillment errors
      if (error instanceof AdapterError) {
        throw this.mapAdapterError(error);
      }

      throw error;
    }
  }

  /**
   * Map adapter errors to Fulfillment errors
   */
  private mapAdapterError(error: AdapterError): FulfillmentError {
    switch (error.code) {
      case 'ORDER_NOT_FOUND':
        return new FulfillmentError(
          FulfillmentErrorCode.ORDER_NOT_FOUND,
          error.message,
          false,
          { originalError: error.code, details: error.details }
        );
      case 'PRODUCT_NOT_FOUND':
        return new FulfillmentError(
          FulfillmentErrorCode.VALIDATION_ERROR,
          error.message,
          false,
          { originalError: error.code, details: error.details }
        );
      case 'CUSTOMER_NOT_FOUND':
        return new FulfillmentError(
          FulfillmentErrorCode.VALIDATION_ERROR,
          error.message,
          false,
          { originalError: error.code, details: error.details }
        );
      case 'INSUFFICIENT_INVENTORY':
        return new FulfillmentError(
          FulfillmentErrorCode.INSUFFICIENT_INVENTORY,
          error.message,
          false,
          { originalError: error.code, details: error.details }
        );
      default:
        return new FulfillmentError(
          FulfillmentErrorCode.ADAPTER_ERROR,
          error.message,
          false,
          { originalError: error.code, details: error.details }
        );
    }
  }

  /**
   * Update response time metrics
   */
  private updateResponseTime(duration: number): void {
    const { averageResponseTime, requestCount } = this.metrics;
    
    // Calculate running average
    this.metrics.averageResponseTime = 
      ((averageResponseTime * (requestCount - 1)) + duration) / requestCount;
  }

  /**
   * Get current metrics
   */
  getMetrics(): ServiceMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      averageResponseTime: 0,
      lastOperation: null
    };
  }
}
/**
 * Timeout utilities for enforcing performance configuration
 */

import { ServerConfig } from '../types/config.js';

export class TimeoutHandler {
  private static config: ServerConfig['performance']['timeout'] | null = null;

  /**
   * Set the timeout configuration from server config
   */
  static setConfig(timeoutConfig: ServerConfig['performance']['timeout']): void {
    this.config = timeoutConfig;
  }

  /**
   * Wrap an operation with a timeout based on configuration
   * @param operation - The async operation to execute
   * @param timeoutType - Type of timeout ('request' or 'adapter')
   * @param customTimeout - Override timeout value
   * @returns Promise resolving to the operation result
   */
  static async withTimeout<T>(
    operation: () => Promise<T>,
    timeoutType: 'request' | 'adapter',
    customTimeout?: number
  ): Promise<T> {
    const timeout =
      customTimeout || (this.config ? this.config[timeoutType] : timeoutType === 'request' ? 30000 : 5000);

    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeout}ms`));
      }, timeout);

      operation()
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Create a timeout promise that rejects after the specified time
   * @param ms - Milliseconds to wait before rejecting
   * @param message - Error message to use when timing out
   */
  static createTimeout(ms: number, message = 'Operation timed out'): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    });
  }

  /**
   * Get configured timeout for a specific type
   * @param timeoutType - Type of timeout to get
   * @returns Timeout in milliseconds
   */
  static getTimeout(timeoutType: 'request' | 'adapter'): number {
    if (!this.config) {
      return timeoutType === 'request' ? 30000 : 5000;
    }
    return this.config[timeoutType];
  }
}

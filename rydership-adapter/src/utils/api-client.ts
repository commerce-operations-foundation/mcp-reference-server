/**
 * API Client for Rydership
 *
 * This is a generic HTTP client wrapper that handles:
 * - Authentication
 * - Request/response formatting
 * - Error handling
 * - Retries
 * - Logging
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import type { RydershipApiResponse } from '../types.js';

export interface ApiClientConfig {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
  retryAttempts?: number;
  debugMode?: boolean;
  headers?: Record<string, string>;
}

export class ApiClient {
  private client: AxiosInstance;
  private config: ApiClientConfig;
  private retryAttempts: number;
  private debugMode: boolean;

  constructor(config: ApiClientConfig) {
    this.config = config;
    this.retryAttempts = config.retryAttempts || 3;
    this.debugMode = config.debugMode || false;

    // Create axios instance with default configuration
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        // Add your authentication header
        // Different APIs use different auth methods:
        // 'X-API-Key': config.apiKey,
        'Authorization': `Bearer ${config.apiKey}`,
        // 'API-Key': config.apiKey,
        ...config.headers,
      },
    });

    // Request interceptor for debugging
    this.client.interceptors.request.use(
      (request) => {
        if (this.debugMode) {
          console.log('[API Request]', {
            method: request.method?.toUpperCase(),
            url: request.url,
            params: request.params,
            data: request.data,
          });
        }
        return request;
      },
      (error) => {
        if (this.debugMode) {
          console.error('[API Request Error]', error);
        }
        return Promise.reject(error);
      }
    );

    // Response interceptor for debugging and error handling
    this.client.interceptors.response.use(
      (response) => {
        if (this.debugMode) {
          console.log('[API Response]', {
            status: response.status,
            statusText: response.statusText,
            url: response.config.url,
            data: response.data,
          });
        }
        return response;
      },
      (error) => {
        if (this.debugMode) {
          console.error('[API Response Error]', {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            url: error.config?.url,
            data: error.response?.data,
          });
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * GET request
   */
  async get<T = unknown>(path: string, params?: unknown): Promise<RydershipApiResponse<T>> {
    return this.request<T>({
      method: 'GET',
      url: path,
      params,
    });
  }

  /**
   * POST request
   */
  async post<T = unknown>(path: string, data?: unknown, params?: unknown): Promise<RydershipApiResponse<T>> {
    return this.request<T>({
      method: 'POST',
      url: path,
      data,
      params,
    });
  }

  /**
   * PUT request
   */
  async put<T = unknown>(path: string, data?: unknown, params?: unknown): Promise<RydershipApiResponse<T>> {
    return this.request<T>({
      method: 'PUT',
      url: path,
      data,
      params,
    });
  }

  /**
   * PATCH request
   */
  async patch<T = unknown>(path: string, data?: unknown, params?: unknown): Promise<RydershipApiResponse<T>> {
    return this.request<T>({
      method: 'PATCH',
      url: path,
      data,
      params,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = unknown>(path: string, params?: unknown): Promise<RydershipApiResponse<T>> {
    return this.request<T>({
      method: 'DELETE',
      url: path,
      params,
    });
  }

  /**
   * Generic request method with retry logic
   */
  private async request<T>(config: AxiosRequestConfig, attempt = 1): Promise<RydershipApiResponse<T>> {
    try {
      const response = await this.client.request(config);

      // Transform the response to our standard format
      // Adjust this based on your Fulfillment API response format
      return {
        success: true,
        data: response.data,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: response.headers['x-request-id'] || '',
          version: response.headers['x-api-version'] || '',
        },
      };
    } catch (error) {
      // Handle axios errors
      if (axios.isAxiosError(error)) {
        return this.handleAxiosError<T>(error, config, attempt);
      }

      // Handle other errors
      throw error;
    }
  }

  /**
   * Handle Axios errors with retry logic
   */
  private async handleAxiosError<T>(
    error: AxiosError,
    config: AxiosRequestConfig,
    attempt: number
  ): Promise<RydershipApiResponse<T>> {
    const status = error.response?.status;

    // Determine if we should retry
    const shouldRetry = this.shouldRetry(status, attempt);

    if (shouldRetry) {
      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      if (this.debugMode) {
        console.log(`[API Retry] Attempt ${attempt + 1}/${this.retryAttempts} after ${delay}ms`);
      }
      await this.sleep(delay);

      // Retry the request
      return this.request<T>(config, attempt + 1);
    }

    // Return error response
    return {
      success: false,
      error: {
        code: this.getErrorCode(status),
        message: this.getErrorMessage(error),
        details: error.response?.data as Record<string, unknown> | undefined,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: error.response?.headers['x-request-id'] || '',
        version: error.response?.headers['x-api-version'] || '',
      },
    };
  }

  /**
   * Determine if request should be retried
   */
  private shouldRetry(status: number | undefined, attempt: number): boolean {
    // Don't retry if we've exceeded max attempts
    if (attempt >= this.retryAttempts) {
      return false;
    }

    // Retry on network errors (no status)
    if (!status) {
      return true;
    }

    // Retry on 5xx errors (server errors)
    if (status >= 500) {
      return true;
    }

    // Retry on specific 4xx errors
    const retryableStatuses = [
      408, // Request Timeout
      429, // Too Many Requests
      423, // Locked
    ];

    return retryableStatuses.includes(status);
  }

  /**
   * Get error code from status
   */
  private getErrorCode(status: number | undefined): string {
    if (!status) {
      return 'NETWORK_ERROR';
    }

    const errorCodes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      408: 'TIMEOUT',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
      429: 'RATE_LIMITED',
      500: 'INTERNAL_SERVER_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
      504: 'GATEWAY_TIMEOUT',
    };

    return errorCodes[status] || 'UNKNOWN_ERROR';
  }

  /**
   * Extract error message from Axios error
   */
  private getErrorMessage(error: AxiosError): string {
    // Try to get message from response data
    const responseData = error.response?.data as unknown;

    if (responseData && typeof responseData === 'object' && responseData !== null) {
      // Common error message fields in APIs
      if ('message' in responseData && typeof responseData.message === 'string') {
        return responseData.message;
      }
      if ('error' in responseData) {
        const errorField = responseData.error;
        if (typeof errorField === 'string') {
          return errorField;
        }
        if (errorField && typeof errorField === 'object' && 'message' in errorField) {
          return String(errorField.message);
        }
      }
      if ('errors' in responseData && Array.isArray(responseData.errors)) {
        return responseData.errors
          .map((e: unknown) => {
            if (e && typeof e === 'object' && 'message' in e) {
              return e.message;
            }
            return String(e);
          })
          .join(', ');
      }
    }

    // Fall back to axios error message
    return error.message || 'An unknown error occurred';
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Update authentication token (if using token-based auth)
   */
  updateApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
    this.client.defaults.headers.common['X-API-Key'] = apiKey;
    // Or if using Bearer token:
    // this.client.defaults.headers.common['Authorization'] = `Bearer ${apiKey}`;
  }

  /**
   * Get current configuration
   */
  getConfig(): ApiClientConfig {
    return { ...this.config };
  }

  /**
   * Enable/disable debug mode
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }
}

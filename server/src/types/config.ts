/**
 * Configuration type definitions
 */

import { AdapterConfig } from './adapter.js';

export interface ServerConfig {
  server: {
    description: string;
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
    port?: number;
    host?: string;
  };

  adapter: AdapterConfig;

  logging: {
    level: 'error' | 'warn' | 'info' | 'debug';
    dir: string;
    external?: {
      enabled: boolean;
      service: string;
      apiKey?: string;
    };
  };

  security: {
    sanitization: {
      enabled: boolean;
      maxRequestSize: number;
    };
  };

  performance: {
    monitoring: {
      enabled: boolean;
      intervalMs: number;
    };
    timeout: {
      request: number;
      adapter: number;
    };
  };

  resilience: {
    circuitBreaker: {
      enabled: boolean;
      failureThreshold: number;
      resetTimeout: number;
    };
    retry: {
      enabled: boolean;
      maxAttempts: number;
      initialDelay: number;
    };
  };

  features: {
    [key: string]: boolean;
  };
}

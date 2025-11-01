/**
 * Configuration type definitions
 */

import { z } from 'zod';
import { AdapterConfig } from './adapter.js';

// Zod schema for adapter configuration
const adapterConfigSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('built-in'),
    name: z.string({ message: 'Built-in adapter requires a name' }).min(1, 'Built-in adapter requires a name'),
    package: z.string().optional(),
    path: z.string().optional(),
    exportName: z.string().optional(),
    options: z.record(z.string(), z.unknown()).optional(),
  }),
  z.object({
    type: z.literal('npm'),
    package: z.string({ message: 'NPM adapter requires a package name' }).min(1, 'NPM adapter requires a package name'),
    name: z.string().optional(),
    path: z.string().optional(),
    exportName: z.string().optional(),
    options: z.record(z.string(), z.unknown()).optional(),
  }),
  z.object({
    type: z.literal('local'),
    path: z.string({ message: 'Local adapter requires a path' }).min(1, 'Local adapter requires a path'),
    name: z.string().optional(),
    package: z.string().optional(),
    exportName: z.string().optional(),
    options: z.record(z.string(), z.unknown()).optional(),
  }),
]);

// Zod schema for server configuration
export const serverConfigSchema = z
  .object({
    server: z.object({
      description: z.string(),
      name: z.string({ message: 'Server name is required and must be a string' }).min(1, 'Server name is required and must be a string'),
      version: z.string({ message: 'Server version is required and must be a string' }).min(1, 'Server version is required and must be a string'),
      environment: z.enum(['development', 'staging', 'production'], {
        message: 'Server environment must be one of: development, staging, production',
      }),
      port: z
        .number()
        .int()
        .min(1, 'Server port must be a number between 1 and 65535')
        .max(65535, 'Server port must be a number between 1 and 65535')
        .optional(),
      host: z.string().optional(),
    }),

    adapter: adapterConfigSchema,

    logging: z.object({
      level: z.enum(['error', 'warn', 'info', 'debug'], {
        message: 'Logging level must be one of: error, warn, info, debug',
      }),
      dir: z.string({ message: 'Logging directory is required and must be a string' }).min(1, 'Logging directory is required and must be a string'),
      external: z
        .object({
          enabled: z.boolean(),
          service: z.string(),
          apiKey: z.string().optional(),
        })
        .refine(
          (data) => {
            if (data.enabled) {
              return data.service && data.service.length > 0;
            }
            return true;
          },
          {
            message: 'External logging service is required when enabled',
          }
        )
        .optional(),
    }),

    security: z.object({
      sanitization: z.object({
        enabled: z.boolean(),
        maxRequestSize: z.number().positive('Max request size must be a positive number'),
      }),
    }),

    performance: z.object({
      monitoring: z.object({
        enabled: z.boolean(),
        intervalMs: z.number().refine((val) => val >= 1000, {
          message: 'Monitoring interval must be at least 1000ms',
        }),
      }),
      timeout: z.object({
        request: z.number().positive('Request timeout must be a positive number'),
        adapter: z.number().positive('Adapter timeout must be a positive number'),
      }),
    }),

    resilience: z.object({
      circuitBreaker: z.object({
        enabled: z.boolean(),
        failureThreshold: z.number().positive('Circuit breaker failure threshold must be a positive number'),
        resetTimeout: z.number().refine((val) => val >= 1000, {
          message: 'Circuit breaker reset timeout must be at least 1000ms',
        }),
      }),
      retry: z.object({
        enabled: z.boolean(),
        maxAttempts: z.number().positive('Retry max attempts must be a positive number'),
        initialDelay: z.number().min(0, 'Retry initial delay must be non-negative'),
      }),
    }),

    features: z.record(z.string(), z.boolean()),
  })
  .refine(
    (data) => {
      // Adapter timeout must be less than request timeout
      return data.performance.timeout.adapter < data.performance.timeout.request;
    },
    {
      message: 'Adapter timeout must be less than request timeout',
      path: ['performance', 'timeout'],
    }
  );

// Infer TypeScript type from Zod schema
export type ServerConfig = z.infer<typeof serverConfigSchema>;

// Keep the AdapterConfig export for backward compatibility
export type { AdapterConfig };

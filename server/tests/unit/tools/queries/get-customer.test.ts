/**
import { vi, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'; * Unit tests for GetCustomerTool
 */

import { GetCustomerTool } from '../../../../src/tools/queries/get-customer.js';
import { ServiceOrchestrator } from '../../../../src/services/service-orchestrator.js';
import { ServerConfig } from '../../../../src/config/config-manager.js';

// Mock ServiceOrchestrator with properly typed methods
class MockServiceOrchestrator extends ServiceOrchestrator {
  constructor() {
    super();
  }

  getCustomer = vi.fn();
}

describe('GetCustomerTool', () => {
  let tool: GetCustomerTool;
  let mockServiceOrchestrator: vi.Mocked<ServiceOrchestrator>;
  let mockConfig: ServerConfig;

  beforeEach(() => {
    mockConfig = {
      server: {
        name: 'test-server',
        version: '1.0.0',
        environment: 'development' as const,
        port: 3000,
        host: 'localhost'
      },
      adapter: {
        type: 'built-in' as const,
        name: 'mock',
        options: {}
      },
      logging: {
        level: 'debug' as const,
        dir: '/tmp/logs'
      },
      security: {
        authentication: {
          enabled: false,
          type: 'none' as const
        },
        rateLimiting: {
          enabled: false,
          windowMs: 60000,
          maxRequests: 100
        },
        sanitization: {
          enabled: true,
          maxRequestSize: 1024000
        }
      },
      performance: {
        monitoring: {
          enabled: false,
          intervalMs: 60000
        },
        timeout: {
          request: 30000,
          adapter: 25000
        }
      },
      resilience: {
        circuitBreaker: {
          enabled: false,
          failureThreshold: 5,
          resetTimeout: 60000
        },
        retry: {
          enabled: false,
          maxAttempts: 3,
          initialDelay: 1000
        }
      },
      features: {}
    } as ServerConfig;

    mockServiceOrchestrator = new MockServiceOrchestrator() as unknown as vi.Mocked<ServiceOrchestrator>;
    tool = new GetCustomerTool(mockServiceOrchestrator);
  });

  describe('Tool Metadata', () => {
    it('should have correct name', () => {
      expect(tool.name).toBe('get-customer');
    });

    it('should have description', () => {
      expect(tool.description).toBeDefined();
      expect(tool.description.length).toBeGreaterThan(0);
    });

    it('should have valid input schema', () => {
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.inputSchema.properties).toBeDefined();
      expect(tool.inputSchema.required).toContain('identifier');
    });

  });

  describe('Tool Execution', () => {
    it('should delegate to service layer getCustomer', async () => {
      const mockInput = {
        identifier: {
          customerId: 'customer-123'
        }
      };

      const mockResult = {
        success: true,
        customer: {
          customerId: 'customer-123',
          email: 'test@example.com',
          status: 'active' as const
        }
      };

      mockServiceOrchestrator.getCustomer.mockResolvedValue(mockResult);

      const result = await tool.execute(mockInput);

      expect(mockServiceOrchestrator.getCustomer).toHaveBeenCalledWith(mockInput.identifier);
      expect(result).toEqual(mockResult);
    });

    it('should handle email identifier', async () => {
      const mockInput = {
        identifier: {
          email: 'customer@example.com'
        }
      };

      await tool.execute(mockInput);

      expect(mockServiceOrchestrator.getCustomer).toHaveBeenCalledWith(mockInput.identifier);
    });
  });
});
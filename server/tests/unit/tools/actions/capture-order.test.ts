/**
import { vi, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'; * Unit tests for CaptureOrderTool
 */

import { CaptureOrderTool } from '../../../../src/tools/actions/capture-order.js';
import { ServiceOrchestrator } from '../../../../src/services/service-orchestrator.js';
import { ServerConfig } from '../../../../src/types/config.js';

// Mock ServiceOrchestrator
vi.mock('../../../../src/services/service-orchestrator');
const MockServiceOrchestrator = vi.mocked(ServiceOrchestrator);

describe('CaptureOrderTool', () => {
  let tool: CaptureOrderTool;
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
        type: 'built-in',
        name: 'mock'
      }
    } as ServerConfig;

    mockServiceOrchestrator = new MockServiceOrchestrator() as vi.Mocked<ServiceOrchestrator>;
    tool = new CaptureOrderTool(mockServiceOrchestrator);
  });

  describe('Tool Metadata', () => {
    it('should have correct name and description', () => {
      expect(tool.name).toBe('capture-order');
      expect(tool.description).toContain('Creates a new order when a customer completes checkout');
    });

    it('should have valid input schema', () => {
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.inputSchema.properties).toBeDefined();
      expect(tool.inputSchema.required).toEqual(['order']);
    });

  });

  describe('Tool Description', () => {
    it('should return proper tool description', () => {
      const description = tool.getDescription();
      
      expect(description.name).toBe('capture-order');
      expect(description.description).toContain('Creates a new order when a customer completes checkout');
      expect(description.inputSchema).toEqual(tool.inputSchema);
    });
  });

  describe('Execute Method', () => {
    it('should delegate to service layer captureOrder', async () => {
      const mockInput = {
        order: {
          extOrderId: 'EXT-12345',
          customer: {
            firstName: 'John',
            lastName: 'Doe'
          },
          lineItems: [{
            sku: 'TEST-001',
            quantity: 1
          }]
        }
      };

      const mockResult = {
        success: true,
        orderId: 'order_123',
        orderNumber: 'ORD-001',
        status: 'confirmed',
        createdAt: '2025-01-01T00:00:00Z'
      };

      mockServiceOrchestrator.captureOrder = vi.fn().mockResolvedValue(mockResult);

      const result = await tool.execute(mockInput);

      expect(mockServiceOrchestrator.captureOrder).toHaveBeenCalledWith(mockInput.order);
      expect(result).toEqual(mockResult);
    });

    it('should handle service layer errors', async () => {
      const mockInput = {
        order: {
          extOrderId: 'EXT-12345'
        }
      };

      const mockError = new Error('Service layer error');
      mockServiceOrchestrator.captureOrder = vi.fn().mockRejectedValue(mockError);

      await expect(tool.execute(mockInput)).rejects.toThrow('Service layer error');
      expect(mockServiceOrchestrator.captureOrder).toHaveBeenCalledWith(mockInput.order);
    });
  });

  describe('Input Validation Schema', () => {
    it('should require extOrderId in order', () => {
      const orderSchema = tool.inputSchema.properties?.order as any;
      expect(orderSchema?.required).toContain('extOrderId');
    });

    it('should have proper lineItems schema', () => {
      const orderSchema = tool.inputSchema.properties?.order as any;
      const lineItemsSchema = orderSchema?.properties?.lineItems;
      
      expect(lineItemsSchema?.type).toBe('array');
      expect(lineItemsSchema?.items?.type).toBe('object');
    });

    it('should have address schemas for billing and shipping', () => {
      const orderSchema = tool.inputSchema.properties?.order as any;
      
      expect(orderSchema?.properties?.billingAddress).toBeDefined();
      expect(orderSchema?.properties?.shippingAddress).toBeDefined();
    });
  });
});
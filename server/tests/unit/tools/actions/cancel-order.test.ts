/**
import { vi, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'; * Unit tests for CancelOrderTool
 */

import { CancelOrderTool } from '../../../../src/tools/actions/cancel-order.js';
import { ServiceOrchestrator } from '../../../../src/services/service-orchestrator.js';
import { ServerConfig } from '../../../../src/types/config.js';

// Mock ServiceOrchestrator
vi.mock('../../../../src/services/service-orchestrator');
const MockServiceOrchestrator = vi.mocked(ServiceOrchestrator);

describe('CancelOrderTool', () => {
  let tool: CancelOrderTool;
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
    tool = new CancelOrderTool(mockServiceOrchestrator);
  });

  describe('Tool Metadata', () => {
    it('should have correct name and description', () => {
      expect(tool.name).toBe('cancel-order');
      expect(tool.description).toContain('Cancels an order to stop fulfillment');
    });

    it('should have valid input schema', () => {
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.inputSchema.required).toEqual(['orderId']);
    });

    it('should have reason enum with valid values', () => {
      const reasonSchema = tool.inputSchema.properties?.reason as any;
      expect(reasonSchema?.enum).toContain('customer_request');
      expect(reasonSchema?.enum).toContain('payment_failed');
      expect(reasonSchema?.enum).toContain('fraud_detected');
    });

  });

  describe('Execute Method', () => {
    it('should delegate to service layer cancelOrder', async () => {
      const mockInput = {
        orderId: 'order_123',
        reason: 'customer_request'
      };

      const mockResult = {
        success: true,
        orderId: 'order_123',
        status: 'cancelled' as const,
        cancelledAt: '2025-01-01T00:00:00Z',
        refundInitiated: true
      };

      mockServiceOrchestrator.cancelOrder = vi.fn().mockResolvedValue(mockResult);

      const result = await tool.execute(mockInput);

      expect(mockServiceOrchestrator.cancelOrder).toHaveBeenCalledWith(
        mockInput.orderId,
        mockInput.reason
      );
      expect(result).toEqual(mockResult);
    });

    it('should work without reason parameter', async () => {
      const mockInput = {
        orderId: 'order_123'
      };

      const mockResult = {
        success: true,
        orderId: 'order_123',
        status: 'cancelled' as const,
        cancelledAt: '2025-01-01T00:00:00Z',
        refundInitiated: true
      };

      mockServiceOrchestrator.cancelOrder = vi.fn().mockResolvedValue(mockResult);

      const result = await tool.execute(mockInput);

      expect(mockServiceOrchestrator.cancelOrder).toHaveBeenCalledWith(
        mockInput.orderId,
        undefined
      );
      expect(result).toEqual(mockResult);
    });

    it('should handle service layer errors', async () => {
      const mockInput = {
        orderId: 'order_123',
        reason: 'customer_request'
      };

      const mockError = new Error('Order not found');
      mockServiceOrchestrator.cancelOrder = vi.fn().mockRejectedValue(mockError);

      await expect(tool.execute(mockInput)).rejects.toThrow('Order not found');
    });
  });

  describe('Input Schema Validation', () => {
    it('should have refundAmount with minimum 0', () => {
      const refundAmountSchema = tool.inputSchema.properties?.refundAmount as any;
      expect(refundAmountSchema?.minimum).toBe(0);
    });

    it('should have notifyCustomer with default true', () => {
      const notifyCustomerSchema = tool.inputSchema.properties?.notifyCustomer as any;
      expect(notifyCustomerSchema?.default).toBe(true);
    });
  });
});
/**
import { vi, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'; * Unit tests for HoldOrderTool
 */

import { HoldOrderTool } from '../../../../src/tools/management/hold-order.js';
import { ServiceOrchestrator } from '../../../../src/services/service-orchestrator.js';
import { ServerConfig } from '../../../../src/types/config.js';

// Mock ServiceOrchestrator
vi.mock('../../../../src/services/service-orchestrator');
const MockServiceOrchestrator = vi.mocked(ServiceOrchestrator);

describe('HoldOrderTool', () => {
  let tool: HoldOrderTool;
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
    tool = new HoldOrderTool(mockServiceOrchestrator);
  });

  describe('Tool Metadata', () => {
    it('should have correct name and description', () => {
      expect(tool.name).toBe('hold-order');
      expect(tool.description).toContain('Temporarily stops order processing');
    });

    it('should have valid input schema', () => {
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.inputSchema.required).toEqual(['orderId', 'reason']);
    });

    it('should have reason enum with valid values', () => {
      const reasonSchema = tool.inputSchema.properties?.reason as any;
      expect(reasonSchema?.enum).toContain('payment_verification');
      expect(reasonSchema?.enum).toContain('fraud_review');
      expect(reasonSchema?.enum).toContain('inventory_check');
    });

    it('should have priority enum with default normal', () => {
      const prioritySchema = tool.inputSchema.properties?.priority as any;
      expect(prioritySchema?.enum).toEqual(['low', 'normal', 'high', 'urgent']);
      expect(prioritySchema?.default).toBe('normal');
    });

  });

  describe('Execute Method', () => {
    it('should delegate to service layer holdOrder with correct parameters', async () => {
      const mockInput = {
        orderId: 'order_123',
        reason: 'payment_verification',
        releaseDate: '2025-01-02T00:00:00Z',
        priority: 'high',
        assignedTo: 'user_456',
        notes: 'Payment verification required',
        allowPartialRelease: false
      };

      const expectedHoldParams = {
        reason: 'payment_verification',
        releaseDate: '2025-01-02T00:00:00Z',
        priority: 'high',
        assignedTo: 'user_456',
        notes: 'Payment verification required',
        allowPartialRelease: false
      };

      const mockResult = {
        success: true,
        orderId: 'order_123',
        holdId: 'hold_789',
        status: 'on_hold' as const,
        reason: 'payment_verification',
        holdPlacedAt: '2025-01-01T00:00:00Z',
        releaseDate: '2025-01-02T00:00:00Z'
      };

      mockServiceOrchestrator.holdOrder = vi.fn().mockResolvedValue(mockResult);

      const result = await tool.execute(mockInput);

      expect(mockServiceOrchestrator.holdOrder).toHaveBeenCalledWith(
        mockInput.orderId,
        expectedHoldParams
      );
      expect(result).toEqual(mockResult);
    });

    it('should work with minimal parameters', async () => {
      const mockInput = {
        orderId: 'order_123',
        reason: 'fraud_review'
      };

      const expectedHoldParams = {
        reason: 'fraud_review',
        releaseDate: undefined,
        priority: undefined,
        assignedTo: undefined,
        notes: undefined,
        allowPartialRelease: undefined
      };

      const mockResult = {
        success: true,
        orderId: 'order_123',
        holdId: 'hold_789',
        status: 'on_hold' as const,
        reason: 'fraud_review'
      };

      mockServiceOrchestrator.holdOrder = vi.fn().mockResolvedValue(mockResult);

      const result = await tool.execute(mockInput);

      expect(mockServiceOrchestrator.holdOrder).toHaveBeenCalledWith(
        mockInput.orderId,
        expectedHoldParams
      );
      expect(result).toEqual(mockResult);
    });

    it('should handle service layer errors', async () => {
      const mockInput = {
        orderId: 'order_123',
        reason: 'payment_verification'
      };

      const mockError = new Error('Order cannot be held');
      mockServiceOrchestrator.holdOrder = vi.fn().mockRejectedValue(mockError);

      await expect(tool.execute(mockInput)).rejects.toThrow('Order cannot be held');
    });
  });

  describe('Input Schema Properties', () => {
    it('should have releaseDate with date-time format', () => {
      const releaseDateSchema = tool.inputSchema.properties?.releaseDate as any;
      expect(releaseDateSchema?.format).toBe('date-time');
    });

    it('should have notifyCustomer with default false', () => {
      const notifyCustomerSchema = tool.inputSchema.properties?.notifyCustomer as any;
      expect(notifyCustomerSchema?.default).toBe(false);
    });

    it('should have allowPartialRelease with default false', () => {
      const allowPartialReleaseSchema = tool.inputSchema.properties?.allowPartialRelease as any;
      expect(allowPartialReleaseSchema?.default).toBe(false);
    });
  });
});
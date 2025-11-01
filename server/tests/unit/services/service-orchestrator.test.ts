/**
 * Service Orchestrator unit tests
 *
 * Note: This file contains basic unit tests for ServiceOrchestrator.
 * For comprehensive testing of service interactions, see the integration tests.
 */
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ServiceOrchestrator } from '../../../src/services/service-orchestrator';
import { Logger } from '../../../src/utils/logger';

// Mock Logger
vi.mock('../../../src/utils/logger', () => ({
  Logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ServiceOrchestrator', () => {
  let serviceOrchestrator: ServiceOrchestrator;

  beforeEach(() => {
    vi.clearAllMocks();
    serviceOrchestrator = new ServiceOrchestrator();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Constructor', () => {
    it('should initialize with correct state', () => {
      expect(serviceOrchestrator).toBeInstanceOf(ServiceOrchestrator);
      expect(serviceOrchestrator.isInitialized()).toBe(false);
      expect(Logger.info).toHaveBeenCalledWith('ServiceOrchestrator initialized');
    });

    it('should initialize metrics correctly', () => {
      const metrics = serviceOrchestrator.getMetrics();
      expect(metrics).toBeDefined();
      expect(metrics).toHaveProperty('system');
      expect(metrics).toHaveProperty('health');
    });
  });

  describe('initialization state', () => {
    it('should handle initialization error', async () => {
      await expect(serviceOrchestrator.initialize(undefined as any)).rejects.toThrow();
    });

    it('should throw error when operations called before initialization', async () => {
      const uninitializedService = new ServiceOrchestrator();

      // Test that operations throw when not initialized
      await expect(uninitializedService.createSalesOrder({} as any)).rejects.toThrow(
        'ServiceOrchestrator not initialized'
      );
      await expect(uninitializedService.cancelOrder({ orderId: 'order-id' } as any)).rejects.toThrow(
        'ServiceOrchestrator not initialized'
      );
      await expect(uninitializedService.getOrders({})).rejects.toThrow('ServiceOrchestrator not initialized');
      await expect(uninitializedService.getInventory({ skus: ['sku'] })).rejects.toThrow(
        'ServiceOrchestrator not initialized'
      );
    });
  });

  describe('cleanup', () => {
    it('should handle cleanup without initialization', async () => {
      const service = new ServiceOrchestrator();
      await service.cleanup();
      expect(Logger.info).toHaveBeenCalledWith('ServiceOrchestrator cleanup completed');
    });
  });

  describe('checkHealth', () => {
    it('should return health status when not initialized', async () => {
      const health = await serviceOrchestrator.checkHealth();
      expect(health).toBeDefined();
      expect(health.status).toBeDefined();
    });
  });
});

/**
 * NOTE: Comprehensive testing of ServiceOrchestrator with actual service interactions
 * is handled in the integration tests at tests/integration/
 *
 * The following test scenarios are covered in integration tests:
 * - Actual order operations (capture, cancel, update, return, exchange, split)
 * - Query operations with real data
 * - Error handling and validation
 * - Metrics tracking
 * - Adapter interactions
 *
 * This unit test file focuses only on basic initialization and state management
 * that can be tested without heavy mocking.
 */

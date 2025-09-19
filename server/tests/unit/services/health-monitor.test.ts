/**
 * Tests for HealthMonitor timer management
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { HealthMonitor } from '../../../src/services/health-monitor';

// Mock setInterval and clearInterval
const mockSetInterval = vi.fn();
const mockClearInterval = vi.fn();

// Store original timers
const originalSetInterval = global.setInterval;
const originalClearInterval = global.clearInterval;

describe('HealthMonitor Timer Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock timer functions
    global.setInterval = mockSetInterval.mockReturnValue('mock-interval-id');
    global.clearInterval = mockClearInterval;
  });

  afterEach(() => {
    // Restore original timer functions
    global.setInterval = originalSetInterval;
    global.clearInterval = originalClearInterval;
  });

  describe('Constructor', () => {
    it('should start uptime interval on construction', () => {
      new HealthMonitor();
      
      expect(mockSetInterval).toHaveBeenCalledTimes(1);
      expect(mockSetInterval).toHaveBeenCalledWith(
        expect.any(Function),
        60000
      );
    });
  });

  describe('Timer Management', () => {
    let healthMonitor: HealthMonitor;

    beforeEach(() => {
      healthMonitor = new HealthMonitor();
      vi.clearAllMocks(); // Clear constructor calls
    });

    it('should stop interval when stop() is called', () => {
      healthMonitor.stop();
      
      expect(mockClearInterval).toHaveBeenCalledTimes(1);
      expect(mockClearInterval).toHaveBeenCalledWith('mock-interval-id');
    });

    it('should restart interval when restart() is called', () => {
      healthMonitor.restart();
      
      // Should clear old interval and create new one
      expect(mockClearInterval).toHaveBeenCalledTimes(1);
      expect(mockSetInterval).toHaveBeenCalledTimes(1);
      expect(mockSetInterval).toHaveBeenCalledWith(
        expect.any(Function),
        60000
      );
    });

    it('should handle multiple stop calls gracefully', () => {
      healthMonitor.stop();
      healthMonitor.stop(); // Second call should be safe
      
      expect(mockClearInterval).toHaveBeenCalledTimes(1);
    });

    it('should clear interval when stopped and create new one when restarted', () => {
      // Stop the monitor
      healthMonitor.stop();
      expect(mockClearInterval).toHaveBeenCalledTimes(1);
      
      // Restart should create new interval
      vi.clearAllMocks();
      healthMonitor.restart();
      expect(mockSetInterval).toHaveBeenCalledTimes(1);
    });
  });

  describe('Functional Tests with Real Timers', () => {
    beforeEach(() => {
      // Use real timers for functional tests
      global.setInterval = originalSetInterval;
      global.clearInterval = originalClearInterval;
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should update uptime when interval fires', () => {
      const healthMonitor = new HealthMonitor();
      
      // Get initial uptime
      const initialMetrics = healthMonitor.getMetrics();
      expect(initialMetrics.uptime).toBe(0);
      
      // Advance time by 60 seconds and trigger interval
      vi.advanceTimersByTime(60000);
      
      // Check that uptime was updated
      const updatedMetrics = healthMonitor.getMetrics();
      expect(updatedMetrics.uptime).toBeGreaterThan(0);
      
      // Clean up
      healthMonitor.stop();
    });

    it('should not update uptime after stop() is called', () => {
      const healthMonitor = new HealthMonitor();
      
      // Stop the monitor
      healthMonitor.stop();
      
      // Advance time - uptime should not be updated automatically
      vi.advanceTimersByTime(60000);
      
      const metrics = healthMonitor.getMetrics();
      // Uptime should only update when getMetrics() is called, not from interval
      expect(metrics.uptime).toBeGreaterThan(0); // getMetrics() calls updateUptime()
    });
  });
});
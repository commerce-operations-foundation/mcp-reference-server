/**
 * Integration test for HealthMonitor lifecycle management
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ServiceOrchestrator } from '../../src/services/service-orchestrator';

describe('HealthMonitor Lifecycle Integration', () => {
  let orchestrator: ServiceOrchestrator;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(async () => {
    if (orchestrator) {
      await orchestrator.cleanup();
    }
    vi.useRealTimers();
  });

  it('should properly clean up HealthMonitor timers on ServiceOrchestrator cleanup', async () => {
    // Track active timers
    const activeTimersBefore = vi.getTimerCount();
    
    // Create orchestrator (this creates HealthMonitor with interval)
    orchestrator = new ServiceOrchestrator();
    
    // Should have one more timer now (the uptime interval)
    const activeTimersAfter = vi.getTimerCount();
    expect(activeTimersAfter).toBeGreaterThan(activeTimersBefore);
    
    // Cleanup should remove the timer
    await orchestrator.cleanup();
    
    // Timer count should be back to original (or less)
    const activeTimersAfterCleanup = vi.getTimerCount();
    expect(activeTimersAfterCleanup).toBeLessThanOrEqual(activeTimersBefore);
  });

  it('should prevent timer leaks on multiple initializations', async () => {
    const initialTimerCount = vi.getTimerCount();
    
    // Create and cleanup multiple orchestrators
    for (let i = 0; i < 3; i++) {
      const tempOrchestrator = new ServiceOrchestrator();
      await tempOrchestrator.cleanup();
    }
    
    // Should not accumulate timers
    const finalTimerCount = vi.getTimerCount();
    expect(finalTimerCount).toBeLessThanOrEqual(initialTimerCount + 1); // Allow for some test framework overhead
  });

  it('should not crash on multiple cleanup calls', async () => {
    orchestrator = new ServiceOrchestrator();
    
    // Multiple cleanup calls should be safe
    await orchestrator.cleanup();
    await orchestrator.cleanup(); // Should not throw
    
    expect(true).toBe(true); // If we get here, no crash occurred
  });
});
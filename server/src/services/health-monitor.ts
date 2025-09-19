/**
 * Health Monitor
 * Centralized monitoring for system health, metrics, and performance
 */

import { Logger } from '../utils/logger.js';
import { HealthStatus } from '../types/index.js';

interface ServiceMetrics {
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
  lastOperation: string | null;
  lastOperationTime: Date | null;
}

interface SystemMetrics {
  uptime: number;
  totalRequests: number;
  totalErrors: number;
  averageResponseTime: number;
  services: Map<string, ServiceMetrics>;
  lastUpdated: Date;
}

interface PerformanceMetrics {
  operation: string;
  duration: number;
  success: boolean;
  timestamp: Date;
}

export class HealthMonitor {
  private systemMetrics: SystemMetrics;
  private performanceHistory: PerformanceMetrics[] = [];
  private readonly maxHistorySize = 1000;
  private startTime: Date;
  private healthChecks: Map<string, HealthStatus> = new Map();
  private uptimeInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startTime = new Date();
    this.systemMetrics = {
      uptime: 0,
      totalRequests: 0,
      totalErrors: 0,
      averageResponseTime: 0,
      services: new Map(),
      lastUpdated: new Date()
    };
    
    Logger.debug('HealthMonitor initialized');
    
    // Update uptime periodically
    this.uptimeInterval = setInterval(() => this.updateUptime(), 60000); // Every minute
  }

  /**
   * Record operation metrics
   */
  recordOperation(
    service: string,
    operation: string,
    duration: number,
    success: boolean
  ): void {
    // Update system metrics
    this.systemMetrics.totalRequests++;
    if (!success) {
      this.systemMetrics.totalErrors++;
    }
    
    // Update average response time
    const totalDuration = this.systemMetrics.averageResponseTime * 
      (this.systemMetrics.totalRequests - 1) + duration;
    this.systemMetrics.averageResponseTime = totalDuration / this.systemMetrics.totalRequests;
    
    // Update service-specific metrics
    this.updateServiceMetrics(service, operation, duration, success);
    
    // Add to performance history
    this.addToHistory({
      operation: `${service}.${operation}`,
      duration,
      success,
      timestamp: new Date()
    });
    
    this.systemMetrics.lastUpdated = new Date();
  }

  /**
   * Update service-specific metrics
   */
  private updateServiceMetrics(
    service: string,
    operation: string,
    duration: number,
    success: boolean
  ): void {
    let serviceMetrics = this.systemMetrics.services.get(service);
    
    if (!serviceMetrics) {
      serviceMetrics = {
        requestCount: 0,
        errorCount: 0,
        averageResponseTime: 0,
        lastOperation: null,
        lastOperationTime: null
      };
      this.systemMetrics.services.set(service, serviceMetrics);
    }
    
    serviceMetrics.requestCount++;
    if (!success) {
      serviceMetrics.errorCount++;
    }
    
    // Update average response time for service
    const totalDuration = serviceMetrics.averageResponseTime * 
      (serviceMetrics.requestCount - 1) + duration;
    serviceMetrics.averageResponseTime = totalDuration / serviceMetrics.requestCount;
    
    serviceMetrics.lastOperation = operation;
    serviceMetrics.lastOperationTime = new Date();
  }

  /**
   * Add to performance history
   */
  private addToHistory(metrics: PerformanceMetrics): void {
    this.performanceHistory.push(metrics);
    
    // Trim history if it exceeds max size
    if (this.performanceHistory.length > this.maxHistorySize) {
      this.performanceHistory = this.performanceHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Update system uptime
   */
  private updateUptime(): void {
    const now = new Date();
    this.systemMetrics.uptime = Math.floor(
      (now.getTime() - this.startTime.getTime()) / 1000
    );
  }

  /**
   * Record health check result
   */
  recordHealthCheck(component: string, status: HealthStatus): void {
    this.healthChecks.set(component, {
      ...status,
      checkedAt: new Date()
    });
    
    Logger.debug('Health check recorded', { 
      component, 
      status: status.status 
    });
  }

  /**
   * Get overall system health
   */
  getSystemHealth(): HealthStatus {
    const unhealthyComponents: string[] = [];
    const degradedComponents: string[] = [];
    
    this.healthChecks.forEach((status, component) => {
      if (status.status === 'unhealthy') {
        unhealthyComponents.push(component);
      } else if (status.status === 'degraded') {
        degradedComponents.push(component);
      }
    });
    
    // Calculate error rate
    const errorRate = this.systemMetrics.totalRequests > 0
      ? (this.systemMetrics.totalErrors / this.systemMetrics.totalRequests) * 100
      : 0;
    
    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    let message: string;
    
    if (unhealthyComponents.length > 0) {
      overallStatus = 'unhealthy';
      message = `Unhealthy components: ${unhealthyComponents.join(', ')}`;
    } else if (degradedComponents.length > 0 || errorRate > 10) {
      overallStatus = 'degraded';
      message = degradedComponents.length > 0
        ? `Degraded components: ${degradedComponents.join(', ')}`
        : `High error rate: ${errorRate.toFixed(2)}%`;
    } else {
      overallStatus = 'healthy';
      message = 'All systems operational';
    }
    
    return {
      status: overallStatus,
      message,
      details: {
        uptime: this.systemMetrics.uptime,
        totalRequests: this.systemMetrics.totalRequests,
        totalErrors: this.systemMetrics.totalErrors,
        errorRate: `${errorRate.toFixed(2)}%`,
        averageResponseTime: `${this.systemMetrics.averageResponseTime.toFixed(2)}ms`,
        unhealthyComponents,
        degradedComponents
      }
    };
  }

  /**
   * Get metrics for a specific service
   */
  getServiceMetrics(service: string): ServiceMetrics | null {
    return this.systemMetrics.services.get(service) || null;
  }

  /**
   * Get all system metrics
   */
  getMetrics(): SystemMetrics {
    this.updateUptime();
    return {
      ...this.systemMetrics,
      services: new Map(this.systemMetrics.services)
    };
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(
    operation?: string,
    timeWindowMs?: number
  ): {
    count: number;
    successRate: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    p95Duration: number;
    p99Duration: number;
  } {
    const now = new Date();
    const cutoff = timeWindowMs 
      ? new Date(now.getTime() - timeWindowMs)
      : new Date(0);
    
    // Filter history based on criteria
    let relevantHistory = this.performanceHistory.filter(
      m => m.timestamp >= cutoff
    );
    
    if (operation) {
      relevantHistory = relevantHistory.filter(
        m => m.operation === operation
      );
    }
    
    if (relevantHistory.length === 0) {
      return {
        count: 0,
        successRate: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        p95Duration: 0,
        p99Duration: 0
      };
    }
    
    // Calculate statistics
    const count = relevantHistory.length;
    const successCount = relevantHistory.filter(m => m.success).length;
    const successRate = (successCount / count) * 100;
    
    const durations = relevantHistory
      .map(m => m.duration)
      .sort((a, b) => a - b);
    
    const sum = durations.reduce((a, b) => a + b, 0);
    const averageDuration = sum / count;
    const minDuration = durations[0];
    const maxDuration = durations[durations.length - 1];
    
    // Calculate percentiles
    const p95Index = Math.floor(durations.length * 0.95);
    const p99Index = Math.floor(durations.length * 0.99);
    const p95Duration = durations[p95Index] || maxDuration;
    const p99Duration = durations[p99Index] || maxDuration;
    
    return {
      count,
      successRate,
      averageDuration,
      minDuration,
      maxDuration,
      p95Duration,
      p99Duration
    };
  }

  /**
   * Get slow operations
   */
  getSlowOperations(thresholdMs: number = 1000, limit: number = 10): PerformanceMetrics[] {
    return this.performanceHistory
      .filter(m => m.duration > thresholdMs)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Get failed operations
   */
  getFailedOperations(limit: number = 10): PerformanceMetrics[] {
    return this.performanceHistory
      .filter(m => !m.success)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.systemMetrics = {
      uptime: 0,
      totalRequests: 0,
      totalErrors: 0,
      averageResponseTime: 0,
      services: new Map(),
      lastUpdated: new Date()
    };
    this.performanceHistory = [];
    this.startTime = new Date();
    
    Logger.info('Health monitor metrics reset');
  }

  /**
   * Export metrics for external monitoring
   */
  exportMetrics(): object {
    return {
      system: this.getMetrics(),
      health: this.getSystemHealth(),
      performance: {
        overall: this.getPerformanceStats(),
        slow: this.getSlowOperations(),
        failed: this.getFailedOperations()
      }
    };
  }

  /**
   * Stop the health monitor and clean up resources
   */
  stop(): void {
    if (this.uptimeInterval) {
      clearInterval(this.uptimeInterval);
      this.uptimeInterval = null;
      Logger.debug('HealthMonitor stopped - uptime interval cleared');
    }
  }

  /**
   * Restart the health monitor
   */
  restart(): void {
    this.stop();
    this.uptimeInterval = setInterval(() => this.updateUptime(), 60000);
    Logger.debug('HealthMonitor restarted');
  }
}
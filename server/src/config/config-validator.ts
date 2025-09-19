import { ServerConfig } from './config-manager.js';

export class ConfigValidator {
  validate(config: ServerConfig): void {
    this.validateServer(config.server);
    this.validateAdapter(config.adapter);
    this.validateLogging(config.logging);
    this.validateSecurity(config.security);
    this.validatePerformance(config.performance);
    this.validateResilience(config.resilience);
  }
  
  private validateServer(server: ServerConfig['server']): void {
    if (!server) {
      throw new Error('Server configuration is required');
    }
    
    if (!server.name || typeof server.name !== 'string') {
      throw new Error('Server name is required and must be a string');
    }
    
    if (!server.version || typeof server.version !== 'string') {
      throw new Error('Server version is required and must be a string');
    }
    
    const validEnvironments = ['development', 'staging', 'production'];
    if (!validEnvironments.includes(server.environment)) {
      throw new Error(`Server environment must be one of: ${validEnvironments.join(', ')}`);
    }
    
    if (server.port !== undefined) {
      if (typeof server.port !== 'number' || server.port < 1 || server.port > 65535) {
        throw new Error('Server port must be a number between 1 and 65535');
      }
    }
    
    if (server.host !== undefined) {
      if (typeof server.host !== 'string') {
        throw new Error('Server host must be a string');
      }
    }
  }
  
  private validateAdapter(adapter: ServerConfig['adapter']): void {
    if (!adapter) {
      throw new Error('Adapter configuration is required');
    }
    
    if (!adapter.type || typeof adapter.type !== 'string') {
      throw new Error('Adapter type is required and must be a string');
    }
    
    // Validate based on adapter type
    if (adapter.type === 'built-in') {
      if (!adapter.name) {
        throw new Error('Built-in adapter requires a name');
      }
    } else if (adapter.type === 'npm') {
      if (!adapter.package) {
        throw new Error('NPM adapter requires a package name');
      }
    } else if (adapter.type === 'local') {
      if (!adapter.path) {
        throw new Error('Local adapter requires a path');
      }
    }
  }
  
  private validateLogging(logging: ServerConfig['logging']): void {
    if (!logging) {
      throw new Error('Logging configuration is required');
    }
    
    const validLevels = ['error', 'warn', 'info', 'debug'];
    if (!validLevels.includes(logging.level)) {
      throw new Error(`Logging level must be one of: ${validLevels.join(', ')}`);
    }
    
    if (!logging.dir || typeof logging.dir !== 'string') {
      throw new Error('Logging directory is required and must be a string');
    }
    
    if (logging.external) {
      if (typeof logging.external.enabled !== 'boolean') {
        throw new Error('External logging enabled must be a boolean');
      }
      
      if (logging.external.enabled) {
        if (!logging.external.service || typeof logging.external.service !== 'string') {
          throw new Error('External logging service is required when enabled');
        }
      }
    }
  }
  
  private validateSecurity(security: ServerConfig['security']): void {
    if (!security) {
      throw new Error('Security configuration is required');
    }
    
    // Validate sanitization
    if (!security.sanitization) {
      throw new Error('Sanitization configuration is required');
    }
    
    if (typeof security.sanitization.enabled !== 'boolean') {
      throw new Error('Sanitization enabled must be a boolean');
    }
    
    if (typeof security.sanitization.maxRequestSize !== 'number' || security.sanitization.maxRequestSize < 1) {
      throw new Error('Max request size must be a positive number');
    }
  }
  
  private validatePerformance(performance: ServerConfig['performance']): void {
    if (!performance) {
      throw new Error('Performance configuration is required');
    }
    
    // Validate monitoring
    if (!performance.monitoring) {
      throw new Error('Monitoring configuration is required');
    }
    
    if (typeof performance.monitoring.enabled !== 'boolean') {
      throw new Error('Monitoring enabled must be a boolean');
    }
    
    if (performance.monitoring.enabled) {
      if (typeof performance.monitoring.intervalMs !== 'number' || performance.monitoring.intervalMs < 1000) {
        throw new Error('Monitoring interval must be at least 1000ms');
      }
    }
    
    // Validate timeouts
    if (!performance.timeout) {
      throw new Error('Timeout configuration is required');
    }
    
    if (typeof performance.timeout.request !== 'number' || performance.timeout.request < 1) {
      throw new Error('Request timeout must be a positive number');
    }
    
    if (typeof performance.timeout.adapter !== 'number' || performance.timeout.adapter < 1) {
      throw new Error('Adapter timeout must be a positive number');
    }
    
    if (performance.timeout.adapter >= performance.timeout.request) {
      throw new Error('Adapter timeout must be less than request timeout');
    }
  }
  
  private validateResilience(resilience: ServerConfig['resilience']): void {
    if (!resilience) {
      throw new Error('Resilience configuration is required');
    }
    
    // Validate circuit breaker
    if (!resilience.circuitBreaker) {
      throw new Error('Circuit breaker configuration is required');
    }
    
    if (typeof resilience.circuitBreaker.enabled !== 'boolean') {
      throw new Error('Circuit breaker enabled must be a boolean');
    }
    
    if (resilience.circuitBreaker.enabled) {
      if (typeof resilience.circuitBreaker.failureThreshold !== 'number' || resilience.circuitBreaker.failureThreshold < 1) {
        throw new Error('Circuit breaker failure threshold must be a positive number');
      }
      
      if (typeof resilience.circuitBreaker.resetTimeout !== 'number' || resilience.circuitBreaker.resetTimeout < 1000) {
        throw new Error('Circuit breaker reset timeout must be at least 1000ms');
      }
    }
    
    // Validate retry
    if (!resilience.retry) {
      throw new Error('Retry configuration is required');
    }
    
    if (typeof resilience.retry.enabled !== 'boolean') {
      throw new Error('Retry enabled must be a boolean');
    }
    
    if (resilience.retry.enabled) {
      if (typeof resilience.retry.maxAttempts !== 'number' || resilience.retry.maxAttempts < 1) {
        throw new Error('Retry max attempts must be a positive number');
      }
      
      if (typeof resilience.retry.initialDelay !== 'number' || resilience.retry.initialDelay < 0) {
        throw new Error('Retry initial delay must be non-negative');
      }
    }
  }
}
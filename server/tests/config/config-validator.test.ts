import { ConfigValidator } from '../../src/config/config-validator';
import { ServerConfig } from '../../src/config/config-manager';

describe('ConfigValidator', () => {
  let validator: ConfigValidator;
  let validConfig: ServerConfig;
  
  beforeEach(() => {
    validator = new ConfigValidator();
    
    validConfig = {
      server: {
        name: 'test-server',
        version: '1.0.0',
        environment: 'development',
        port: 3000,
        host: 'localhost'
      },
      adapter: {
        type: 'built-in' as const,
        name: 'mock',
        options: {}
      },
      logging: {
        level: 'info',
        dir: 'logs',
        external: {
          enabled: false,
          service: 'datadog'
        }
      },
      security: {
        sanitization: {
          enabled: true,
          maxRequestSize: 1048576
        }
      },
      performance: {
        monitoring: {
          enabled: true,
          intervalMs: 30000
        },
        timeout: {
          request: 30000,
          adapter: 25000
        }
      },
      resilience: {
        circuitBreaker: {
          enabled: true,
          failureThreshold: 5,
          resetTimeout: 60000
        },
        retry: {
          enabled: true,
          maxAttempts: 3,
          initialDelay: 1000
        }
      },
      features: {}
    };
  });
  
  describe('validate', () => {
    it('should validate valid configuration', () => {
      expect(() => validator.validate(validConfig)).not.toThrow();
    });
    
    describe('server validation', () => {
      it('should require server configuration', () => {
        delete (validConfig as any).server;
        expect(() => validator.validate(validConfig)).toThrow('Server configuration is required');
      });
      
      it('should require server name', () => {
        (validConfig.server as any).name = undefined;
        expect(() => validator.validate(validConfig)).toThrow('Server name is required');
      });
      
      it('should require valid environment', () => {
        (validConfig.server as any).environment = 'invalid';
        expect(() => validator.validate(validConfig)).toThrow('Server environment must be one of');
      });
      
      it('should validate port range', () => {
        validConfig.server.port = 70000;
        expect(() => validator.validate(validConfig)).toThrow('Server port must be a number between 1 and 65535');
      });
    });
    
    describe('adapter validation', () => {
      it('should require adapter configuration', () => {
        delete (validConfig as any).adapter;
        expect(() => validator.validate(validConfig)).toThrow('Adapter configuration is required');
      });
      
      it('should require adapter type', () => {
        (validConfig.adapter as any).type = undefined;
        expect(() => validator.validate(validConfig)).toThrow('Adapter type is required');
      });
      
      it('should require adapter name for built-in type', () => {
        (validConfig.adapter as any).name = undefined;
        expect(() => validator.validate(validConfig)).toThrow('Built-in adapter requires a name');
      });
    });
    
    describe('logging validation', () => {
      it('should require logging configuration', () => {
        delete (validConfig as any).logging;
        expect(() => validator.validate(validConfig)).toThrow('Logging configuration is required');
      });
      
      it('should require valid log level', () => {
        (validConfig.logging as any).level = 'invalid';
        expect(() => validator.validate(validConfig)).toThrow('Logging level must be one of');
      });
      
      it('should require logging directory', () => {
        (validConfig.logging as any).dir = undefined;
        expect(() => validator.validate(validConfig)).toThrow('Logging directory is required');
      });
      
      it('should validate external logging when enabled', () => {
        validConfig.logging.external = {
          enabled: true,
          service: '',
          apiKey: 'key'
        };
        expect(() => validator.validate(validConfig)).toThrow('External logging service is required');
      });
    });
    
    describe('security validation', () => {
      it('should require security configuration', () => {
        delete (validConfig as any).security;
        expect(() => validator.validate(validConfig)).toThrow('Security configuration is required');
      });
      
      it('should validate sanitization max request size', () => {
        validConfig.security.sanitization.maxRequestSize = -1;
        expect(() => validator.validate(validConfig)).toThrow('Max request size must be a positive number');
      });
    });
    
    describe('performance validation', () => {
      it('should require performance configuration', () => {
        delete (validConfig as any).performance;
        expect(() => validator.validate(validConfig)).toThrow('Performance configuration is required');
      });
      
      it('should validate monitoring interval', () => {
        validConfig.performance.monitoring.intervalMs = 500;
        expect(() => validator.validate(validConfig)).toThrow('Monitoring interval must be at least 1000ms');
      });
      
      it('should validate request timeout', () => {
        validConfig.performance.timeout.request = 0;
        expect(() => validator.validate(validConfig)).toThrow('Request timeout must be a positive number');
      });
      
      it('should ensure adapter timeout is less than request timeout', () => {
        validConfig.performance.timeout.adapter = 35000;
        validConfig.performance.timeout.request = 30000;
        expect(() => validator.validate(validConfig)).toThrow('Adapter timeout must be less than request timeout');
      });
    });
    
    describe('resilience validation', () => {
      it('should require resilience configuration', () => {
        delete (validConfig as any).resilience;
        expect(() => validator.validate(validConfig)).toThrow('Resilience configuration is required');
      });
      
      it('should validate circuit breaker failure threshold', () => {
        validConfig.resilience.circuitBreaker.failureThreshold = 0;
        expect(() => validator.validate(validConfig)).toThrow('Circuit breaker failure threshold must be a positive number');
      });
      
      it('should validate circuit breaker reset timeout', () => {
        validConfig.resilience.circuitBreaker.resetTimeout = 500;
        expect(() => validator.validate(validConfig)).toThrow('Circuit breaker reset timeout must be at least 1000ms');
      });
      
      it('should validate retry max attempts', () => {
        validConfig.resilience.retry.maxAttempts = 0;
        expect(() => validator.validate(validConfig)).toThrow('Retry max attempts must be a positive number');
      });
      
      it('should validate retry initial delay', () => {
        validConfig.resilience.retry.initialDelay = -1;
        expect(() => validator.validate(validConfig)).toThrow('Retry initial delay must be non-negative');
      });
    });
  });
});
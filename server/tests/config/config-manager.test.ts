import { ConfigManager } from '../../src/config/config-manager';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { Mocked, MockedClass, Mock } from 'vitest';
import { ConfigLoader } from '../../src/config/config-loader';
import { ConfigValidator } from '../../src/config/config-validator';
import { EnvironmentConfig } from '../../src/config/environment';

vi.mock('../../src/utils/logger');
vi.mock('../../src/config/config-loader');
vi.mock('../../src/config/config-validator');
vi.mock('../../src/config/environment');

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  let mockLoader: Mocked<ConfigLoader>;
  let mockValidator: Mocked<ConfigValidator>;

  const mockConfig = {
    server: {
      description: 'Test server',
      name: 'test-server',
      version: '1.0.0',
      environment: 'development' as const,
      port: 3000,
    },
    adapter: {
      type: 'built-in' as const,
      name: 'mock',
      options: {},
    },
    logging: {
      level: 'info' as const,
      dir: 'logs',
    },
    security: {
      authentication: {
        enabled: false,
        type: 'none' as const,
      },
      rateLimiting: {
        enabled: true,
        windowMs: 60000,
        maxRequests: 100,
      },
      sanitization: {
        enabled: true,
        maxRequestSize: 1048576,
      },
    },
    performance: {
      monitoring: {
        enabled: true,
        intervalMs: 30000,
      },
      timeout: {
        request: 30000,
        adapter: 25000,
      },
    },
    resilience: {
      circuitBreaker: {
        enabled: true,
        failureThreshold: 5,
        resetTimeout: 60000,
      },
      retry: {
        enabled: true,
        maxAttempts: 3,
        initialDelay: 1000,
      },
    },
    features: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset singleton
    (ConfigManager as any).instance = undefined;

    // Mock ConfigLoader
    mockLoader = {
      loadDefaults: vi.fn().mockReturnValue(mockConfig),
      loadFromFile: vi.fn().mockReturnValue({}),
    } as any;
    (ConfigLoader as MockedClass<typeof ConfigLoader>).mockImplementation(() => mockLoader);

    // Mock ConfigValidator
    mockValidator = {
      validate: vi.fn(),
    } as any;
    (ConfigValidator as MockedClass<typeof ConfigValidator>).mockImplementation(() => mockValidator);

    // Mock EnvironmentConfig
    (EnvironmentConfig.load as Mock).mockReturnValue({});

    configManager = ConfigManager.getInstance();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = ConfigManager.getInstance();
      const instance2 = ConfigManager.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('get', () => {
    it('should get configuration value by path', () => {
      const value = configManager.get('server.name');
      expect(value).toBe('test-server');
    });

    it('should get nested configuration value', () => {
      const value = configManager.get('security.rateLimiting.maxRequests');
      expect(value).toBe(100);
    });

    it('should throw error for non-existent path', () => {
      expect(() => configManager.get('non.existent.path')).toThrow('Configuration key not found');
    });
  });

  describe('getOrDefault', () => {
    it('should return value if exists', () => {
      const value = configManager.getOrDefault('server.name', 'default');
      expect(value).toBe('test-server');
    });

    it('should return default if not exists', () => {
      const value = configManager.getOrDefault('non.existent', 'default');
      expect(value).toBe('default');
    });
  });

  describe('set', () => {
    it('should set configuration value', () => {
      configManager.set('server.port', 4000);
      const value = configManager.get('server.port');
      expect(value).toBe(4000);
    });

    it('should create nested path if not exists', () => {
      configManager.set('new.nested.value', 'test');
      const value = configManager.get('new.nested.value');
      expect(value).toBe('test');
    });

    it('should emit change event', async () => {
      const changePromise = new Promise((resolve) => {
        configManager.on('change', (event) => {
          expect(event.path).toBe('server.port');
          expect(event.oldValue).toBe(3000);
          expect(event.newValue).toBe(5000);
          resolve(undefined);
        });
      });

      configManager.set('server.port', 5000);
      await changePromise;
    });
  });

  describe('getAll', () => {
    it('should return deep copy of configuration', () => {
      const config = configManager.getAll();
      config.server.name = 'modified';

      const original = configManager.get('server.name');
      expect(original).toBe('test-server');
    });
  });

  describe('reload', () => {
    it('should reload configuration', () => {
      const newConfig = { ...mockConfig, server: { ...mockConfig.server, description: 'Test server', port: 5000 } };
      mockLoader.loadDefaults.mockReturnValue(newConfig);

      configManager.reload();

      const port = configManager.get('server.port');
      expect(port).toBe(5000);
    });

    it('should emit reload event', async () => {
      const reloadPromise = new Promise((resolve) => {
        configManager.on('reload', (config) => {
          expect(config.server.name).toBe('test-server');
          resolve(undefined);
        });
      });

      configManager.reload();
      await reloadPromise;
    });

    it('should detect critical changes', async () => {
      const newConfig = {
        ...mockConfig,
        adapter: { type: 'npm' as const, name: 'different', config: {} },
      };
      mockLoader.loadDefaults.mockReturnValue(newConfig);

      const changePromise = new Promise((resolve) => {
        configManager.on('critical-change', (changes) => {
          expect(changes).toContain('adapter.type');
          resolve(undefined);
        });
      });

      configManager.reload();
      await changePromise;
    });
  });

  describe('Feature Flags', () => {
    it('should check if feature is enabled', () => {
      expect(configManager.isFeatureEnabled('test')).toBe(false);
    });

    it('should enable feature', () => {
      configManager.enableFeature('test');
      expect(configManager.isFeatureEnabled('test')).toBe(true);
    });

    it('should disable feature', () => {
      configManager.enableFeature('test');
      configManager.disableFeature('test');
      expect(configManager.isFeatureEnabled('test')).toBe(false);
    });

    it('should emit feature-change event', async () => {
      const featurePromise = new Promise((resolve) => {
        configManager.on('feature-change', (event) => {
          expect(event.feature).toBe('test');
          expect(event.enabled).toBe(true);
          resolve(undefined);
        });
      });

      configManager.enableFeature('test');
      await featurePromise;
    });
  });

  describe('Security Policies', () => {
    it('should enforce production security policies', () => {
      const prodConfig = {
        ...mockConfig,
        server: { ...mockConfig.server, environment: 'production' as const },
        logging: { ...mockConfig.logging, level: 'debug' as const },
      };

      mockLoader.loadDefaults.mockReturnValue(prodConfig);

      // Create new instance with production config
      (ConfigManager as any).instance = undefined;
      const prodManager = ConfigManager.getInstance();

      // Security should be enforced
      expect(prodManager.get('security.sanitization.enabled')).toBe(true);
      expect(prodManager.get('logging.level')).toBe('info');
    });
  });
});

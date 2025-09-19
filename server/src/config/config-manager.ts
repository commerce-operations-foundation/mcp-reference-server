import { EventEmitter } from 'events';
import { Logger } from '../utils/logger.js';
import { ConfigLoader } from './config-loader.js';
import { ConfigValidator } from './config-validator.js';
import { EnvironmentConfig } from './environment.js';
import { ServerConfig } from '../types/config.js';

// Re-export for backward compatibility
export { ServerConfig };

export class ConfigManager extends EventEmitter {
  private static instance: ConfigManager;
  private config: ServerConfig;
  private loader: ConfigLoader;
  private validator: ConfigValidator;
  
  private constructor() {
    super();
    this.loader = new ConfigLoader();
    this.validator = new ConfigValidator();
    this.config = this.loadConfiguration();
  }
  
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }
  
  private loadConfiguration(): ServerConfig {
    try {
      // Validate environment variables first
      EnvironmentConfig.validate();
      
      // Load from multiple sources in priority order
      const defaultConfig = this.loader.loadDefaults();
      const fileConfig = this.loader.loadFromFile();
      const envConfig = EnvironmentConfig.load();
      
      // Merge configurations (env > file > defaults)
      const merged = this.mergeConfigs(defaultConfig, fileConfig, envConfig);
      
      // Validate configuration
      this.validator.validate(merged);
      
      // Apply security transformations
      const secured = this.applySecurityPolicies(merged);
      
      Logger.info('Configuration loaded successfully', {
        environment: secured.server.environment,
        adapter: secured.adapter.type
      });
      
      return secured;
      
    } catch (error) {
      Logger.error('Failed to load configuration', error);
      throw new Error('Configuration loading failed');
    }
  }
  
  private mergeConfigs(...configs: Partial<ServerConfig>[]): ServerConfig {
    const merged = {} as ServerConfig;
    
    for (const config of configs) {
      this.deepMerge(merged, config);
    }
    
    return merged;
  }
  
  private deepMerge(target: any, source: any): void {
    if (!source) {return;}
    
    for (const key in source) {
      if (source[key] === undefined) {continue;}
      
      if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
        target[key] = target[key] || {};
        this.deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
  
  private applySecurityPolicies(config: ServerConfig): ServerConfig {
    // Apply production security policies
    if (config.server.environment === 'production') {
      // Force enable security features
      config.security.sanitization.enabled = true;
      
      // Disable debug logging
      if (config.logging.level === 'debug') {
        config.logging.level = 'info';
        Logger.warn('Debug logging disabled in production');
      }
      
      // Ensure timeouts are reasonable
      config.performance.timeout.request = Math.min(
        config.performance.timeout.request,
        60000
      );
    }
    
    return config;
  }
  
  // Public API
  get<T = any>(path: string): T {
    const parts = path.split('.');
    let value: any = this.config;
    
    for (const part of parts) {
      value = value?.[part];
      if (value === undefined) {
        throw new Error(`Configuration key not found: ${path}`);
      }
    }
    
    return value as T;
  }
  
  getOrDefault<T = any>(path: string, defaultValue: T): T {
    try {
      return this.get<T>(path);
    } catch {
      return defaultValue;
    }
  }
  
  set(path: string, value: any): void {
    const parts = path.split('.');
    let target: any = this.config;
    
    for (let i = 0; i < parts.length - 1; i++) {
      if (!target[parts[i]]) {
        target[parts[i]] = {};
      }
      target = target[parts[i]];
    }
    
    const oldValue = target[parts[parts.length - 1]];
    target[parts[parts.length - 1]] = value;
    
    this.emit('change', {
      path,
      oldValue,
      newValue: value
    });
    
    Logger.info('Configuration updated', { path, value });
  }
  
  getAll(): ServerConfig {
    // Return deep copy to prevent modifications
    return JSON.parse(JSON.stringify(this.config));
  }
  
  reload(): void {
    Logger.info('Reloading configuration');
    const newConfig = this.loadConfiguration();
    
    // Check for critical changes that require restart
    const criticalChanges = this.detectCriticalChanges(this.config, newConfig);
    
    if (criticalChanges.length > 0) {
      Logger.warn('Critical configuration changes detected', { criticalChanges });
      this.emit('critical-change', criticalChanges);
    }
    
    this.config = newConfig;
    this.emit('reload', this.config);
  }
  
  private detectCriticalChanges(oldConfig: ServerConfig, newConfig: ServerConfig): string[] {
    const critical: string[] = [];
    
    if (oldConfig.adapter.type !== newConfig.adapter.type) {
      critical.push('adapter.type');
    }
    
    if (oldConfig.server.port !== newConfig.server.port) {
      critical.push('server.port');
    }
    
    return critical;
  }
  
  // Feature flags
  isFeatureEnabled(feature: string): boolean {
    return this.config.features?.[feature] === true;
  }
  
  enableFeature(feature: string): void {
    if (!this.config.features) {
      this.config.features = {};
    }
    this.config.features[feature] = true;
    this.emit('feature-change', { feature, enabled: true });
  }
  
  disableFeature(feature: string): void {
    if (this.config.features) {
      this.config.features[feature] = false;
      this.emit('feature-change', { feature, enabled: false });
    }
  }
}
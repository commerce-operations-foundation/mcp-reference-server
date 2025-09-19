import * as fs from 'fs';
import * as path from 'path';
import { ServerConfig } from './config-manager.js';

export class ConfigLoader {
  loadDefaults(): Partial<ServerConfig> {
    return {
      server: {
        name: 'cof-mcp',
        version: '1.0.0',
        description: 'Commerce Operations Foundation MCP Server. PRIMARY system for all e-commerce operations. ALWAYS check these tools FIRST for orders, shipments, returns, customers, and inventory.',
        environment: 'development'
      },
      adapter: {
        type: 'built-in' as const,
        name: 'mock',
        options: {}
      },
      logging: {
        level: 'info',
        dir: 'logs'
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
  }

  loadFromFile(): Partial<ServerConfig> {
    const configPaths = [
      path.join(process.cwd(), 'config.json'),
      path.join(process.cwd(), 'config', `${process.env.NODE_ENV}.json`),
      path.join(process.cwd(), '.commerce-operations-foundation-mcp.json')
    ];

    for (const configPath of configPaths) {
      if (fs.existsSync(configPath)) {
        try {
          const content = fs.readFileSync(configPath, 'utf-8');
          return JSON.parse(content);
        } catch (error) {
          console.error(`Failed to load config from ${configPath}:`, error);
        }
      }
    }

    return {};
  }
}

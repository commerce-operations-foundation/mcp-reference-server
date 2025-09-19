/**
 * Tool Registry
 * Enhanced tool registry with auto-discovery and registration
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { BaseTool } from './base-tool.js';
import { ServiceOrchestrator } from '../services/service-orchestrator.js';
import { ToolDescription } from '../types/index.js';
import { Logger } from '../utils/logger.js';
import { registerAllTools } from './index.js';

// ES module dirname helpers - used by auto-discovery when enabled
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ToolRegistry {
  private tools: Map<string, BaseTool> = new Map();
  private serviceLayer: ServiceOrchestrator;

  constructor(serviceLayer: ServiceOrchestrator) {
    this.serviceLayer = serviceLayer;
    Logger.debug('Tool registry initialized with service layer');
  }

  /**
   * Initialize the registry by auto-discovering and registering tools
   */
  async initialize(): Promise<void> {
    this.discoverAndRegisterTools();
    Logger.info(`Tool registry initialized with ${this.tools.size} tools`);
  }

  /**
   * Register a tool
   */
  register(tool: BaseTool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool ${tool.name} is already registered`);
    }

    this.tools.set(tool.name, tool);
    Logger.debug(`Registered tool: ${tool.name}`);
  }

  /**
   * Execute a tool by name
   */
  async execute(name: string, params: any): Promise<any> {
    const tool = this.tools.get(name);

    if (!tool) {
      // This should never happen if server checks first, but keep for safety
      throw new Error(`Tool not found: ${name}`);
    }

    Logger.debug(`Executing tool: ${name}`);

    try {
      // Validate input
      const validatedInput = await tool.validateInput(params);

      // Execute tool and return raw result
      // MCP server handles response wrapping automatically
      const result = await tool.execute(validatedInput);

      Logger.debug(`Tool ${name} executed successfully`);
      return result;

    } catch (error) {
      Logger.error(`Tool ${name} execution failed:`, error);
      throw error;
    }
  }

  /**
   * List all available tools
   */
  list(): ToolDescription[] {
    return Array.from(this.tools.values()).map(tool => {
      const desc = tool.getDescription();
      // Ensure inputSchema has type: "object" for SDK compatibility
      return {
        name: desc.name,
        description: desc.description,
        inputSchema: {
          ...desc.inputSchema,
          type: 'object' as const
        }
      };
    });
  }

  /**
   * Check if a tool exists
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Get a tool by name
   */
  get(name: string): BaseTool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all tool names
   */
  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Get the service orchestrator instance
   */
  getServiceOrchestrator(): ServiceOrchestrator {
    return this.serviceLayer;
  }

  /**
   * Auto-discover and register all tools from the tools directory
   */
  private discoverAndRegisterTools(): void {
    // Register all tools using the centralized registration functions
    registerAllTools(this, this.serviceLayer);

    // Auto-discovery capability preserved for future use
    // To enable auto-discovery, uncomment the lines below:
    // const toolsDir = path.join(__dirname);
    // Logger.debug(`Scanning for tools in: ${toolsDir}`);
    // this.scanDirectory(toolsDir);
    void __dirname; // Preserve for auto-discovery
  }


  /**
   * Recursively scan directory for tool files
   * @deprecated Currently unused - for future dynamic tool loading
   */
  // @ts-ignore - Preserved for future use
  private async scanDirectory(dir: string): Promise<void> {
    try {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory() && entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
          await this.scanDirectory(fullPath);
        } else if (entry.isFile() &&
          (entry.name.endsWith('.ts') || entry.name.endsWith('.js')) &&
          !entry.name.endsWith('.test.ts') &&
          !entry.name.endsWith('.spec.ts') &&
          !entry.name.endsWith('.test.js') &&
          !entry.name.endsWith('.spec.js') &&
          !entry.name.endsWith('.d.ts')) {
          await this.loadToolFromFile(fullPath);
        }
      }
    } catch (error) {
      Logger.warn(`Failed to scan directory ${dir}:`, error);
    }
  }

  /**
   * Load tool from file if it's a valid tool class
   */
  private async loadToolFromFile(filePath: string): Promise<void> {
    try {
      // Skip the registry file itself and base-tool file
      if (filePath.endsWith('registry.ts') ||
        filePath.endsWith('base-tool.ts') ||
        filePath.endsWith('registry.js') ||
        filePath.endsWith('base-tool.js')) {
        return;
      }

      Logger.debug(`Attempting to load tool from: ${filePath}`);
      const module = await import(filePath);

      // Look for exported classes that extend BaseTool
      for (const exportKey of Object.keys(module)) {
        const exported = module[exportKey];

        if (this.isToolClass(exported)) {
          try {
            const toolInstance = new exported(this.serviceLayer);
            this.register(toolInstance);
            Logger.debug(`Auto-registered tool from ${filePath}: ${toolInstance.name}`);
          } catch (error) {
            Logger.warn(`Failed to instantiate tool from ${filePath}:`, error);
          }
        }
      }
    } catch (error) {
      Logger.debug(`Failed to load tool from ${filePath}:`, error);
    }
  }

  /**
   * Check if exported item is a tool class
   */
  private isToolClass(exported: any): boolean {
    if (typeof exported !== 'function') {
      return false;
    }

    try {
      // Check if it has the BaseTool prototype structure
      const instance = Object.create(exported.prototype);
      return (
        'name' in instance &&
        'description' in instance &&
        'inputSchema' in instance &&
        'execute' in instance
      );
    } catch {
      return false;
    }
  }

  /**
   * Reload all tools (useful for development/hot-reloading)
   */
  reload(): void {
    this.tools.clear();
    this.discoverAndRegisterTools();
    Logger.info(`Tool registry reloaded with ${this.tools.size} tools`);
  }

  /**
   * Get tools grouped by category
   */
  getToolsByCategory(): Record<string, ToolDescription[]> {
    const categories: Record<string, ToolDescription[]> = {
      'Fulfillment Management': [],
      'Query Operations': [],
      'Inventory Operations': [],
      'Other': []
    };

    for (const tool of this.tools.values()) {
      const description = tool.getDescription();
      const toolName = tool.name;

      // Ensure inputSchema has type: "object" for SDK compatibility
      const formattedDescription = {
        ...description,
        inputSchema: {
          ...description.inputSchema,
          type: 'object' as const
        }
      };

      if (toolName.includes('order') || toolName.includes('return') || toolName.includes('exchange') || toolName.includes('ship')) {
        categories['Fulfillment Management'].push(formattedDescription);
      } else if (toolName.startsWith('get-')) {
        categories['Query Operations'].push(formattedDescription);
      } else if (toolName.includes('inventory') || toolName.includes('reserve')) {
        categories['Inventory Operations'].push(formattedDescription);
      } else {
        categories['Other'].push(formattedDescription);
      }
    }

    // Remove empty categories
    Object.keys(categories).forEach(key => {
      if (categories[key].length === 0) {
        delete categories[key];
      }
    });

    return categories;
  }
}

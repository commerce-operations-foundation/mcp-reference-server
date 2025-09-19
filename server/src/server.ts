/**
 * MCP Server using SDK components
 * This is the recommended approach for MCP servers
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  PingRequestSchema,
  McpError,
  ErrorCode
} from '@modelcontextprotocol/sdk/types.js';
import { ToolRegistry } from './tools/registry.js';
import { ServiceOrchestrator } from './services/service-orchestrator.js';
import { ServerConfig } from './types/index.js';
import { Logger } from './utils/logger.js';
import { ErrorAdapter, createSuccessResponse } from './errors/error-adapter.js';

export class MCPServerSDK {
  private server: Server;
  private serviceOrchestrator: ServiceOrchestrator;
  private toolRegistry: ToolRegistry;
  private config: ServerConfig;

  constructor(config: ServerConfig) {
    this.config = config;

    // Create MCP SDK server
    this.server = new Server(
      {
        name: config.server.name,
        version: config.server.version,
        description: config.server.description,
      },
      {
        capabilities: {
          tools: {},
          prompts: {},
          resources: {},
        },
      }
    );

    this.serviceOrchestrator = new ServiceOrchestrator();
    this.toolRegistry = new ToolRegistry(this.serviceOrchestrator);

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // Handle tools/list requests
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      Logger.debug('Handling tools/list request');
      const tools = this.toolRegistry.list();
      return { tools };
    });

    // Handle tools/call requests with improved response wrapping
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      Logger.debug(`Handling tools/call request for: ${request.params.name}`);
      const { name, arguments: args } = request.params;

      // Check if tool exists - this is a Protocol Error
      if (!this.toolRegistry.has(name)) {
        Logger.error(`Unknown tool requested: ${name}`);
        // Use proper MCP error for method not found
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`, { name });
      }

      try {
        const result = await this.toolRegistry.execute(name, args || {});
        return createSuccessResponse(result);
      } catch (error) {
        Logger.debug(`Processing error for tool ${name}:`, error);

        // Use error adapter to determine how to handle the error
        const processed = ErrorAdapter.processError(error as Error);

        if (processed.shouldThrow && processed.mcpError) {
          // Protocol errors should be thrown to let MCP SDK handle them
          Logger.error(`Protocol error for tool ${name}:`, error);
          throw processed.mcpError;
        } else if (processed.toolResponse) {
          // Tool execution errors should be returned as error responses
          Logger.error(`Tool execution failed: ${name}`, error);
          return processed.toolResponse;
        } else {
          // Fallback case
          Logger.error(`Unexpected error handling for tool ${name}:`, error);
          throw error;
        }
      }
    });

    // Handle ping requests
    this.server.setRequestHandler(PingRequestSchema, async () => {
      Logger.debug('Handling ping request');
      return {};
    });

    // Handle prompts/list requests - return empty list since we don't support prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      Logger.debug('Handling prompts/list request');
      return { prompts: [] };
    });

    // Handle resources/list requests - return empty list since we don't support resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      Logger.debug('Handling resources/list request');
      return { resources: [] };
    });

    // Handle any other custom requests if needed
    this.server.onerror = (error) => {
      Logger.error('Server error:', error);
    };
  }

  async start(): Promise<void> {
    Logger.info('Starting MCP server with SDK transport...');

    // Initialize services with adapter config from server config
    await this.serviceOrchestrator.initialize(this.config.adapter);

    // Register all tools
    await this.registerTools();

    // Create and connect transport
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    Logger.info('MCP server running on stdio transport');
  }

  private async registerTools(): Promise<void> {
    Logger.debug('Registering Fulfillment tools...');

    // Initialize the tool registry to auto-discover and register all tools
    await this.toolRegistry.initialize();

    const tools = this.toolRegistry.list();
    Logger.info(`Registered ${tools.length} tools`);
  }

  async stop(): Promise<void> {
    Logger.info('Stopping MCP server...');

    // Cleanup service orchestrator first
    await this.serviceOrchestrator.cleanup();

    // Disconnect the MCP server properly
    if (this.server) {
      await this.server.close();
    }

    Logger.info('MCP server stopped successfully');
  }
}

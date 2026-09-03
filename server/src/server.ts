import {
  Server,
  ProtocolError,
  ProtocolErrorCode,
  type McpServerFactory,
} from '@modelcontextprotocol/server';
import { serveStdio, type StdioServerHandle } from '@modelcontextprotocol/server/stdio';
import { ToolRegistry } from './tools/registry.js';
import { ServiceOrchestrator } from './services/service-orchestrator.js';
import { AdapterConfig, ServerConfig } from './types/index.js';
import { Logger } from './utils/logger.js';
import { ErrorAdapter, createSuccessResponse } from './errors/error-adapter.js';

export interface OnxMcpRuntime {
  orchestrator: ServiceOrchestrator;
  toolRegistry: ToolRegistry;
  factory: McpServerFactory;
  close(): Promise<void>;
}

/** Build one transport-neutral MCP server around the shared onX registry. */
export function buildOnxMcpServer(config: ServerConfig, toolRegistry: ToolRegistry): Server {
  const server = new Server(
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

  server.setRequestHandler('tools/list', async () => {
    Logger.debug('Handling tools/list request');
    return { tools: toolRegistry.list() };
  });

  server.setRequestHandler('tools/call', async (request) => {
    const { name, arguments: args } = request.params;
    Logger.debug(`Handling tools/call request for: ${name}`);

    if (!toolRegistry.has(name)) {
      Logger.error(`Unknown tool requested: ${name}`);
      throw new ProtocolError(ProtocolErrorCode.MethodNotFound, `Unknown tool: ${name}`, { name });
    }

    try {
      const result = await toolRegistry.execute(name, args || {});
      return createSuccessResponse(result);
    } catch (error) {
      Logger.debug(`Processing error for tool ${name}:`, error);
      const processed = ErrorAdapter.processError(error as Error);

      if (processed.shouldThrow && processed.mcpError) {
        Logger.error(`Protocol error for tool ${name}:`, error);
        throw processed.mcpError;
      }
      if (processed.toolResponse) {
        Logger.error(`Tool execution failed: ${name}`, error);
        return processed.toolResponse;
      }

      Logger.error(`Unexpected error handling for tool ${name}:`, error);
      throw error;
    }
  });

  server.setRequestHandler('ping', async () => ({}));
  server.setRequestHandler('prompts/list', async () => ({ prompts: [] }));
  server.setRequestHandler('resources/list', async () => ({ resources: [] }));
  server.onerror = (error) => Logger.error('Server error:', error);

  return server;
}

/** Initialize the shared onX business runtime used by every MCP instance. */
export async function createOnxMcpRuntime(
  config: ServerConfig,
  adapterConfig: AdapterConfig = config.adapter
): Promise<OnxMcpRuntime> {
  const orchestrator = new ServiceOrchestrator();
  await orchestrator.initialize(adapterConfig);

  const toolRegistry = new ToolRegistry(orchestrator);
  await toolRegistry.initialize();
  Logger.info(`Registered ${toolRegistry.list().length} tools`);

  return {
    orchestrator,
    toolRegistry,
    factory: () => buildOnxMcpServer(config, toolRegistry),
    close: () => orchestrator.cleanup(),
  };
}

/** Backward-compatible lifecycle wrapper, now using SDK v2 serveStdio. */
export class MCPServerSDK {
  private runtime?: OnxMcpRuntime;
  private stdioHandle?: StdioServerHandle;

  constructor(private readonly config: ServerConfig) {}

  async start(): Promise<void> {
    Logger.info('Starting MCP server with SDK v2 stdio serving...');
    this.runtime = await createOnxMcpRuntime(this.config);
    this.stdioHandle = serveStdio(this.runtime.factory, {
      legacy: 'serve',
      onerror: (error) => Logger.error('Server error:', error),
    });
    Logger.info('MCP server running on stdio transport');
  }

  async stop(): Promise<void> {
    Logger.info('Stopping MCP server...');
    await this.stdioHandle?.close();
    await this.runtime?.close();
    Logger.info('MCP server stopped successfully');
  }
}

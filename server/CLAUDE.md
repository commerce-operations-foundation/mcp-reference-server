# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server for fulfillment/commerce operations. It provides a standardized interface between AI assistants and fulfillment systems through a pluggable adapter architecture.

## Development Commands

### Build and Development
```bash
npm run build          # Compile TypeScript to dist/
npm run dev            # Run with hot reload (vite-node)
npm start              # Run production build
npm run typecheck      # Type checking without emission
npm run clean          # Remove dist/ directory
```

### Testing
```bash
npm test               # Build + run all tests
npm run test:unit      # Unit tests only
npm run test:integration  # Integration tests only
npm run test:watch     # Watch mode
npm run test:ui        # Vitest UI interface
npm run test:coverage  # Coverage report
```

### Code Quality
```bash
npm run lint           # ESLint check
npm run format         # Format with Prettier
```

### Running Single Tests
```bash
# Run specific test file
npx vitest tests/unit/adapters/adapter-factory.test.ts

# Run tests matching pattern
npx vitest tests/unit --grep "AdapterFactory"
```

## Architecture

### Three-Layer Architecture

1. **Protocol Layer** (`src/server.ts`, `src/index.ts`)
   - MCP SDK integration using stdio transport
   - Request/response handling (tools/list, tools/call, ping)
   - Error transformation (protocol errors vs tool errors)

2. **Service Layer** (`src/services/`)
   - `ServiceOrchestrator`: Main facade coordinating all operations
   - `OrderService`: Order lifecycle operations
   - `InventoryService`: Inventory management
   - `QueryService`: Data retrieval operations
   - `AdapterManager`: Adapter lifecycle management
   - `HealthMonitor`: System health and metrics
   - `ErrorHandler`: Error processing and standardization
   - `Transformer`: Data transformation between layers
   - `Validator`: JSON Schema validation

3. **Adapter Layer** (`src/adapters/`)
   - `AdapterFactory`: Creates and caches adapter instances
   - `IFulfillmentAdapter`: Interface all adapters implement
   - Built-in adapters (e.g., `MockAdapter`)
   - Dynamic loading: supports built-in, NPM packages, and local files

### Tool System

Tools are defined in `src/tools/` and automatically registered:
- **Actions**: `capture-order`, `cancel-order`, `update-order`, `return-order`, `exchange-order`, `ship-order`
- **Management**: `hold-order`, `split-order`, `reserve-inventory`
- **Queries**: `get-order`, `get-inventory`, `get-product`, `get-customer`, `get-shipment`, `get-buyer`

All tools extend `BaseTool` which provides:
- JSON Schema validation via `inputSchema`
- `execute()` method for implementation
- Access to `ServiceOrchestrator` via `serviceLayer`

Tool registration is automatic via `ToolRegistry.initialize()` which discovers all tool files.

### Configuration System

Configuration is loaded and merged in priority order:
1. Environment variables (highest priority)
2. Configuration file (if present)
3. Default values (lowest priority)

Key configuration paths:
- `src/config/config-manager.ts`: Singleton manager with event emitters
- `src/config/config-loader.ts`: Multi-source loading
- `src/config/environment.ts`: Environment variable parsing
- `src/config/config-validator.ts`: Schema validation

Environment variables (see `.env.example`):
- `ADAPTER_TYPE`: built-in | npm | local
- `ADAPTER_NAME`: For built-in adapters (e.g., "mock")
- `ADAPTER_PACKAGE`: NPM package name
- `ADAPTER_PATH`: Local file path
- `LOG_LEVEL`: debug | info | warn | error

### Error Handling

Two distinct error types:
1. **Protocol Errors**: Thrown as `McpError` (e.g., MethodNotFound, InvalidRequest)
2. **Tool Execution Errors**: Returned as error responses with `isError: true`

Error processing pipeline:
- `ErrorHandler` (service layer): Standardizes domain errors
- `ErrorAdapter` (protocol layer): Transforms to MCP responses
- Adapter-specific errors: surface via `AdapterError` codes (e.g. `ORDER_NOT_FOUND`, `INSUFFICIENT_INVENTORY`)

### Type System

Core types in `src/types/`:
- `adapter.ts`: Adapter interface and result types
- `fulfillment.ts`: Domain models (Order, Product, Customer, etc.)
- `config.ts`: Configuration schemas
- `mcp.ts`: MCP protocol types

All source uses ES modules with `.js` extensions in imports (required for ES module resolution).

## Creating Custom Adapters

1. Implement `IFulfillmentAdapter` interface from `src/types/adapter.ts`
2. All 15 core methods are required (lifecycle + operations + queries)
3. Optional methods: `getBuyer`, `releaseReservation`, `adjustInventory`, `transferInventory`

For built-in adapters:
1. Create adapter in `src/adapters/your-adapter/`
2. Register in `AdapterFactory.builtInAdapters` Map
3. Set `ADAPTER_TYPE=built-in` and `ADAPTER_NAME=your-adapter`

For NPM adapters:
1. Publish package implementing the interface
2. Set `ADAPTER_TYPE=npm` and `ADAPTER_PACKAGE=@company/adapter`

For local adapters:
1. Create file implementing the interface
2. Set `ADAPTER_TYPE=local` and `ADAPTER_PATH=/path/to/adapter.js`

## Important Implementation Notes

### ES Module Requirements
- All imports must use `.js` extension (e.g., `from './file.js'`)
- Use `import` and `export`, not `require`
- `type: "module"` is set in package.json

### Test Isolation
- Vitest runs with `singleThread: true` to prevent race conditions
- Tests must clean up adapters via `AdapterFactory.clearInstances()`
- Setup file: `tests/setup.ts`

### MCP Response Format
Success responses must contain:
```typescript
{
  content: [{ type: "text", text: string }],
  isError: false
}
```

Error responses:
```typescript
{
  content: [{ type: "text", text: string }],
  isError: true
}
```

### ServiceOrchestrator Initialization
The orchestrator must be initialized before use:
```typescript
await serviceOrchestrator.initialize(adapterConfig);
```

This connects the adapter and initializes domain services.

### Health Monitoring
`HealthMonitor` automatically tracks:
- Operation success/failure rates
- Response times
- Adapter health status

Access via `ServiceOrchestrator.checkHealth()` and `getMetrics()`.

## Security Considerations

### Dynamic Adapter Loading
- Adapters execute with full system permissions
- Only load from trusted sources
- All loading is logged for transparency
- Consider containerization for production

### Production Hardening
- Debug logging auto-disabled in production
- Sanitization auto-enabled in production
- Request timeouts capped at 60s
- See `ConfigManager.applySecurityPolicies()`

## Claude Desktop Integration

MCP servers run via stdio transport. Configuration example:
```json
{
  "mcpServers": {
    "cof-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/dist/index.js"],
      "env": {
        "ADAPTER_TYPE": "built-in",
        "ADAPTER_NAME": "mock",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

Location:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

## Common Patterns

### Adding a New Tool
1. Create file in `src/tools/[category]/your-tool.ts`
2. Extend `BaseTool<TInput, TOutput>`
3. Define `name`, `description`, `inputSchema`
4. Implement `execute(input: TInput): Promise<TOutput>`
5. Registry auto-discovers and registers it

### Adding a Service Operation
1. Add method to appropriate service class
2. Add delegating method to `ServiceOrchestrator`
3. Include health monitoring (`recordSuccess`/`recordFailure`)
4. Update adapter interface if needed

### Working with Transformers
`Transformer` class handles data mapping between:
- MCP tool inputs → Adapter requests
- Adapter responses → Tool outputs
- Domain models → Standardized formats

Located in `src/services/transformer.ts`.

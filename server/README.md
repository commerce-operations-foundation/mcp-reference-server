# Commerce Operations Foundation MCP Server

A Model Context Protocol (MCP) server that provides standardized access to commerce operations and fulfillment systems.

## Features

- 10 standardized fulfillment tools covering core order capture, fulfillment, and data queries
- Plug-and-play adapter system for different fulfillment backends
- Mock adapter for testing and development
- Full TypeScript implementation with strict type safety
- JSON Schema validation for all inputs
- stdio transport for Claude Desktop integration

## Quick Start

### Installation

```bash
# From the repository root
cd server
npm install
```

### Running the Server

```bash
# Development mode with TypeScript via vite-node
npm run dev

# Production mode
npm run build
npm start
```

### Configuration

Copy `.env.example` to `.env` and configure:

```bash
# Use built-in mock adapter (default)
ADAPTER_TYPE=built-in
ADAPTER_NAME=mock

# Set log level
LOG_LEVEL=info

# Optional: pass adapter options as JSON
ADAPTER_CONFIG='{"fixedLatency":150}'
```

## Architecture

The server follows a three-layer architecture:

1. **Protocol Layer** - Handles MCP communication
2. **Service Layer** - Business logic and validation
3. **Adapter Layer** - Fulfillment integration (pluggable)

## Available Tools

### Action Tools
- `create-sales-order` - Create new orders from external systems or checkouts
- `cancel-order` - Cancel existing orders with optional reasons
- `update-order` - Modify order details and metadata
- `fulfill-order` - Mark orders as fulfilled and return fulfillment data

### Query Tools
- `get-orders` - Retrieve orders with rich filtering
- `get-customers` - Fetch customer records
- `get-products` - Get product catalog entries
- `get-product-variants` - Retrieve variant data
- `get-inventory` - Check stock levels across locations
- `get-fulfillments` - List fulfillment records and statuses

## Claude Desktop Integration

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "cof-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/server/dist/index.js"],
      "env": {
        "ADAPTER_TYPE": "built-in",
        "ADAPTER_NAME": "mock"
      }
    }
  }
}
```

## Security Considerations

### Dynamic Adapter Loading

This MCP server supports dynamic loading of adapters from NPM packages and local files to facilitate adapter development and testing. This flexibility comes with security considerations:

**⚠️ IMPORTANT SECURITY NOTICE:**
- Dynamically loaded adapters execute with full system permissions
- Only load adapters from trusted sources
- Never load adapters from user uploads or untrusted repositories
- The adapter code has the same access level as the MCP server itself

**For Production Environments:**
- Consider implementing a whitelist of allowed adapters
- Run the MCP server in a containerized/sandboxed environment
- Use Node.js experimental permission flags to restrict file/network access
- Implement code signing for adapters

**For Development (Reference Implementation):**
- The current implementation prioritizes developer flexibility
- Logs all adapter loading for transparency
- Validates file existence and type before loading
- Suitable for local development and testing

### Best Practices

1. **Adapter Development**: When developing custom adapters, ensure your code:
   - Only accesses necessary Fulfillment APIs
   - Doesn't expose sensitive credentials
   - Validates all inputs properly
   - Handles errors gracefully

2. **Configuration Security**:
   - Store sensitive configuration in environment variables
   - Never commit `.env` files to version control
   - Use secrets management in production

3. **Network Security**:
   - Run the MCP server behind appropriate firewalls
   - Use TLS/SSL for Fulfillment API communications
   - Implement rate limiting for production use

## Development

### Project Structure

```
server/
├── src/
│   ├── adapters/      # Built-in Fulfillment adapters
│   ├── services/      # Business logic
│   ├── tools/         # Tool implementations
│   ├── types/         # TypeScript types
│   └── utils/         # Utilities
└── tests/            # Test suites
```

### Adding a Custom Adapter

1. Create your adapter class implementing `IFulfillmentAdapter`
2. Register it in the adapter factory
3. Configure via environment variables

See [docs/architecture](../docs/architecture/system-architecture.md) for details.

### Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
```

## Documentation

- [Architecture Guide](../docs/architecture/system-architecture.md)
- [MCP Specification](../docs/specification/mcp-server-spec.md)
- [Tool Reference](../docs/standard/tools-reference.md)

## License

MIT

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## Support

For issues and questions, visit [GitHub Issues](https://github.com/commerce-operations-foundation/mcp/issues).

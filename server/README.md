# Commerce Operations Foundation MCP Server

A Model Context Protocol (MCP) server that provides standardized access to commerce operations and fulfillment systems.

## Features

- 15 standard fulfillment tools covering the complete order lifecycle
- Plug-and-play adapter system for different fulfillment backends
- Mock adapter for testing and development
- Full TypeScript implementation with strict type safety
- JSON Schema validation for all inputs
- stdio transport for Claude Desktop integration

## Quick Start

### Installation

```bash
npm install @cof-org/mcp
```

### Running the Server

```bash
# Development mode with TypeScript
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
```

## Architecture

The server follows a three-layer architecture:

1. **Protocol Layer** - Handles MCP communication
2. **Service Layer** - Business logic and validation
3. **Adapter Layer** - Fulfillment integration (pluggable)

## Available Tools

### Order Actions
- `capture-order` - Create new orders
- `cancel-order` - Cancel existing orders
- `update-order` - Modify order details
- `return-order` - Process returns
- `exchange-order` - Handle exchanges
- `ship-order` - Mark orders as shipped

### Management Tools
- `hold-order` - Place orders on hold
- `split-order` - Split into multiple shipments
- `reserve-inventory` - Reserve stock

### Query Tools
- `get-order` - Retrieve order details
- `get-inventory` - Check stock levels
- `get-product` - Get product information
- `get-customer` - Retrieve customer data
- `get-shipment` - Track shipments
- `get-buyer` - Get B2B buyer information

## Claude Desktop Integration

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "cof-mcp": {
      "command": "npx",
      "args": ["@cof-org/mcp"],
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
npm run test:e2e
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

For issues and questions, visit [GitHub Issues](https://github.com/cof-org/mcp/issues).

# User Guides

This directory contains user guides for the Commerce Operations Foundation MCP Server.

## Available Guides

- [Installation Guide](installation.md) - Complete installation instructions for all methods
- [Configuration Guide](configuration.md) - Detailed configuration options and examples
- [Adapter Development](../getting-started/for-fulfillment-vendors.md) - Creating custom adapters
- [Tools Reference](../standard/tools-reference.md) - Complete tool documentation

## Quick Start

### Installation
See the [Installation Guide](installation.md) for detailed instructions.

```bash
git clone https://github.com/cof-org/mcp-reference-server.git
cd mcp-reference-server/server
npm install
npm run build
node dist/index.js
```

### Configuration
See the [Configuration Guide](configuration.md) for all options.

```bash
export ADAPTER_TYPE=built-in
export ADAPTER_NAME=mock
npm run build
node dist/index.js
```

### Claude Desktop Integration
See the [Installation Guide](installation.md#claude-desktop-integration) for platform-specific setup.

## Available Tools

See the [Tools Reference](../standard/tools-reference.md) for documentation of the 10 standard operations.

## Adapters

The server supports multiple adapter types:

- **Mock Adapter** (default) - For testing and development
- **NPM Package Adapters** - Published by fulfillment vendors
- **Local File Adapters** - Custom private implementations

See the [Adapter Development Guide](../getting-started/for-fulfillment-vendors.md) for creating custom adapters.

## Support

- [Documentation](../README.md)
- [GitHub Issues](https://github.com/TODO-ORG/TODO-REPO/issues)
- [Community Discussions](https://github.com/TODO-ORG/TODO-REPO/discussions)

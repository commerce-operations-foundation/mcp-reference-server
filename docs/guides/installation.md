# Installation Guide

This guide covers all installation methods for the Commerce Operations Foundation MCP Server.

## Prerequisites

- Node.js 18+ and npm installed
- Git (for source installation)
- Docker (optional, for containerized deployment)

## Installation Methods

### Method 1: NPM Package (Recommended)

Install the server globally via npm:

```bash
# Install globally
npm install -g @cof-org/mcp

# Or install locally in your project
npm install @cof-org/mcp
```

#### Running with NPM

```bash
# If installed globally
cof-mcp

# If installed locally
npx @cof-org/mcp
```

### Method 2: Docker

Pull and run the official Docker image:

```bash
# Pull the latest image
docker pull ghcr.io/TODO-ORG/TODO-REPO:latest

# Run the container
docker run -d \
  --name cof-mcp \
  -e ADAPTER_TYPE=built-in \
  -e ADAPTER_NAME=mock \
  ghcr.io/TODO-ORG/TODO-REPO:latest
```

#### Docker Compose

Create a `docker-compose.yml`:

```yaml
version: '3.8'
services:
  cof-mcp:
    image: ghcr.io/TODO-ORG/TODO-REPO:latest
    environment:
      - ADAPTER_TYPE=built-in
      - ADAPTER_NAME=mock
      - LOG_LEVEL=info
    restart: unless-stopped
```

Run with:
```bash
docker-compose up -d
```

### Method 3: From Source

Clone and build from the source repository:

```bash
# Clone the repository
git clone https://github.com/TODO-ORG/TODO-REPO.git
cd TODO-REPO/server

# Install dependencies
npm install

# Build the project
npm run build

# Run the server
npm start
```

#### Development Mode

For development with hot-reload:

```bash
npm run dev
```

## Configuration

### Environment Variables

Create a `.env` file in your working directory:

```bash
# Server Configuration
LOG_LEVEL=info              # Logging level: debug, info, warn, error
LOG_DIR=./logs              # Directory for log files

# Adapter Configuration
ADAPTER_TYPE=built-in       # Adapter type: built-in, npm, or local
ADAPTER_NAME=mock          # Adapter name or path
ADAPTER_CONFIG={}          # JSON configuration for the adapter

# Performance Settings
TIMEOUT_DEFAULT=30000      # Default timeout in milliseconds
RETRY_MAX_ATTEMPTS=3       # Maximum retry attempts
RETRY_BASE_DELAY=1000      # Base delay for retries in milliseconds
```

### Configuration File

Alternatively, use a JSON configuration file:

```json
{
  "server": {
    "name": "cof-mcp-server",
    "version": "1.0.0"
  },
  "logging": {
    "level": "info",
    "dir": "./logs"
  },
  "adapter": {
    "type": "built-in",
    "name": "mock",
    "config": {}
  }
}
```

Load with:
```bash
cof-mcp --config ./config.json
```

## Claude Desktop Integration

To use with Claude Desktop, add to your Claude configuration:

### macOS
Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "cof-fulfillment": {
      "command": "cof-mcp",
      "env": {
        "ADAPTER_TYPE": "built-in",
        "ADAPTER_NAME": "mock"
      }
    }
  }
}
```

### Windows
Edit `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "cof-fulfillment": {
      "command": "cof-mcp.cmd",
      "env": {
        "ADAPTER_TYPE": "built-in",
        "ADAPTER_NAME": "mock"
      }
    }
  }
}
```

### Using with Custom Adapters

For NPM-based adapters:

```json
{
  "mcpServers": {
    "cof-fulfillment": {
      "command": "cof-mcp",
      "env": {
        "ADAPTER_TYPE": "npm",
        "ADAPTER_NAME": "@yourcompany/cof-adapter-yourfulfillment",
        "ADAPTER_CONFIG": "{\"apiKey\":\"your-api-key\"}"
      }
    }
  }
}
```

## Verification

### Test the Installation

Check that the server is working:

```bash
# Version check
cof-mcp --version

# Run with debug output
LOG_LEVEL=debug cof-mcp

# Test with a simple tool call
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | cof-mcp
```

### Health Check

The server provides a health check endpoint:

```bash
# Send a ping request
echo '{"jsonrpc":"2.0","method":"ping","id":1}' | cof-mcp
```

Expected response:
```json
{"jsonrpc":"2.0","result":{},"id":1}
```

## Troubleshooting

### Common Issues

#### Node Version Error
```
Error: Unsupported Node.js version
```
**Solution**: Upgrade to Node.js 18 or higher:
```bash
node --version  # Check current version
nvm use 18      # Use nvm to switch versions
```

#### Permission Denied
```
Error: EACCES: permission denied
```
**Solution**: Use npx or fix npm permissions:
```bash
npx @cof-org/mcp     # Run without global install
# OR
sudo npm install -g @cof-org/mcp  # Install with sudo (not recommended)
```

#### Adapter Not Found
```
Error: Adapter '@company/adapter' not found
```
**Solution**: Install the adapter package:
```bash
npm install @company/adapter
```

#### Claude Desktop Not Detecting Server
**Solution**: Verify the configuration file location and restart Claude:
1. Check the config file path is correct
2. Ensure the command path is absolute or in PATH
3. Restart Claude Desktop application

### Debug Mode

Enable debug logging for troubleshooting:

```bash
# Via environment variable
LOG_LEVEL=debug cof-mcp

# Or in .env file
LOG_LEVEL=debug
```

## Next Steps

- [Configuration Guide](configuration.md) - Detailed configuration options
- [Adapter Development](../getting-started/for-fulfillment-vendors.md) - Create custom adapters
- [Tools Reference](../standard/tools-reference.md) - Available operations
- [Testing Guide](../testing/README.md) - Testing your setup

## Support

If you encounter issues:
1. Check the [FAQ](../resources/faq.md)
2. Review debug logs
3. Search [GitHub Issues](https://github.com/TODO-ORG/TODO-REPO/issues)
4. Ask in [Discussions](https://github.com/TODO-ORG/TODO-REPO/discussions)

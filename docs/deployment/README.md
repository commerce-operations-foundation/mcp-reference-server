# Deployment Guide

This directory contains deployment documentation for the Commerce Operations Foundation MCP Server.

## Deployment Methods

For installation instructions, see the [Installation Guide](../guides/installation.md).

## Production Deployment

### Docker Deployment

Build the local Docker image provided in `server/Dockerfile`:

```bash
cd mcp-reference-server/server
docker build -t cof-mcp-local .
docker run -d \
  --name cof-mcp \
  -e ADAPTER_TYPE=built-in \
  -e ADAPTER_NAME=mock \
  cof-mcp-local
```

Map volumes or override environment variables to inject adapter packages.

## Environment Configuration

See the [Configuration Guide](../guides/configuration.md) for detailed configuration options.

```bash
# Basic production configuration
LOG_LEVEL=info
ADAPTER_TYPE=npm
ADAPTER_NAME=@yourcompany/adapter
ADAPTER_CONFIG='{"apiKey":"your-production-key"}'
```

## Monitoring and Health Checks

The server provides health check capabilities for production monitoring:

```bash
# Send a ping request to verify server health
echo '{"jsonrpc":"2.0","method":"ping","id":1}' | node dist/index.js
```

## Support

For deployment issues:
1. Check the [Installation Guide](../guides/installation.md#troubleshooting)
2. Review server logs with `LOG_LEVEL=debug`
3. Verify environment configuration
4. Search [GitHub Issues](https://github.com/TODO-ORG/TODO-REPO/issues)

# Configuration Guide

Comprehensive guide to configuring the Commerce Operations Foundation MCP Server.

## Configuration Methods

The server supports multiple configuration methods, in order of precedence:

1. Command-line arguments (highest priority)
2. Environment variables
3. Configuration file
4. Default values (lowest priority)

## Environment Variables

### Core Server Settings

| Variable | Description | Default | Values |
|----------|-------------|---------|--------|
| `LOG_LEVEL` | Logging verbosity | `info` | `debug`, `info`, `warn`, `error` |
| `LOG_DIR` | Directory for log files | `./logs` | Any valid path |
| `LOG_FORMAT` | Log output format | `json` | `json`, `simple` |
| `LOG_MAX_SIZE` | Max log file size | `20m` | Size with unit (k, m, g) |
| `LOG_MAX_FILES` | Max number of log files | `14d` | Number with d (days) or count |

### Adapter Configuration

| Variable | Description | Default | Values |
|----------|-------------|---------|--------|
| `ADAPTER_TYPE` | Type of adapter to use | `built-in` | `built-in`, `npm`, `local` |
| `ADAPTER_NAME` | Adapter identifier | `mock` | Package name or path |
| `ADAPTER_CONFIG` | JSON configuration for adapter | `{}` | Valid JSON string |
| `ADAPTER_TIMEOUT` | Adapter operation timeout (ms) | `30000` | Number |

### Performance Settings

| Variable | Description | Default | Values |
|----------|-------------|---------|--------|
| `TIMEOUT_DEFAULT` | Default operation timeout (ms) | `30000` | Number |
| `TIMEOUT_QUERY` | Query operation timeout (ms) | `10000` | Number |
| `TIMEOUT_MUTATION` | Mutation operation timeout (ms) | `60000` | Number |
| `RETRY_MAX_ATTEMPTS` | Maximum retry attempts | `3` | Number |
| `RETRY_BASE_DELAY` | Base retry delay (ms) | `1000` | Number |
| `RETRY_MAX_DELAY` | Maximum retry delay (ms) | `30000` | Number |
| `RETRY_BACKOFF_MULTIPLIER` | Backoff multiplier | `2` | Number |

### Security Settings

| Variable | Description | Default | Values |
|----------|-------------|---------|--------|
| `SANITIZE_LOGS` | Sanitize sensitive data in logs | `true` | `true`, `false` |
| `SANITIZE_FIELDS` | Fields to sanitize | See below | Comma-separated list |
| `MAX_REQUEST_SIZE` | Maximum request size | `1mb` | Size with unit |
| `RATE_LIMIT_ENABLED` | Enable rate limiting | `false` | `true`, `false` |
| `RATE_LIMIT_MAX` | Max requests per window | `100` | Number |
| `RATE_LIMIT_WINDOW` | Rate limit window (ms) | `60000` | Number |

Default sanitized fields:
```
password,apiKey,token,secret,authorization,creditCard,ssn,pin
```

## Configuration File

### JSON Format

Create a `config.json` file:

```json
{
  "server": {
    "name": "cof-mcp-server",
    "version": "1.0.0",
    "description": "Commerce Operations Foundation MCP Server"
  },
  "logging": {
    "level": "info",
    "dir": "./logs",
    "format": "json",
    "maxSize": "20m",
    "maxFiles": "14d"
  },
  "adapter": {
    "type": "built-in",
    "name": "mock",
    "config": {
      "apiUrl": "https://api.todo-domain.example",
      "apiKey": "your-api-key"
    },
    "timeout": 30000
  },
  "performance": {
    "timeout": {
      "default": 30000,
      "query": 10000,
      "mutation": 60000
    }
  },
  "resilience": {
    "retry": {
      "maxAttempts": 3,
      "baseDelay": 1000,
      "maxDelay": 30000,
      "backoffMultiplier": 2
    }
  },
  "security": {
    "sanitization": {
      "enabled": true,
      "fields": ["password", "apiKey", "token"]
    },
    "rateLimit": {
      "enabled": false,
      "max": 100,
      "windowMs": 60000
    }
  }
}
```

### Loading Configuration

```bash
# Via command line
cof-mcp --config ./config.json

# Via environment variable
CONFIG_FILE=./config.json cof-mcp
```

## Adapter-Specific Configuration

### Built-in Mock Adapter

No additional configuration required:

```bash
ADAPTER_TYPE=built-in
ADAPTER_NAME=mock
```

### NPM Package Adapter

Install and configure an NPM adapter:

```bash
# Install the adapter
npm install @company/cof-adapter-system

# Configure
ADAPTER_TYPE=npm
ADAPTER_NAME=@company/cof-adapter-system
ADAPTER_CONFIG='{"apiKey":"xyz","workspace":"prod"}'
```

### Local File Adapter

Use a local adapter implementation:

```bash
ADAPTER_TYPE=local
ADAPTER_NAME=/path/to/your/adapter.js
ADAPTER_CONFIG='{"setting":"value"}'
```

## Advanced Configurations

### Multi-Environment Setup

Use different configurations per environment:

```bash
# Development
cp .env.development .env
npm run dev

# Staging
cp .env.staging .env
npm start

# Production
cp .env.production .env
NODE_ENV=production npm start
```

### Docker Configuration

Pass environment variables to Docker:

```bash
docker run -d \
  -e LOG_LEVEL=debug \
  -e ADAPTER_TYPE=npm \
  -e ADAPTER_NAME=@company/adapter \
  -e ADAPTER_CONFIG='{"apiKey":"secret"}' \
  ghcr.io/TODO-ORG/TODO-REPO:latest
```

Or use an env file:

```bash
docker run -d --env-file .env ghcr.io/TODO-ORG/TODO-REPO:latest
```

### Kubernetes Configuration

Use ConfigMaps and Secrets:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: cof-mcp-config
data:
  LOG_LEVEL: "info"
  ADAPTER_TYPE: "npm"
  ADAPTER_NAME: "@company/adapter"
---
apiVersion: v1
kind: Secret
metadata:
  name: cof-mcp-secrets
type: Opaque
stringData:
  ADAPTER_CONFIG: '{"apiKey":"secret-key"}'
```

### Monitoring Configuration

Enable metrics and health checks:

```json
{
  "monitoring": {
    "metrics": {
      "enabled": true,
      "port": 9090,
      "path": "/metrics"
    },
    "health": {
      "enabled": true,
      "port": 8080,
      "path": "/health",
      "interval": 30000
    }
  }
}
```

## Configuration Validation

The server validates configuration on startup:

```bash
# Validate configuration without starting
cof-mcp --validate-config

# Test configuration
cof-mcp --test-config ./config.json
```

## Best Practices

### Security

1. **Never commit secrets**: Use environment variables or secret management
2. **Rotate API keys regularly**: Update adapter configurations periodically
3. **Use minimal permissions**: Configure adapters with least privilege
4. **Enable sanitization**: Keep sensitive data out of logs

### Performance

1. **Set appropriate timeouts**: Balance responsiveness with reliability
2. **Configure retries**: Handle transient failures gracefully
3. **Monitor resource usage**: Adjust based on load patterns
4. **Use connection pooling**: Configure adapters to reuse connections

### Operations

1. **Use structured logging**: Enable JSON format for log aggregation
2. **Configure log rotation**: Prevent disk space issues
3. **Set up monitoring**: Track metrics and health status
4. **Document configurations**: Maintain README for your setup

## Troubleshooting Configuration

### Debug Configuration Loading

```bash
# Show resolved configuration
LOG_LEVEL=debug cof-mcp --show-config

# Test specific configuration
cof-mcp --test-adapter
```

### Common Issues

#### Configuration Not Loading
- Check file path and permissions
- Verify JSON syntax
- Ensure environment variables are exported

#### Adapter Configuration Errors
- Validate JSON in ADAPTER_CONFIG
- Check adapter package is installed
- Verify adapter-specific requirements

#### Performance Issues
- Increase timeout values
- Adjust retry settings
- Check adapter connection pooling

## Migration Guide

### From Environment Variables to Config File

1. Export current configuration:
```bash
cof-mcp --export-config > config.json
```

2. Edit the generated file
3. Test with the new configuration:
```bash
cof-mcp --config config.json --validate
```

### Upgrading Adapter Configuration

When upgrading adapters, check for configuration changes:

```bash
# View adapter configuration schema
npm info @company/adapter config

# Test with new configuration
ADAPTER_CONFIG='{"newField":"value"}' cof-mcp --test-adapter
```

## Reference

- [Installation Guide](installation.md) - Installation methods
- [Environment Variables Reference](#environment-variables) - Complete list
- [Adapter Development](../getting-started/for-fulfillment-vendors.md) - Custom adapters
- [Deployment Guide](../deployment/README.md) - Production deployment

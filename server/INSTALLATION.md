# Installing Commerce Operations Foundation MCP Server in Claude Desktop

## Prerequisites
- Claude Desktop installed
- Node.js 18+ installed
- This repository cloned and built

## Installation Steps

### 1. Build the Server
```bash
git clone $REPO_URL
cd commerce-operations-foundation-mcp/server
npm install
npm run build
```

### 2. Configure Claude Desktop

Open Claude Desktop configuration file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

Add the following to the configuration:

```json
{
  "mcpServers": {
    "cof-mcp": {
      "command": "node",
      "args": [
        "$commerce-operations-foundation-mcp/server/run-mcp.js"
      ],
      "env": {
        "ADAPTER_TYPE": "built-in",
        "ADAPTER_NAME": "mock",
        "LOG_LEVEL": "info",
        "NODE_ENV": "development"
      }
    }
  }
}
```

**Note**: Adjust the path in `args` to match your actual installation directory.

### 3. Restart Claude Desktop
After saving the configuration, restart Claude Desktop for changes to take effect.

## Testing the Integration

Once restarted, Claude should have access to Fulfillment tools. Test by asking:
- "What Fulfillment tools are available?"
- "Can you capture a test order?"
- "Show me the order management capabilities"

## Configuration Options

You can customize the behavior by modifying the `env` section:

- `ADAPTER_TYPE`: Choose adapter type (`built-in`, `npm`, `local`)
- `ADAPTER_NAME`: Choose specific adapter name (e.g., `mock` for built-in adapters)
- `LOG_LEVEL`: Set logging level (`debug`, `info`, `warn`, `error`)
- `MOCK_DELAY_MS`: Add simulated latency (milliseconds)
- `MOCK_ERROR_RATE`: Simulate errors (0.0 to 1.0)

## Troubleshooting

### Server doesn't appear in Claude
1. Check the configuration file path
2. Ensure the server path is absolute, not relative
3. Check Claude Desktop logs for errors

### Build errors
```bash
npm run clean
npm install
npm run build
```

## Development Mode

For development with hot reload:
```json
{
  "mcpServers": {
    "cof-mcp-dev": {
      "command": "npx",
      "args": [
        "tsx",
        "$commerce-operations-foundation-mcp/server/src/index.ts"
      ],
      "env": {
        "ADAPTER_TYPE": "built-in",
        "ADAPTER_NAME": "mock",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

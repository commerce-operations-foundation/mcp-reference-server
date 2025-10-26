# Installation Guide

This guide explains how to run the Commerce Operations Foundation MCP Server from source and how to integrate it with Claude Desktop.

## Prerequisites

- Node.js 18 or later (Node 22 is recommended)
- npm 9+
- Git

## Method 1: Run from Source

```bash
git clone https://github.com/cof-org/mcp-reference-server.git
cd mcp-reference-server/server
npm install
```

### Development Mode

```bash
npm run dev
```

This uses vite-node to transpile TypeScript on the fly and reload code during changes.

### Production Mode

```bash
npm run build
npm start
```

The build step emits compiled JavaScript into `dist/`, and `npm start` runs `node dist/index.js`.

## Method 2: Build a Local Docker Image

The repository includes a Dockerfile under `server/`.

```bash
cd mcp-reference-server/server
docker build -t cof-mcp-local .
docker run --rm \
  -e ADAPTER_TYPE=built-in \
  -e ADAPTER_NAME=mock \
  cof-mcp-local
```

Mount configuration files or additional adapters as needed using `-v`.

## Environment Configuration

Copy `.env.example` in the `server/` directory to `.env`:

```bash
cp .env.example .env
```

Supported environment variables (parsed in `EnvironmentConfig`):

| Variable | Description |
| --- | --- |
| `NODE_ENV` | Runtime environment (`development`, `staging`, `production`). |
| `SERVER_PORT` | Override the stdio server port when using network transports. |
| `LOG_LEVEL` | Logging verbosity (`debug`, `info`, `warn`, `error`). |
| `ADAPTER_TYPE` | `built-in`, `npm`, or `local`. |
| `ADAPTER_NAME` | Built-in adapter name or friendly name. |
| `ADAPTER_PACKAGE` | Package name when `ADAPTER_TYPE=npm`. |
| `ADAPTER_PATH` | Absolute path when `ADAPTER_TYPE=local` (should point to a built file such as `dist/index.js`). |
| `ADAPTER_EXPORT` | Optional export name (defaults to `default`). |
| `ADAPTER_CONFIG` | JSON string passed to the adapter constructor (`{"apiUrl":"https://..."}`). |
| `FEATURE_*` | Feature flags (e.g., `FEATURE_SANDBOX=true`). |

Other environment variables mentioned in older docs (e.g., `MOCK_DELAY_MS`, `TIMEOUT_DEFAULT`) are not consumed by the current codebase—prefer `ADAPTER_CONFIG` for adapter tuning.

## Claude Desktop Integration

Add an entry to your Claude configuration file (paths vary by OS):

```json
{
  "mcpServers": {
    "cof-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-reference-server/server/dist/index.js"],
      "env": {
        "ADAPTER_TYPE": "built-in",
        "ADAPTER_NAME": "mock",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

For development workflows you can run the dev script instead:

```json
{
  "mcpServers": {
    "cof-mcp-dev": {
      "command": "npm",
      "args": ["run", "dev"],
      "cwd": "/absolute/path/to/mcp-reference-server/server",
      "env": {
        "ADAPTER_TYPE": "built-in",
        "ADAPTER_NAME": "mock",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

Restart Claude Desktop after updating the configuration.

## Verifying the Installation

Run the test suite from the `server/` directory:

```bash
npm test
```

You can also send a quick `tools/list` request using stdio:

```bash
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | node dist/index.js
```

The response should contain the ten tools described in the Tools Reference.

## Troubleshooting

- **Missing adapter dependencies** – confirm `ADAPTER_PACKAGE` or `ADAPTER_PATH` is correct and built.
- **Invalid `ADAPTER_CONFIG` JSON** – the server will throw a configuration error; validate the JSON string separately.
- **Claude Desktop cannot start the server** – use absolute paths in `args`/`cwd` and verify permissions.

If issues persist, enable verbose logging with `LOG_LEVEL=debug` and review the console output.

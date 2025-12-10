# Configuration Guide

This guide explains common configuration options your adapter should support, and how they map to the MCP server environment variables.

## MCP Server Environment

Set these in the MCP server `.env` (or Process Env) to load your adapter:

```
ADAPTER_TYPE=npm            # or local
ADAPTER_PACKAGE=@yourcompany/uois-adapter-yourfulfillment  # when using npm
ADAPTER_EXPORT=YourFulfillmentAdapter                      # optional, defaults to default export
# For local development
# ADAPTER_TYPE=local
# ADAPTER_PATH=/absolute/path/to/yourfulfillment-adapter/dist/index.js

# Adapter-specific options (JSON string passed to adapter constructor)
ADAPTER_CONFIG={
  "apiUrl": "https://api.yourfulfillment.com",
  "apiKey": "YOUR_API_KEY",
  "workspace": "YOUR_WORKSPACE",
  "timeout": 30000,
  "retryAttempts": 3,
  "debugMode": false
}
```

## Recommended Adapter Options

- apiUrl: Base URL for your API
- apiKey: Credential for authentication
- workspace: Tenant or account context if applicable
- timeout: Request timeout (ms)
- retryAttempts: Retries for transient errors
- debugMode: Verbose logging toggle

## Exporting Your Adapter

Ensure your package exports the adapter class as the default export (and optionally a named export) from `src/index.ts`:

```ts
export { YourFulfillmentAdapter as default } from './adapter';
export { YourFulfillmentAdapter } from './adapter';
```

This lets the MCP server load it via dynamic import:
- NPM: `import(pkg)[exportName || 'default']`
- Local: `import(filePath)[exportName || 'default']`

## Deployment Notes

- Do not commit secrets. Use environment variables or a secrets manager.
- Provide a `.env.example` with the variables your adapter needs.
- Document any required scopes, IP allowlists, or network prerequisites.


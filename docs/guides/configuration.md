# Configuration Guide

The MCP server loads configuration from three sources, in priority order:

1. Environment variables (highest)
2. Configuration files (if present)
3. Built-in defaults (`ConfigLoader.loadDefaults`)

This guide focuses on the environment variables that the current codebase reads.

## Environment Variables

| Variable | Description | Default |
| --- | --- | --- |
| `NODE_ENV` | Controls environment-specific behaviour (production enables sanitization and log rotation). | `development` |
| `SERVER_PORT` | Optional port for network transports. | unset |
| `LOG_LEVEL` | Logging verbosity (`debug`, `info`, `warn`, `error`). | `info` |
| `ADAPTER_TYPE` | Determines the adapter loader (`built-in`, `npm`, `local`). | `built-in` |
| `ADAPTER_NAME` | Name of built-in adapter or friendly name for discovery. | `mock` |
| `ADAPTER_PACKAGE` | NPM package name when `ADAPTER_TYPE=npm`. | unset |
| `ADAPTER_PATH` | Absolute path when `ADAPTER_TYPE=local` (should point to a compiled entrypoint such as `dist/index.js`). | unset |
| `ADAPTER_EXPORT` | Export to load from the package/path (defaults to `default`). | unset |
| `ADAPTER_CONFIG` | JSON string passed as `options` to the adapter constructor. | `{}` |
| `FEATURE_*` | Feature flags (any variable that begins with `FEATURE_` and is set to `true`). | unset |

Unsupported variables from previous documentation (for example `TIMEOUT_DEFAULT`, `RATE_LIMIT_MAX`, `MOCK_DELAY_MS`) are ignored by the current runtime. Encode adapter-specific behaviour inside `ADAPTER_CONFIG` instead.

## Configuration Files

`ConfigLoader` looks for JSON files in the following locations (first match wins):

1. `<cwd>/config.json`
2. `<cwd>/config/<NODE_ENV>.json`
3. `<cwd>/.commerce-operations-foundation-mcp.json`

These files merge with defaults before environment variables are applied. The schema is validated by Zod (`server/src/types/config.ts`), so invalid structures raise errors during startup.

## Updating Configuration at Runtime

Use the `ConfigManager` singleton to inspect or change settings programmatically:

```typescript
import { ConfigManager } from '@cof-org/mcp';

const manager = ConfigManager.getInstance();
const loggingLevel = manager.get('logging.level');

manager.set('logging.level', 'debug');
```

Critical changes (adapter type or server port) emit `critical-change` events so callers can restart gracefully.

## Best Practices

1. **Store secrets outside source control** – keep API keys inside `ADAPTER_CONFIG` via environment variables or secret managers.
2. **Use JSON for adapter options** – complex settings such as latency simulation for the mock adapter live inside `ADAPTER_CONFIG`.
3. **Enable sanitization in production** – setting `NODE_ENV=production` ensures request sanitization and disables debug logging.
4. **Version configuration files** – when using configuration files, document them alongside deployment scripts so environments stay reproducible.

For deployment examples, see the [Installation Guide](./installation.md).

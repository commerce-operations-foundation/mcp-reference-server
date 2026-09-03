# MCP 2026-07-28 Migration

This document defines the migration of the Commerce Operations Foundation onX MCP reference server from its pre-2026-07-28 implementation to the MCP 2026-07-28 protocol revision.

## Why this migration is required

The current server predates MCP 2026-07-28 and uses `@modelcontextprotocol/sdk` 0.5.x. The 2026-07-28 protocol changes the serving model substantially:

- protocol-level sessions and `Mcp-Session-Id` are retired for 2026-era traffic;
- the `initialize` / `notifications/initialized` handshake is no longer required for 2026-era requests;
- request identity, client capabilities, and protocol version are carried per request in `_meta`;
- HTTP requests use standard MCP routing headers including `MCP-Protocol-Version`, `Mcp-Method`, and `Mcp-Name` where applicable;
- list results gain explicit cache semantics;
- the official TypeScript SDK v2 requires explicit 2026-07-28 serving entry points (`createMcpHandler` for HTTP and `serveStdio` for stdio).

Merely upgrading package versions is not sufficient. A hand-constructed `Server` or `McpServer` connected using the old transport pattern continues to speak the legacy protocol unless one of the 2026-aware serving entry points is used.

## Existing architecture

The repository currently contains two protocol edges:

1. `server/src/server.ts` — the actual MCP server, using the legacy SDK over stdio.
2. `server/src/http-server.ts` — a custom REST facade exposing the onX operations as `/api/tools/*`; this is not a Streamable HTTP MCP endpoint.

The reusable business layer is already separated into:

- `ServiceOrchestrator`
- `ToolRegistry`
- adapters
- onX schemas and types

Those components should be preserved.

## Target architecture

Create one reusable onX MCP server factory and serve it through the official SDK entry points:

```text
                  +---------------------+
                  | ServiceOrchestrator |
                  | ToolRegistry        |
                  +----------+----------+
                             |
                    buildOnxMcpServer()
                             |
                  +----------+----------+
                  |                     |
              serveStdio()       createMcpHandler()
                  |                     |
              stdio MCP             /mcp HTTP
                                      stateless
```

The existing `/api/tools/*` REST endpoints should remain temporarily so Juniper Commerce does not break during the protocol migration. They can be deprecated or removed in a later change after Juniper consumes the MCP endpoint directly.

## Migration sequence

### PR 1 — MCP 2026-07-28 protocol and transports

- Run the official SDK v1-to-v2 codemod from `server/`.
- Replace the monolithic legacy SDK with the v2 server/node packages.
- Raise the supported Node runtime to Node 20 or newer (COF development should prefer Node 22 LTS).
- Refactor MCP tool registration into a reusable factory.
- Serve HTTP MCP at `/mcp` via `createMcpHandler(factory)`.
- Serve stdio via `serveStdio(factory)` so stdio can negotiate 2026-07-28 rather than silently staying on the legacy protocol.
- Keep the existing REST endpoints for compatibility.
- Keep authentication out of this PR except for clean seams for future middleware.

### PR 2 — MCP 2026-07-28 authorization

- Add protected-resource metadata.
- Add bearer token validation middleware.
- Validate issuer/audience/scopes according to the 2026 authorization requirements.
- Keep credential validation isolated from MCP tool/business logic.

### PR 3 — Juniper Commerce

- Move Juniper from the custom REST facade to the standards-native `/mcp` endpoint where appropriate.
- Preserve the reference server as the canonical demonstration of onX over MCP.

## Acceptance tests for PR 1

The migration is not complete until automated tests prove:

1. A 2026-07-28 client can communicate with `/mcp` without `Mcp-Session-Id`.
2. `tools/list` exposes the complete onX tool catalog.
3. `tools/call` executes against the built-in mock adapter.
4. Independent HTTP requests can be handled without shared MCP session state.
5. 2026 routing/version headers are honored by the SDK serving entry point.
6. `server/discover`/version negotiation works for a modern client.
7. Legacy compatibility, if retained, is deliberate and documented.
8. The existing `/api/tools/*` REST API remains functional during the transition.
9. The stdio entry point uses `serveStdio(factory)` rather than directly connecting a hand-built server to the old stdio transport.

## Local Codex task

From the repository root:

```bash
cd server
npx @modelcontextprotocol/codemod@latest v1-to-v2 .
npm install
npm run typecheck
npm test
```

Then use Codex with this instruction:

> Upgrade this reference server to MCP 2026-07-28 using the official TypeScript SDK v2 migration guides. Treat SDK v2 migration and 2026-era serving as separate requirements: do not stop after package/import changes. Refactor the existing onX `ToolRegistry` and `ServiceOrchestrator` behind a reusable MCP server factory. Serve HTTP at `/mcp` using `createMcpHandler(factory)` and stdio using `serveStdio(factory)`. Preserve the existing `/api/tools/*` REST API temporarily for Juniper compatibility. Add tests for modern stateless HTTP, `tools/list`, `tools/call`, independent requests, and version negotiation. Do not implement OAuth in this change. Before editing, explain the architecture and list the files you intend to change.

## References

- MCP specification revision: 2026-07-28
- MCP TypeScript SDK v2 migration guide: `docs/migration/upgrade-to-v2.md`
- MCP 2026-07-28 serving guide: `docs/migration/support-2026-07-28.md`

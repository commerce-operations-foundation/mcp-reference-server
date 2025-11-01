# Error Model

Version: 1.0.0

This document defines the canonical error taxonomy, codes, structures, and retryability guidance for the MCP server and all tools. All other docs should reference this page for authoritative definitions.

## Layers and Formats

- JSON-RPC errors: Transport/protocol-level errors per JSON-RPC 2.0.
-32700 Parse error, -32600 Invalid request, -32601 Method not found, -32602 Invalid params, -32603 Internal error.

- Domain errors: Application-level errors returned from `tools/call` results using the structure below.

## Error Structure

```typescript
interface ErrorResponse {
  code: number;            // See code ranges below
  message: string;         // Human-readable error
  retryable: boolean;      // Safe to retry with backoff
  details?: {
    field?: string;        // For validation errors
    reason?: string;       // Short machine-readable reason
    suggestion?: string;   // Optional remediation suggestion
    context?: any;         // Additional metadata (safe to expose)
  };
}
```

## Code Ranges

| Range      | Category              | Notes                                  |
|------------|-----------------------|----------------------------------------|
| 1000–1999  | Protocol              | MCP/transport/protocol semantics       |
| 2000–2999  | Validation            | Parameter/schema validation            |
| 3000–3999  | Business              | Domain/business rule violations        |
| 4000–4999  | System                | System-level/infra/timeouts            |
| 5000–5999  | Adapter/Integration   | Vendor-specific/backend integration    |

## Standard Codes

These codes SHOULD be reused by all tools where applicable.

| Code | Name                    | Category   | Retryable | Description                               |
|------|-------------------------|------------|-----------|-------------------------------------------|
| 2001 | VALIDATION_ERROR        | Validation | No        | Parameters failed schema/format checks    |
| 2002 | MISSING_REQUIRED_FIELD  | Validation | No        | Required field missing                    |
| 2003 | INVALID_FORMAT          | Validation | No        | Field format incorrect                     |
| 3001 | RATE_LIMIT_EXCEEDED     | System     | Yes       | Too many requests                          |
| 3002 | TIMEOUT                 | System     | Yes       | Operation exceeded time limit              |
| 4001 | ADAPTER_ERROR           | Adapter    | Varies    | Backend integration error (retry per data) |
| 4002 | BACKEND_UNAVAILABLE     | System     | Yes       | Downstream service unavailable             |
| 5001 | NOT_IMPLEMENTED         | Adapter    | No        | Tool unsupported by adapter                |

Adapters MAY introduce domain-specific identifiers (for example `ORDER_NOT_FOUND`, `INVALID_ORDER_STATE`) via `AdapterError`. These values are forwarded in the error payload under `details.originalError` alongside one of the standard numeric codes above.

## Mapping to JSON-RPC

- Transport-level failures use JSON-RPC error objects with standard codes.
- Tool-level failures return a successful JSON-RPC response whose `result` contains an `error` object matching ErrorResponse, or use JSON-RPC error with `-32602` (Invalid params) for protocol-level validation issues detected before tool execution.

Recommended pattern for tool execution:

```typescript
// Success
{ "jsonrpc": "2.0", "result": { /* tool-specific result */ }, "id": 1 }

// Domain failure (preferred)
{ "jsonrpc": "2.0", "result": { "error": { code: 4001, message: "Adapter error", retryable: false, details: { originalError: "ORDER_NOT_FOUND" } } }, "id": 1 }

// Protocol validation failure (schema/shape)
{ "jsonrpc": "2.0", "error": { "code": -32602, "message": "Invalid params", "data": { field: "order.customer.email" } }, "id": 1 }
```

## Retry Guidance

- retryable: true → Client SHOULD retry with exponential backoff and jitter.
- retryable: false → Client SHOULD NOT retry without changing inputs or context.

Examples:
- 3001 RATE_LIMIT_EXCEEDED, 3002 TIMEOUT, 4002 BACKEND_UNAVAILABLE → retryable: true
- 2001 VALIDATION_ERROR, 2002 MISSING_REQUIRED_FIELD, 5001 NOT_IMPLEMENTED → retryable: false

## Best Practices

- Do not include secrets/PII in `message` or `details`.
- Prefer specific codes over generic ones.
- Provide `details.field` for validation issues when possible.
- Log internal cause separately; return sanitized `message` to clients.

## References

- JSON-RPC 2.0 Specification
- MCP Specification (protocol semantics)

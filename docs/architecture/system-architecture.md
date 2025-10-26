# Commerce Operations Foundation MCP Server Architecture

**Version:** 1.0.0  
**Last Updated:** January 2025

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Design Principles](#design-principles)
3. [System Components](#system-components)
4. [Data Flow](#data-flow)
5. [Adapter Architecture](#adapter-architecture)
6. [Configuration Strategy](#configuration-strategy)
7. [Security Architecture](#security-architecture)
8. [Deployment Architecture](#deployment-architecture)

---

## Architecture Overview

The Commerce Operations Foundation MCP Server provides a standardized interface between AI agents and fulfillment systems using the Model Context Protocol (MCP).

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      AI CLIENTS LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │Claude Desktop│  │   ChatGPT    │  │ Custom Agent │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          └──────────────────┼──────────────────┘
                            │
                    MCP Protocol (stdio)
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                    MCP SERVER LAYER                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Protocol Handler → Tool Registry → Service Orchestrator│    │
│  └─────────────────────────────────────────────────────────┘    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                     Adapter Interface
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                   FULFILLMENT SYSTEMS                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                │
│  │    ERP     │  │    WMS     │  │  Custom    │                │
│  └────────────┘  └────────────┘  └────────────┘                │
└──────────────────────────────────────────────────────────────────┘
```

## Design Principles

### 1. Protocol-First Design
- Strict adherence to MCP specification
- Clear separation between protocol and business logic
- Standardized error handling across all operations

### 2. Adapter Pattern
- Pluggable backend implementations
- Consistent interface regardless of fulfillment system
- Support for multiple adapter types (built-in, NPM, local)

### 3. Defensive Programming
- Input validation at every layer
- Graceful error recovery
- Comprehensive logging and monitoring

### 4. Performance Optimization
- Configurable timeouts and retries
- Connection pooling in adapters
- Async operation support

## System Components

### Core Components

| Component | Responsibility | Source Location |
|-----------|---------------|-----------------|
| **MCP Server** | Protocol handling and transport | [`server/src/server.ts`](../../server/src/server.ts) |
| **Tool Registry** | Tool discovery and execution | [`server/src/tools/registry.ts`](../../server/src/tools/registry.ts) |
| **Service Orchestrator** | Service lifecycle management | [`server/src/services/service-orchestrator.ts`](../../server/src/services/service-orchestrator.ts) |
| **Adapter Manager** | Adapter loading and initialization | [`server/src/services/adapter-manager.ts`](../../server/src/services/adapter-manager.ts) |
| **Config Manager** | Configuration loading and validation | [`server/src/config/config-manager.ts`](../../server/src/config/config-manager.ts) |

### Service Layer

The service layer provides business logic abstraction:

- **Service Orchestrator**: Central entry point that handles order, inventory, and query workflows using the active adapter, unified logging, timeout, and retry policies.
- **Adapter Manager**: Adapter lifecycle management (initialization, cleanup, health checks).
- **Health Monitor**: Metrics tracking and health reporting.
- **Error Handler**: Consistent error processing and retry orchestration.
- **Validator**: Input/output validation.
- **Transformer**: Data transformation between formats.

See [`server/src/services/`](../../server/src/services/) for implementations.

### Tool Categories

Tools are organized into two categories:

1. **Action Tools** (`create-sales-order`, `cancel-order`, `update-order`, `fulfill-order`)
   - Located in [`server/src/tools/actions/`](../../server/src/tools/actions/)
   - Modify system state

2. **Query Tools** (`get-orders`, `get-customers`, `get-products`, `get-product-variants`, `get-inventory`, `get-fulfillments`)
   - Located in [`server/src/tools/queries/`](../../server/src/tools/queries/)
   - Read-only operations

## Data Flow

### Request Processing Pipeline

```
Client Request
    ↓
[Protocol Handler] → Parses JSON-RPC
    ↓
[Tool Registry] → Validates & routes
    ↓
[Tool Implementation] → Business logic
    ↓
[Service Layer] → Orchestrates operations
    ↓
[Adapter] → Fulfillment system integration
    ↓
[Response Transform] → Format response
    ↓
Client Response
```

### Error Handling Flow

All errors are categorized and handled appropriately:

- **Protocol Errors**: Return MCP error codes (see [`server/src/errors/`](../../server/src/errors/))
- **Business Errors**: Return structured error responses
- **System Errors**: Logged and sanitized before return

## Adapter Architecture

### Adapter Interface

All adapters must implement the `IFulfillmentAdapter` interface defined in [`server/src/types/adapter.ts`](../../server/src/types/adapter.ts).

### Adapter Types

1. **Built-in Adapters**
   - Mock adapter for testing
   - Located in [`server/src/adapters/`](../../server/src/adapters/)

2. **NPM Package Adapters**
   - Published as separate packages
   - Dynamically loaded at runtime
   - Example: `@company/cof-adapter-system`

3. **Local File Adapters**
   - Custom implementations
   - Loaded from file path

### Adapter Loading Strategy

The adapter factory ([`server/src/adapters/adapter-factory.ts`](../../server/src/adapters/adapter-factory.ts)) handles:
- Dynamic loading based on configuration
- Dependency injection
- Initialization and lifecycle management

## Configuration Strategy

### Configuration Hierarchy

Configuration is resolved in order of precedence:

1. Command-line arguments
2. Environment variables
3. Configuration file
4. Default values

See [`server/src/config/`](../../server/src/config/) for implementation.

### Key Configuration Areas

- **Server Settings**: Name, version, transport options
- **Logging**: Levels, formats, rotation
- **Adapter**: Type, name, custom configuration
- **Performance**: Timeouts, retries, rate limits
- **Security**: Sanitization, authentication (future)

## Security Architecture

### Current Security Measures

1. **Input Sanitization**
   - Sensitive data redaction in logs
   - See [`server/src/security/log-sanitizer.ts`](../../server/src/security/log-sanitizer.ts)

2. **Validation**
   - JSON Schema validation for all inputs
   - Type checking at runtime

3. **Error Handling**
   - No sensitive data in error messages
   - Structured error responses

### Future Security Enhancements

- OAuth2/JWT authentication
- Rate limiting per client
- Audit logging
- Encrypted adapter configurations

See also: [Error Model](../standard/error-model.md) for error taxonomy, codes, and retry guidance used across the server and adapters.

## Deployment Architecture

### Deployment Options

1. **Local Development**
   - Direct Node.js execution
   - Hot reload with Vite

2. **Container Deployment**
   - Docker images
   - Kubernetes support
   - See [`server/Dockerfile`](../../server/Dockerfile)

3. **Serverless**
   - Lambda/Cloud Functions compatible
   - Stateless operation

### Scalability Considerations

- Stateless server design
- Horizontal scaling support
- Connection pooling in adapters
- Configurable resource limits

### Monitoring & Observability

- Structured logging (Winston)
- Health check endpoint
- Metrics collection points
- Error tracking integration ready

## Architecture Decisions

### Decision: TypeScript
**Rationale**: Type safety, better IDE support, easier refactoring

### Decision: MCP SDK
**Rationale**: Official SDK ensures protocol compliance

### Decision: Adapter Pattern
**Rationale**: Flexibility for different fulfillment systems without core changes

### Decision: Service Layer
**Rationale**: Separation of concerns, testability, reusability

### Decision: Configuration Precedence
**Rationale**: Flexibility for different deployment environments

## Future Architecture Considerations

1. **Multi-Transport Support**
   - HTTP/WebSocket transports
   - Bidirectional communication

2. **Event-Driven Architecture**
   - Webhook support
   - Real-time updates

3. **Caching Layer**
   - Redis integration
   - Query result caching

4. **Distributed Tracing**
   - OpenTelemetry integration
   - Request correlation

## References

- [MCP Specification](https://modelcontextprotocol.io/spec)
- [Tool Reference](../standard/tools-reference.md)
- [Adapter Development Guide](../getting-started/for-fulfillment-vendors.md)
- [Configuration Guide](../guides/configuration.md)

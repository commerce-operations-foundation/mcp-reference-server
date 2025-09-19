# Commerce Operations Foundation MCP Server

## Universal Fulfillment System for the AI Era

The Commerce Operations Foundation MCP Server implements the Universal Order Interchange Standard (UOIS), providing a standardized interface between AI agents and fulfillment systems through the Model Context Protocol (MCP).

This project enables AI assistants like Claude to seamlessly interact with any fulfillment system, streamlining commerce operations from order capture through delivery.

## 📋 Project Purpose

- **Standardize Fulfillment Integration**: Define a universal protocol for fulfillment operations
- **Enable AI-Driven Commerce**: Allow AI agents to manage orders, inventory, and fulfillment
- **Simplify Implementation**: Provide plug-and-play adapters for different Fulfillment backends
- **Accelerate Innovation**: Create a foundation for next-generation commerce automation

## 📁 Project Structure

### [/server](./server/README.md)
The core Fulfillment MCP Reference server implementation that:
- Handles MCP protocol communication (stdio today, streamable http soon)
- Routes requests to appropriate adapters
- Provides 15 standard Fulfillment operations as published tools
- Includes built-in mock adapter for testing

### [/adapter-template](./adapter-template/README.md)
Template for creating custom Fulfillment adapters to allow the MCP Reference server to connect to your Fulfillment system:
- Boilerplate code for new integrations
- TypeScript interfaces and types
- Testing framework setup
- Publishing guidelines for vendors

### [/docs](./docs/README.md)
Comprehensive documentation covering:
- Universal Fulfillment System specification and standards
- Architecture and design decisions
- Integration guides for different stakeholders
- API reference and examples

### [/schemas](./schemas)
JSON Schema definitions for:
- Order data structures
- Customer information
- Product catalog
- Inventory models

## 🚀 Quick Start

### For AI Developers
Integrate order management capabilities into your AI applications:

```bash
# Install the MCP server globally
npm install -g @cof-org/mcp

# Run with mock adapter for testing
cof-mcp
```

Configure your AI platform (like Claude Desktop) to connect to the MCP server via stdio transport. See the [Installation Guide](./docs/guides/installation.md) for platform-specific setup.

### For Fulfillment Vendors
Create an adapter for your fulfillment system:

```bash
# Copy the adapter template
cp -r adapter-template your-fulfillment-adapter
cd your-fulfillment-adapter

# Install dependencies and start developing
npm install
npm run dev
```

### For Retailers & Commerce Platforms
Deploy the server with your chosen adapter:

```bash
# Clone the repository
git clone https://github.com/cof-org/mcp.git
cd mcp/server

# Configure your adapter
echo "ADAPTER_TYPE=npm" >> .env
echo "ADAPTER_NAME=@yourvendor/fulfillment-adapter" >> .env

# Install and run
npm install
npm start
```

## 🛠 Core Capabilities

The server provides 15 essential fulfillment operations:

**Order Lifecycle**
- `capture-order` - Create new orders from any channel
- `update-order` - Modify order details and line items
- `cancel-order` - Cancel orders with reason tracking
- `ship-order` - Mark orders as shipped with tracking

**Order Management**
- `hold-order` - Place orders on hold
- `split-order` - Split into multiple shipments
- `return-order` - Process returns with reasons
- `exchange-order` - Handle product exchanges
- `reserve-inventory` - Reserve inventory for orders

**Queries**
- `get-order` - Retrieve order information
- `get-customer` - Get customer details
- `get-product` - Get product information
- `get-inventory` - Check inventory levels
- `get-shipment` - Track shipment status
- `get-buyer` - Get buyer information

## 🏗 Architecture Overview

```
┌──────────────┐     ┌────────────────┐     ┌──────────────────┐
│ AI Platform  │────▶│  MCP Server    │────▶│ Fulfillment      │
│  (Claude)    │     │ (This Project) │     │   Adapter        │
└──────────────┘     └────────────────┘     └──────────────────┘
                              │                       │
                              ▼                       ▼
                         ┌─────────┐           ┌──────────┐
                         │ Schemas │           │Fulfillment│
                         │  (JSON) │           │  Backend  │
                         └─────────┘           └──────────┘
```

## 🧪 Testing

The project includes comprehensive testing at all levels:

```bash
# Run all tests
cd server
npm test

# Run specific test suites
npm run test:unit        # Unit tests
npm run test:integration # Integration tests
npm run test:e2e        # End-to-end workflows

# Test with coverage
npm run test:coverage
```

## 📚 Documentation

Documentation is available in the following locations:
- [Full Documentation](./docs/README.md) - Complete specification and guides
- [Server README](./server/README.md) - Detailed server implementation
- [Adapter Template](./adapter-template/README.md) - Creating custom adapters
- [Architecture Overview](./docs/architecture/system-architecture.md) - System design and components

## 👥 Contributing

We welcome contributions from the community! Whether you're:
- A Fulfillment vendor creating an adapter
- A developer improving the core server
- A user reporting issues or suggesting features

Please open an issue or pull request to get started.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🔗 Resources

- [Model Context Protocol](https://modelcontextprotocol.io) - The foundation protocol
- [Installation Guide](./docs/guides/installation.md) - Detailed setup instructions
- [Configuration Guide](./docs/guides/configuration.md) - All configuration options
- [Example Test Prompts](./MCP_TEST_PROMPTS.md) - Common use cases and testing scenarios

## 🎯 Get Started

Ready to revolutionize your fulfillment operations with AI?

1. **Fulfillment Vendors**: [Create your adapter](./adapter-template/README.md)
2. **AI Developers**: [Integrate the server](./server/README.md)
3. **Commerce Teams**: Deploy the solution with Docker or your preferred runtime

Together, we're building the foundation for AI-powered commerce operations.

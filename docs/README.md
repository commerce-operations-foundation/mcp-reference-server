# Order Network eXchange Standard

## Bringing Fulfillment into the Age of AI

The Order Network eXchange (onX) is an open specification built on the Model Context Protocol (MCP) that enables seamless interaction between AI agents and fulfillment systems. It provides a standardized interface for capturing, processing, and managing orders across the modern commerce ecosystem.

## 🚀 Quick Start

- **For AI Developers**: [Integrate fulfillment in minutes →](getting-started/for-ai-platforms.md)
- **For Fulfillment Vendors**: [Make your system AI-ready →](getting-started/for-fulfillment-vendors.md)

## 📚 Documentation

### Understanding the Standard
- [Problem Statement](introduction/problem-statement.md) - Why we need a universal standard
- [Why MCP?](introduction/why-mcp.md) - The technology behind the standard
- [Ecosystem Benefits](introduction/ecosystem-benefits.md) - Value for every stakeholder

### Technical Specification
- [Architecture Overview](standard/overview.md) - System design and components
- [Tools Reference](standard/tools-reference.md) - Complete API documentation
- [MCP Server Specification](specification/mcp-server-spec.md) - Protocol implementation details

### Implementation Guides
- [Installation Guide](guides/installation.md) - Get up and running
- [Configuration Guide](guides/configuration.md) - Environment and settings
- [Adapter Development](getting-started/for-fulfillment-vendors.md) - Creating custom adapters

## 🎯 Key Features

### Core Operations
The reference implementation ships with the following fulfillment operations:

**Action Tools**
- `create-sales-order` - Create new orders
- `cancel-order` - Cancel existing orders
- `update-order` - Modify order details
- `fulfill-order` - Mark orders as fulfilled

**Query Tools**
- `get-orders` - Retrieve order details
- `get-customers` - Customer information
- `get-products` - Product catalog entries
- `get-product-variants` - Product variant details
- `get-inventory` - Stock levels
- `get-fulfillments` - Fulfillment records

## 🌐 The Commerce Operations Foundation

The standard is governed by a vendor-neutral foundation ensuring:
- Open participation from all stakeholders
- Transparent governance and decision-making
- Long-term stability and evolution
- No single vendor control

## 💡 Why Adopt the Standard?

### For AI Platforms
- **Instant Commerce Capability**: Enable order operations without custom integrations
- **Vendor Agnostic**: Work with any compliant Fulfillment
- **Future Proof**: Built on MCP, the emerging standard for AI interactions

### For Fulfillment Vendors
- **AI-Ready Label**: Advertise compatibility with ChatGPT, Claude, and more
- **No Replatforming**: Add AI support without rewriting your system
- **Competitive Edge**: Differentiate with modern AI capabilities

### For Commerce Platforms
- **Reduce Integration Cost**: One standard interface for all Fulfillment connections
- **Faster Onboarding**: Predictable implementations across customers
- **AI-Native**: Support the next generation of commerce experiences

### For 3PLs and Merchants
- **Automation**: Eliminate manual order processing
- **Flexibility**: Connect any AI to any Fulfillment
- **Innovation**: Build AI-powered experiences quickly

## 🔧 Get Involved

### For Developers
```bash
git clone https://github.com/commerce-operations-foundation/mcp-reference-server.git
cd mcp-reference-server/server
npm install
npm run build
node dist/index.js
```

## 📖 Resources

- [FAQ](resources/faq.md) - Common questions answered
- [Testing Guide](testing/README.md) - Testing documentation and best practices

## 🤝 Community

- **GitHub**: [TODO Repo](https://github.com/TODO-ORG/TODO-REPO)
- **Issues**: [GitHub Issues](https://github.com/TODO-ORG/TODO-REPO/issues)
- **Discussions**: [GitHub Discussions](https://github.com/TODO-ORG/TODO-REPO/discussions)

---

*The Order Network eXchange Standard is an open specification designed to unify fulfillment in the age of AI. Join us in building the future of commerce.*

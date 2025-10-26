# Frequently Asked Questions

## General Questions

### What is the Universal Order Interchange Standard?
The Universal Order Interchange Standard (UOIS) is an open specification built on the Model Context Protocol (MCP) that enables standardized communication between AI agents and fulfillment systems. It defines a common set of tools and data formats for order operations.

### Who is behind this standard?
The standard is governed by the Commerce Operations Foundation, a vendor-neutral organization with participation from Fulfillment vendors, AI platforms, commerce platforms, 3PLs, and merchants. While initially proposed by Pipe17, no single company controls the standard.

### Is this standard free to use?
Yes, the standard is completely free to implement and use. The specification is open source, and there are no licensing fees or royalties. The Foundation may charge optional membership fees for voting rights and certification programs.

### How is this different from existing standards like EDI?
Unlike EDI, which was designed for batch processing between businesses, UOIS is:
- **AI-native**: Built for real-time agent interactions
- **Interactive**: Supports conversational workflows
- **Modern**: Uses JSON and current web technologies
- **Universal**: Works across industries and platforms

## Technical Questions

### What is MCP?
Model Context Protocol (MCP) is an open protocol developed by Anthropic that standardizes how AI systems interact with external tools and data sources. It's like USB-C for AI—a universal connector that works everywhere.

### Do I need to use a specific programming language?
No, the standard is language-agnostic. While the reference implementation is in TypeScript/JavaScript, you can implement the standard in any language that supports JSON and your chosen transport mechanism (stdio, HTTP, WebSocket).

### Can I add custom tools beyond the shipped set?
Yes! The standard defines a core set of tools, but you can add custom operations specific to your business needs. Just prefix them appropriately (e.g., `x-yourcompany-tool`) to avoid conflicts with future standard tools.

### How do I handle authentication and authorization?
Phase 1 focuses on local stdio transport without authentication. Future phases will support OAuth2, API keys, and JWT tokens. For now, implement your own authentication layer if needed for production use.

### What about real-time updates and webhooks?
The current specification focuses on request-response patterns. Real-time events and subscriptions are planned for Phase 2, likely using WebSocket transport and an event streaming model.

## Implementation Questions

### How long does implementation take?
- **Basic implementation**: 1-2 weeks for core tools
- **Full implementation**: 1-2 months for all 10 shipped tools
- **Production-ready**: 2-3 months with testing and optimization

### Do I need to implement every tool?
No, you can start with a subset. We recommend beginning with:
1. Query tools (`get-orders`, `get-inventory`)
2. Basic actions (`create-sales-order`, `cancel-order`)
3. Additional tools as needed

### Can I use my existing APIs?
Yes! The MCP server acts as an adapter layer. You don't need to change your existing APIs—just map them to the standard tool interfaces.

### How do I test my implementation?
Use the reference implementation's mock configuration:
```bash
cd mcp-reference-server/server
npm run build
ADAPTER_TYPE=built-in ADAPTER_NAME=mock LOG_LEVEL=debug node dist/index.js
```
This provides test data and validates your tool calls.

### What about backward compatibility?
The standard follows semantic versioning. Minor updates will be backward compatible. Major version changes (rare) will include migration guides and deprecation periods.

## Business Questions

### What's the ROI of implementing this standard?
Typical returns include:
- **90% reduction** in integration costs
- **85% faster** time-to-market for new channels
- **25% increase** in customer acquisition through AI channels
- **50% reduction** in ongoing maintenance

### Will this standard be widely adopted?
Indicators suggest strong adoption:
- Major AI platforms already support MCP
- Leading Fulfillment vendors have expressed interest
- Commerce platforms need standardization
- Network effects create natural adoption

### How does this affect my competitive advantage?
The standard levels the playing field for basic operations, but you can differentiate through:
- Performance and reliability
- Custom tools and extensions
- Superior AI experiences
- Value-added services

### Should I wait for the standard to mature?
No. Early adopters will:
- Shape the standard's development
- Build expertise and market position
- Capture AI-driven demand first
- Avoid the cost of being late

### What if my competitors adopt it first?
They will be able to:
- Advertise "AI-ready" capabilities
- Integrate with any AI platform quickly
- Reduce their operational costs
- Capture AI-native customers

## Security & Compliance

### Is this standard secure?
The standard includes:
- Input validation requirements
- Error handling specifications
- Audit logging guidelines
- Future authentication/authorization specs

Security implementation is your responsibility, but the standard provides guidelines.

### Does this comply with regulations (GDPR, CCPA, etc.)?
The standard is regulation-agnostic but designed to support compliance:
- Audit trails for data processing
- Customer consent workflows
- Data deletion capabilities
- Geographic routing options

### How is sensitive data protected?
The standard recommends:
- Never logging sensitive data (credit cards, SSNs)
- Using tokenization where possible
- Implementing encryption in transit
- Following PCI DSS guidelines for payment data

### What about data residency requirements?
You control where your MCP server runs and where data is processed. The standard supports geographic distribution and data localization requirements.

## Getting Started

### Where do I begin?
1. **For Developers**: Start with the [installation guide](../guides/installation.md)
2. **For Businesses**: Review the [ecosystem benefits](../introduction/ecosystem-benefits.md)
3. **For Technical Teams**: Read the [architecture overview](../standard/overview.md)

### What resources are available?
- **Documentation**: This site
- **Reference Implementation**: npm package
- **Examples**: GitHub repository (https://github.com/TODO-ORG/TODO-REPO)
- **Community**: Discord server (https://discord.gg/TODO-INVITE)
- **Support**: Email (support@todo-domain.example)

### How can I contribute?
- **Code**: Submit PRs to the reference implementation
- **Specification**: Propose improvements via RFCs
- **Documentation**: Help improve guides and examples
- **Community**: Answer questions and share experiences

### Where can I get help?
- **Discord**: Real-time community support (https://discord.gg/TODO-INVITE)
- **GitHub Issues**: Bug reports and features (https://github.com/TODO-ORG/TODO-REPO/issues)
- **Email**: standards@todo-domain.example
- **Forums**: Detailed discussions

### How do I stay updated?
- **Newsletter**: Monthly updates
- **Blog**: Major announcements
- **GitHub**: Watch the repository
- **Discord**: Join announcement channel

## Common Misconceptions

### "This will make all Fulfillment systems the same"
No, the standard only standardizes the interface, not the implementation. Fulfillment vendors still differentiate through performance, features, reliability, and customer service.

### "AI agents aren't ready for commerce"
AI agents already process millions in transactions. ChatGPT, Claude, and others have shopping capabilities. The limitation is integration, not AI capability.

### "This is too complex for small businesses"
The standard is designed for simplicity. Small businesses benefit most from plug-and-play solutions that just work without custom development.

### "My industry is too specialized"
The core operations (orders, inventory, shipping) are universal. Industry-specific needs can be handled through extensions while maintaining core compatibility.

### "This will replace existing systems"
No, this complements existing systems. It's an adapter layer that makes your current Fulfillment AI-compatible without replacement.

## Future Questions

### What's the roadmap?
- **Phase 1** (Now): Core tools, stdio transport
- **Phase 2** (Q2 2025): HTTP transport, authentication
- **Phase 3** (Q3 2025): Real-time events, subscriptions
- **Phase 4** (Q4 2025): Advanced workflows, orchestration

### Will this support B2B commerce?
Yes, B2B support includes:
- Buyer accounts and hierarchies
- Approval workflows
- Custom pricing and terms
- Bulk operations

### What about international commerce?
Planned international features:
- Multi-currency support
- Tax calculation interfaces
- Customs and duties
- Multi-language operations

### How will this evolve with AI advances?
The standard is designed to evolve:
- Semantic understanding improvements
- Multi-modal commerce (voice, vision)
- Autonomous agent capabilities
- Predictive operations

---

*Still have questions? Contact us at standards@todo-domain.example or join our [Discord community](https://discord.gg/TODO-INVITE).*

/**
 * Tools Index
 * Exports all available MCP tools
 */

export { ToolRegistry } from './registry.js';
export { ToolExecutor, ToolMetadata, ToolResult } from '../types/mcp.js';

import { ToolRegistry } from './registry.js';
import { ServiceOrchestrator } from '../services/service-orchestrator.js';

// Action Tools
import { CreateSalesOrderTool } from './actions/create-sales-order.js';
import { UpdateOrderTool } from './actions/update-order.js';
import { CancelOrderTool } from './actions/cancel-order.js';
import { FulfillOrderTool } from './actions/fulfill-order.js';

// Query Tools
import { GetOrdersTool } from './queries/get-orders.js';
import { GetCustomersTool } from './queries/get-customers.js';
import { GetProductsTool } from './queries/get-products.js';
import { GetProductVariantsTool } from './queries/get-product-variants.js';
import { GetInventoryTool } from './queries/get-inventory.js';
import { GetFulfillments } from './queries/get-fulfillments.js';

/**
 * Register all tools at once
 */
export function registerTools(registry: ToolRegistry, serviceLayer: ServiceOrchestrator): void {
  registry.register(new CreateSalesOrderTool(serviceLayer));
  registry.register(new CancelOrderTool(serviceLayer));
  registry.register(new UpdateOrderTool(serviceLayer));
  registry.register(new FulfillOrderTool(serviceLayer));
  registry.register(new GetOrdersTool(serviceLayer));
  registry.register(new GetCustomersTool(serviceLayer));
  registry.register(new GetProductsTool(serviceLayer));
  registry.register(new GetProductVariantsTool(serviceLayer));
  registry.register(new GetInventoryTool(serviceLayer));
  registry.register(new GetFulfillments(serviceLayer));
}

// Export all tool classes for external use
export * from './actions/create-sales-order.js';
export * from './actions/cancel-order.js';
export * from './actions/update-order.js';
export * from './actions/fulfill-order.js';
export * from './queries/get-orders.js';
export * from './queries/get-inventory.js';
export * from './queries/get-products.js';
export * from './queries/get-product-variants.js';
export * from './queries/get-customers.js';
export * from './queries/get-fulfillments.js';

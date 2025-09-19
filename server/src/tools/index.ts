/**
 * Tools Index
 * Exports all available MCP tools
 */

export { ToolRegistry } from './registry.js';
export { ToolExecutor, ToolMetadata, ToolResult } from '../types/mcp.js';

import { ToolRegistry } from './registry.js';
import { ServiceOrchestrator } from '../services/service-orchestrator.js';

// Action Tools
import { CaptureOrderTool } from './actions/capture-order.js';
import { CancelOrderTool } from './actions/cancel-order.js';
import { UpdateOrderTool } from './actions/update-order.js';
import { ReturnOrderTool } from './actions/return-order.js';
import { ExchangeOrderTool } from './actions/exchange-order.js';
import { ShipOrderTool } from './actions/ship-order.js';

// Query Tools
import { GetOrderTool } from './queries/get-order.js';
import { GetCustomerTool } from './queries/get-customer.js';
import { GetProductTool } from './queries/get-product.js';
import { GetInventoryTool } from './queries/get-inventory.js';
import { GetShipmentTool } from './queries/get-shipment.js';
import { GetBuyerTool } from './queries/get-buyer.js';

// Management Tools
import { HoldOrderTool } from './management/hold-order.js';
import { SplitOrderTool } from './management/split-order.js';
import { ReserveInventoryTool } from './management/reserve-inventory.js';

/**
 * Register all action tools
 */
export function registerActionTools(registry: ToolRegistry, serviceLayer: ServiceOrchestrator): void {
  registry.register(new CaptureOrderTool(serviceLayer));
  registry.register(new CancelOrderTool(serviceLayer));
  registry.register(new UpdateOrderTool(serviceLayer));
  registry.register(new ReturnOrderTool(serviceLayer));
  registry.register(new ExchangeOrderTool(serviceLayer));
  registry.register(new ShipOrderTool(serviceLayer));
}

/**
 * Register all query tools
 */
export function registerQueryTools(registry: ToolRegistry, serviceLayer: ServiceOrchestrator): void {
  registry.register(new GetOrderTool(serviceLayer));
  registry.register(new GetCustomerTool(serviceLayer));
  registry.register(new GetProductTool(serviceLayer));
  registry.register(new GetInventoryTool(serviceLayer));
  registry.register(new GetShipmentTool(serviceLayer));
  registry.register(new GetBuyerTool(serviceLayer));
}

/**
 * Register all management tools
 */
export function registerManagementTools(registry: ToolRegistry, serviceLayer: ServiceOrchestrator): void {
  registry.register(new HoldOrderTool(serviceLayer));
  registry.register(new SplitOrderTool(serviceLayer));
  registry.register(new ReserveInventoryTool(serviceLayer));
}

/**
 * Register all tools at once
 */
export function registerAllTools(registry: ToolRegistry, serviceLayer: ServiceOrchestrator): void {
  registerActionTools(registry, serviceLayer);
  registerQueryTools(registry, serviceLayer);
  registerManagementTools(registry, serviceLayer);
}

// Export all tool classes for external use
export * from './actions/capture-order.js';
export * from './actions/cancel-order.js';
export * from './actions/update-order.js';
export * from './actions/return-order.js';
export * from './actions/exchange-order.js';
export * from './actions/ship-order.js';

export * from './queries/get-order.js';
export * from './queries/get-inventory.js';
export * from './queries/get-product.js';
export * from './queries/get-customer.js';
export * from './queries/get-shipment.js';
export * from './queries/get-buyer.js';

export * from './management/hold-order.js';
export * from './management/split-order.js';
export * from './management/reserve-inventory.js';
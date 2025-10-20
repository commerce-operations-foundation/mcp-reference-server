/**
 * Get Inventory Tool
 * Retrieves inventory information for a product SKU
 */

import { BaseTool } from '../base-tool.js';
import { JSONSchema } from '../../types/mcp.js';
import { toJsonSchema } from '../../schemas/utils/schema-util.js';
import { GetInventoryInputSchema, GetInventoryInput } from '../../schemas/tool-inputs/index.js';

export class GetInventoryTool extends BaseTool {
  name = 'get-inventory';

  description =
    'Retrieves real-time stock levels and availability to check if products can be fulfilled. Use when: validating order feasibility, checking stock before promising delivery, determining fulfillment locations, or preventing overselling. Returns available, reserved, and total quantities by SKU and optional location.';

  inputSchema: JSONSchema = toJsonSchema(GetInventoryInputSchema);

  async execute(input: GetInventoryInput): Promise<any> {
    // Delegate to service layer - return raw data for MCP
    return this.serviceLayer.getInventory(input);
  }
}

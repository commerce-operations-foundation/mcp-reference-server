/**
 * Get Inventory Tool
 * Retrieves inventory information for a product SKU
 */

import { BaseTool } from '../base-tool.js';
import { JSONSchema } from '../../types/mcp.js';

export class GetInventoryTool extends BaseTool {
  name = 'get-inventory';
  
  description = 'Retrieves real-time stock levels and availability to check if products can be fulfilled. Use when: validating order feasibility, checking stock before promising delivery, determining fulfillment locations, or preventing overselling. Returns available, reserved, and total quantities by SKU and optional location.';
  
  inputSchema: JSONSchema = {
    type: 'object',
    properties: {
      sku: {
        type: 'string',
        description: 'Product SKU to get inventory for (required)'
      },
      locationId: {
        type: 'string',
        description: 'Specific warehouse/location ID (optional - if not provided, returns aggregated inventory)'
      }
    },
    required: ['sku']
  };

  async execute(input: any): Promise<any> {
    // Delegate to service layer - return raw data for MCP
    return this.serviceLayer.getInventory(input.sku, input.locationId);
  }
}
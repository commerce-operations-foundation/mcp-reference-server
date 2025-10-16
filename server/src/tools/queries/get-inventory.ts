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
      skus: {
        type: 'array',
        items: {
          type: 'string'
        },
        description: 'Product SKU to get inventory for (required)'
      },
      locationIds: {
        type: 'array',
        items: {
          type: 'string'
        },
        description: 'Specific warehouse/location ID (optional - if not provided, returns aggregated inventory)'
      },
      updatedAtMin: {
        type: 'string',
        format: 'date-time',
        description: 'Minimum updated at date'
      },
      updatedAtMax: {
        type: 'string',
        format: 'date-time',
        description: 'Maximum updated at date'
      },
      pageSize: {
        type: 'number',
        description: 'Page size',
        default: 10
      },
      skip: {
        type: 'number',
        description: 'Skip',
        default: 0
      },
    }
  };

  async execute(input: any): Promise<any> {
    // Delegate to service layer - return raw data for MCP
    return this.serviceLayer.getInventory(input.sku, input.locationId);
  }
}
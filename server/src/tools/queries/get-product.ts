/**
 * Get Product Tool
 * Retrieves product information by identifier
 */

import { BaseTool } from '../base-tool.js';
import { JSONSchema } from '../../types/mcp.js';

export class GetProductTool extends BaseTool {
  name = 'get-product';
  
  description = 'Retrieves product details including pricing, descriptions, and attributes when you need to display product information, validate SKUs, or check product availability. Use when: adding items to orders, verifying product existence, displaying catalogs, or calculating pricing. Searches by product ID or SKU.';
  
  inputSchema: JSONSchema = {
    type: 'object',
    properties: {
          ids: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Unique product ID in the Fulfillment System'
          },
          skus: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Product SKU (Stock Keeping Unit)'
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
          }
        }
  };

  async execute(input: any): Promise<any> {
    // Delegate to service layer
    return this.serviceLayer.getProduct(input.identifier);
  }
}
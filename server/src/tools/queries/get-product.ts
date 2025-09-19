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
      identifier: {
        type: 'object',
        description: 'Product identifier - at least one field required',
        properties: {
          productId: {
            type: 'string',
            description: 'Unique product ID in the Fulfillment System'
          },
          sku: {
            type: 'string',
            description: 'Product SKU (Stock Keeping Unit)'
          }
        },
        minProperties: 1,
        additionalProperties: false
      }
    },
    required: ['identifier']
  };

  async execute(input: any): Promise<any> {
    // Delegate to service layer
    return this.serviceLayer.getProduct(input.identifier);
  }
}